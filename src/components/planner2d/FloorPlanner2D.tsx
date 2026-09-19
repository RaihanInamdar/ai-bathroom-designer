import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Arc } from 'react-konva';
import { PlacedProduct, Product, ProductCategory, RoomConfig } from '../../types';
import { CATALOG_PRODUCTS } from '../../data/products';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Repeat,
  RotateCw,
  ShieldCheck,
  Zap,
  ArrowLeftRight,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';

interface FloorPlanner2DProps {
  room: RoomConfig;
  products: PlacedProduct[];
  onUpdateRoom?: (room: RoomConfig) => void;
  onUpdateProducts: (products: PlacedProduct[]) => void;
  onOpenSwapCatalog?: (product: PlacedProduct) => void;
  showClearanceZones?: boolean;
  onToggleClearanceZones?: (val: boolean) => void;
}

const MIN_STAGE_WIDTH = 520;
const MIN_STAGE_HEIGHT = 460;
const PADDING = 60;
const ADDABLE_ITEMS: { label: string; category: ProductCategory; minArea: number }[] = [
  { label: 'Bathtub', category: 'bathtub', minArea: 75 },
  { label: 'Vanity', category: 'vanity', minArea: 70 },
  { label: 'Mirror', category: 'mirror', minArea: 55 },
  { label: 'Accessory', category: 'accessory', minArea: 45 },
  { label: 'Shower', category: 'shower', minArea: 80 }
];

export const FloorPlanner2D: React.FC<FloorPlanner2DProps> = ({
  room,
  products,
  onUpdateRoom,
  onUpdateProducts,
  onOpenSwapCatalog,
  showClearanceZones: propShowClearance,
  onToggleClearanceZones
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 750, height: 550 });
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [internalShowClearance, setInternalShowClearance] = useState(true);
  const showClearanceZones = propShowClearance !== undefined ? propShowClearance : internalShowClearance;
  const setShowClearanceZones = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(showClearanceZones) : val;
    setInternalShowClearance(nextVal);
    onToggleClearanceZones?.(nextVal);
  };
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({
        width: Math.max(MIN_STAGE_WIDTH, Math.round(width)),
        height: Math.max(MIN_STAGE_HEIGHT, Math.round(height))
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const scaleX = (stageSize.width - PADDING * 2) / room.length;
    const scaleY = (stageSize.height - PADDING * 2) / room.width;
    const scale = Math.max(1, Math.min(scaleX, scaleY));
    const offsetX = (stageSize.width - room.length * scale) / 2;
    const offsetY = (stageSize.height - room.width * scale) / 2;

    return {
      scale,
      offsetX,
      offsetY,
      ftToPxX: (ftX: number) => offsetX + ftX * scale,
      ftToPxY: (ftY: number) => offsetY + ftY * scale,
      pxToFtX: (pxX: number) => Math.max(0.5, Math.min(room.length - 0.5, (pxX - offsetX) / scale)),
      pxToFtY: (pxY: number) => Math.max(0.5, Math.min(room.width - 0.5, (pxY - offsetY) / scale))
    };
  }, [room.length, room.width, stageSize.height, stageSize.width]);

  const getDoorCenter = () => {
    const doorOffset = room.door.offset || 2.0;
    const doorWidth = room.door.width || 2.5;

    if (room.door.wall === 'north') return { x: doorOffset + doorWidth / 2, y: 0 };
    if (room.door.wall === 'west') return { x: 0, y: doorOffset + doorWidth / 2 };
    if (room.door.wall === 'east') return { x: room.length, y: doorOffset + doorWidth / 2 };
    return { x: doorOffset + doorWidth / 2, y: room.width };
  };

  const getCollisionWarning = (p: PlacedProduct): { hasViolation: boolean; message: string; distance: number } => {
    // Faucets, mirrors, and wall accessories do not clash with floor footprints
    if (p.mountType === 'countertop' || p.mountType === 'wall' || p.category === 'faucet' || p.category === 'mirror' || p.category === 'accessory') {
      return { hasViolation: false, message: '', distance: 2.5 };
    }

    const isRotatedP = p.rotation === 90 || p.rotation === 270;
    const pW = isRotatedP ? p.depth : p.width;
    const pD = isRotatedP ? p.width : p.depth;

    for (const other of products) {
      if (other.instanceId === p.instanceId) continue;
      if (other.mountType === 'countertop' || other.mountType === 'wall' || other.category === 'faucet' || other.category === 'mirror' || other.category === 'accessory') {
        continue;
      }

      const isRotatedOther = other.rotation === 90 || other.rotation === 270;
      const otherW = isRotatedOther ? other.depth : other.width;
      const otherD = isRotatedOther ? other.width : other.depth;

      const dx = Math.abs(p.x - other.x);
      const dy = Math.abs(p.y - other.y);
      const minX = (pW + otherW) / 2;
      const minY = (pD + otherD) / 2;

      if (dx < minX + 0.15 && dy < minY + 0.15) {
        const available = Math.min(dx - minX, dy - minY) + 0.15;
        return {
          hasViolation: true,
          message: `Clearance violation: required 1.5 ft, available ${Math.max(0.1, available).toFixed(1)} ft with ${other.name}`,
          distance: Number(Math.max(0.1, available).toFixed(1))
        };
      }
    }

    // Door swing collision check based on hinge trajectory
    const door = room.door;
    const doorWidth = door.width || 2.5;
    const doorOffset = door.offset || 1.5;
    const hingeX = (door.wall === 'north' || door.wall === 'south') ? doorOffset : (door.wall === 'west' ? 0 : room.length);
    const hingeY = (door.wall === 'west' || door.wall === 'east') ? doorOffset : (door.wall === 'north' ? 0 : room.width);
    const distToHinge = Math.hypot(p.x - hingeX, p.y - hingeY);
    const requiredDoorClearance = doorWidth + Math.min(pW, pD) / 2 * 0.5;

    const isInDoorZone = 
      (door.wall === 'south' && p.y > room.width - doorWidth - 0.2 && Math.abs(p.x - (doorOffset + doorWidth / 2)) < doorWidth * 1.2) ||
      (door.wall === 'north' && p.y < doorWidth + 0.2 && Math.abs(p.x - (doorOffset + doorWidth / 2)) < doorWidth * 1.2) ||
      (door.wall === 'west' && p.x < doorWidth + 0.2 && Math.abs(p.y - (doorOffset + doorWidth / 2)) < doorWidth * 1.2) ||
      (door.wall === 'east' && p.x > room.length - doorWidth - 0.2 && Math.abs(p.y - (doorOffset + doorWidth / 2)) < doorWidth * 1.2);

    if (distToHinge < requiredDoorClearance && isInDoorZone) {
      return {
        hasViolation: true,
        message: `Door swing obstruction: required ${doorWidth.toFixed(1)} ft, available ${distToHinge.toFixed(1)} ft`,
        distance: Number(distToHinge.toFixed(1))
      };
    }

    return { hasViolation: false, message: '', distance: 2.5 };
  };

  const selectedProduct = products.find((p) => p.instanceId === selectedInstanceId) || null;
  const selectedWarning = selectedProduct ? getCollisionWarning(selectedProduct) : null;
  const roomArea = room.length * room.width;

  const handleRotate = (instanceId: string) => {
    const target = products.find((p) => p.instanceId === instanceId);
    if (!target) return;

    if (target.category === 'vanity') {
      const nextRot = (target.rotation + 90) % 360;
      onUpdateProducts(products.map((p) => {
        if (p.instanceId === instanceId || p.category === 'faucet' || p.category === 'mirror') {
          return { ...p, rotation: nextRot };
        }
        return p;
      }));
    } else {
      onUpdateProducts(products.map((p) => (
        p.instanceId === instanceId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )));
    }
  };

  const handleRemoveProduct = (instanceId: string) => {
    const target = products.find((p) => p.instanceId === instanceId);
    if (!target) return;

    if (target.category === 'vanity') {
      onUpdateProducts(products.filter((p) => p.instanceId !== instanceId && p.category !== 'faucet' && p.category !== 'mirror'));
    } else {
      onUpdateProducts(products.filter((p) => p.instanceId !== instanceId));
    }
    setSelectedInstanceId(null);
  };

  const handleDragMove = (instanceId: string, x: number, y: number) => {
    const target = products.find((p) => p.instanceId === instanceId);
    if (!target) return;

    const newX = Math.max(0.2, Math.min(room.length - 0.2, Number(geometry.pxToFtX(x).toFixed(2))));
    const newY = Math.max(0.2, Math.min(room.width - 0.2, Number(geometry.pxToFtY(y).toFixed(2))));
    const dx = newX - target.x;
    const dy = newY - target.y;

    if (target.category === 'vanity') {
      onUpdateProducts(products.map((p) => {
        if (p.instanceId === instanceId) {
          return { ...p, x: newX, y: newY };
        }
        if (p.category === 'faucet' || p.category === 'mirror') {
          return { ...p, x: Number((p.x + dx).toFixed(2)), y: Number((p.y + dy).toFixed(2)) };
        }
        return p;
      }));
    } else {
      onUpdateProducts(products.map((p) => (
        p.instanceId === instanceId ? { ...p, x: newX, y: newY } : p
      )));
    }
  };

  const findProductToAdd = (category: ProductCategory): Product | null => {
    const alreadyUsedIds = new Set(products.map((product) => product.id));
    const candidates = CATALOG_PRODUCTS
      .filter((product) => product.category === category)
      .filter((product) => product.width + 0.3 <= room.length && product.depth + 0.3 <= room.width)
      .sort((a, b) => {
        const aAlreadyUsed = alreadyUsedIds.has(a.id) ? 1 : 0;
        const bAlreadyUsed = alreadyUsedIds.has(b.id) ? 1 : 0;
        return aAlreadyUsed - bAlreadyUsed || a.price - b.price;
      });

    return candidates[0] || null;
  };

  const findOpenPlacement = (product: Product) => {
    const candidatePoints = [
      { x: room.length * 0.5, y: room.width * 0.5 },
      { x: room.length * 0.28, y: room.width * 0.55 },
      { x: room.length * 0.72, y: room.width * 0.55 },
      { x: product.width / 2 + 0.35, y: room.width - product.depth / 2 - 0.45 },
      { x: room.length - product.width / 2 - 0.45, y: room.width - product.depth / 2 - 0.45 }
    ];

    return candidatePoints.find((point) => {
      const overlaps = products.some((existing) => {
        const dx = Math.abs(point.x - existing.x);
        const dy = Math.abs(point.y - existing.y);
        return dx < (product.width + existing.width) / 2 + 0.5 && dy < (product.depth + existing.depth) / 2 + 0.5;
      });

      return !overlaps;
    }) || candidatePoints[0];
  };

  const handleAddFixture = (category: ProductCategory) => {
    const product = findProductToAdd(category);
    if (!product) return;

    const placement = findOpenPlacement(product);
    const rotation = category === 'vanity' && placement.x > room.length * 0.65 ? 90 : 0;
    const newProduct: PlacedProduct = {
      ...product,
      instanceId: `manual-${product.id}-${Date.now()}`,
      x: Number(placement.x.toFixed(2)),
      y: Number(placement.y.toFixed(2)),
      rotation,
      wallAttached: category === 'bathtub' ? 'none' : 'south',
      score: 90,
      reason: `Manually added ${product.category.replace('_', ' ')} because the room has ${roomArea.toFixed(0)} sq.ft available.`
    };

    onUpdateProducts([...products, newProduct]);
    setSelectedInstanceId(newProduct.instanceId);
  };

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= room.length; x += 1) {
      const px = geometry.ftToPxX(x);
      lines.push(
        <Line
          key={`gx-${x}`}
          points={[px, geometry.ftToPxY(0), px, geometry.ftToPxY(room.width)]}
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth={1}
        />
      );
    }

    for (let y = 0; y <= room.width; y += 1) {
      const py = geometry.ftToPxY(y);
      lines.push(
        <Line
          key={`gy-${y}`}
          points={[geometry.ftToPxX(0), py, geometry.ftToPxX(room.length), py]}
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  const handleUpdateOpeningOffset = (type: 'door' | 'window', newOffset: number) => {
    if (!onUpdateRoom) return;
    if (type === 'door') {
      const isHoriz = room.door.wall === 'north' || room.door.wall === 'south';
      const maxOffset = isHoriz
        ? room.length - (room.door.width || 2.5) - 0.2
        : room.width - (room.door.width || 2.5) - 0.2;
      const clamped = Math.max(0.2, Math.min(maxOffset, newOffset));
      onUpdateRoom({ ...room, door: { ...room.door, offset: Number(clamped.toFixed(2)) } });
    } else if (room.window) {
      const isHoriz = room.window.wall === 'north' || room.window.wall === 'south';
      const maxOffset = isHoriz
        ? room.length - (room.window.width || 3.0) - 0.2
        : room.width - (room.window.width || 3.0) - 0.2;
      const clamped = Math.max(0.2, Math.min(maxOffset, newOffset));
      onUpdateRoom({ ...room, window: { ...room.window, offset: Number(clamped.toFixed(2)) } });
    }
  };

  const handleFlipDoorSwing = () => {
    if (!onUpdateRoom) return;
    const currentSwing = room.door.swing || 'inward';
    const nextSwing = currentSwing === 'outward' ? 'inward' : 'outward';
    onUpdateRoom({
      ...room,
      door: {
        ...room.door,
        swing: nextSwing
      }
    });
  };

  const renderOpening = (opening: RoomConfig['door'], label: string, color: string) => {
    const width = opening.width || 2.5;
    const start = opening.offset || 2.0;
    const end = start + width;
    const isEntryDoor = label === 'ENTRY';
    const isOutward = opening.swing === 'outward';
    const doorPx = width * geometry.scale;

    if (opening.wall === 'north' || opening.wall === 'south') {
      const isNorth = opening.wall === 'north';
      const y = geometry.ftToPxY(isNorth ? 0 : room.width);
      const labelY = y + (isNorth ? -22 : 22);
      const hingeX = geometry.ftToPxX(start);
      const openY = isNorth
        ? (isOutward ? y - doorPx : y + doorPx)
        : (isOutward ? y + doorPx : y - doorPx);
      const arcRotation = isNorth
        ? (isOutward ? 270 : 0)
        : (isOutward ? 0 : 270);
      const maxOffset = room.length - width - 0.2;

      return (
        <React.Fragment key={`${label}-${opening.wall}`}>
          {/* Wall Opening Cutout / Frame */}
          <Line
            points={[geometry.ftToPxX(start), y, geometry.ftToPxX(end), y]}
            stroke={color}
            strokeWidth={8}
            lineCap="square"
          />

          {/* Interactive Draggable Center Grip Handle */}
          <Group
            x={geometry.ftToPxX(start + width / 2)}
            y={y}
            draggable
            dragBoundFunc={(pos) => {
              const minPx = geometry.ftToPxX(0.2 + width / 2);
              const maxPx = geometry.ftToPxX(maxOffset + width / 2);
              return {
                x: Math.max(minPx, Math.min(maxPx, pos.x)),
                y
              };
            }}
            onDragMove={(e) => {
              const newCenterFt = geometry.pxToFtX(e.target.x());
              handleUpdateOpeningOffset(isEntryDoor ? 'door' : 'window', newCenterFt - width / 2);
            }}
          >
            <Rect
              x={-14}
              y={-7}
              width={28}
              height={14}
              fill="#0f172a"
              stroke={color}
              strokeWidth={1.5}
              cornerRadius={7}
            />
            <Circle x={-5} y={0} radius={2} fill={color} />
            <Circle x={0} y={0} radius={2} fill={color} />
            <Circle x={5} y={0} radius={2} fill={color} />
          </Group>

          {/* Door leaf & swing arc for entry door */}
          {isEntryDoor && (
            <>
              {/* Open door panel line */}
              <Line
                points={[hingeX, y, hingeX, openY]}
                stroke="#38bdf8"
                strokeWidth={2.5}
                lineCap="round"
              />
              {/* Door swing trajectory arc - clickable to flip swing! */}
              <Arc
                x={hingeX}
                y={y}
                innerRadius={0}
                outerRadius={doorPx}
                angle={90}
                rotation={arcRotation}
                stroke="rgba(56, 189, 248, 0.5)"
                strokeWidth={1.5}
                dash={[5, 4]}
                fill="rgba(56, 189, 248, 0.08)"
                onClick={handleFlipDoorSwing}
                onTap={handleFlipDoorSwing}
              />
            </>
          )}

          <Text
            text={`${label} (${width}' | ${start.toFixed(1)}')`}
            x={geometry.ftToPxX(start)}
            y={labelY - 6}
            width={width * geometry.scale}
            align="center"
            fill="#94a3b8"
            fontFamily="monospace"
            fontSize={10}
            fontStyle="bold"
          />
        </React.Fragment>
      );
    }

    const isWest = opening.wall === 'west';
    const x = geometry.ftToPxX(isWest ? 0 : room.length);
    const labelX = x + (isWest ? -68 : 20);
    const hingeY = geometry.ftToPxY(start);
    const openX = isWest
      ? (isOutward ? x - doorPx : x + doorPx)
      : (isOutward ? x + doorPx : x - doorPx);
    const arcRotation = isWest
      ? (isOutward ? 180 : 0)
      : (isOutward ? 270 : 90);
    const maxOffset = room.width - width - 0.2;

    return (
      <React.Fragment key={`${label}-${opening.wall}`}>
        <Line
          points={[x, geometry.ftToPxY(start), x, geometry.ftToPxY(end)]}
          stroke={color}
          strokeWidth={8}
          lineCap="square"
        />

        {/* Interactive Draggable Center Grip Handle */}
        <Group
          x={x}
          y={geometry.ftToPxY(start + width / 2)}
          draggable
          dragBoundFunc={(pos) => {
            const minPx = geometry.ftToPxY(0.2 + width / 2);
            const maxPx = geometry.ftToPxY(maxOffset + width / 2);
            return {
              x,
              y: Math.max(minPx, Math.min(maxPx, pos.y))
            };
          }}
          onDragMove={(e) => {
            const newCenterFt = geometry.pxToFtY(e.target.y());
            handleUpdateOpeningOffset(isEntryDoor ? 'door' : 'window', newCenterFt - width / 2);
          }}
        >
          <Rect
            x={-7}
            y={-14}
            width={14}
            height={28}
            fill="#0f172a"
            stroke={color}
            strokeWidth={1.5}
            cornerRadius={7}
          />
          <Circle x={0} y={-5} radius={2} fill={color} />
          <Circle x={0} y={0} radius={2} fill={color} />
          <Circle x={0} y={5} radius={2} fill={color} />
        </Group>

        {isEntryDoor && (
          <>
            <Line
              points={[x, hingeY, openX, hingeY]}
              stroke="#38bdf8"
              strokeWidth={2.5}
              lineCap="round"
            />
            <Arc
              x={x}
              y={hingeY}
              innerRadius={0}
              outerRadius={doorPx}
              angle={90}
              rotation={arcRotation}
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth={1.5}
              dash={[5, 4]}
              fill="rgba(56, 189, 248, 0.08)"
              onClick={handleFlipDoorSwing}
              onTap={handleFlipDoorSwing}
            />
          </>
        )}
        <Text
          text={`${label} (${width}' | ${start.toFixed(1)}')`}
          x={labelX}
          y={geometry.ftToPxY(start + width / 2) - 6}
          width={60}
          align="center"
          fill="#94a3b8"
          fontFamily="monospace"
          fontSize={10}
          fontStyle="bold"
        />
      </React.Fragment>
    );
  };

  return (
    <div
      className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 flex flex-col shadow-2xl"
    >
      {/* --- TOP HUD TOOLBAR --- */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/85 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-100">2D ARCHITECTURAL CAD</span>
          <span className="text-[10px] font-mono text-slate-400 border-l border-slate-800 pl-2">
            {room.length}' × {room.width}'
          </span>
          <span className="hidden md:inline text-[10px] font-mono text-slate-500">
            (1ft = {Math.round(geometry.scale)}px)
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg text-xs">
          {/* Add Fixture Dropdown Button */}
          {roomArea >= 45 && (
            <button
              onClick={() => {
                setShowAddMenu(!showAddMenu);
                setShowRoomSettings(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                showAddMenu
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Fixture</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Room & Openings Popover Button */}
          {onUpdateRoom && (
            <button
              onClick={() => {
                setShowRoomSettings(!showRoomSettings);
                setShowAddMenu(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                showRoomSettings
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(14,165,233,0.4)]'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span>Room & Doors</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showRoomSettings ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Clearance Zones Toggle */}
          <button
            onClick={() => setShowClearanceZones(!showClearanceZones)}
            title="Toggle architectural clearance zones"
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              showClearanceZones
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clearance {showClearanceZones ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* --- ADD FIXTURE POPOVER --- */}
      {showAddMenu && (
        <div className="absolute top-16 right-44 z-30 w-48 p-2 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 mb-1 flex items-center justify-between">
            <span>Add Fixture</span>
            <button onClick={() => setShowAddMenu(false)} className="text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {ADDABLE_ITEMS.filter((item) => roomArea >= item.minArea).map((item) => (
              <button
                key={item.category}
                onClick={() => {
                  handleAddFixture(item.category);
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 flex items-center justify-between transition-colors"
              >
                <span>{item.label}</span>
                <Plus className="w-3.5 h-3.5 text-amber-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- ROOM & DOORS SETTINGS POPOVER --- */}
      {showRoomSettings && onUpdateRoom && (
        <div className="absolute top-16 right-16 z-30 w-72 p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-auto flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              Room & Openings Spec
            </span>
            <button
              onClick={() => setShowRoomSettings(false)}
              className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Room Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Length (ft)</span>
              <input
                type="number"
                min="5"
                max="18"
                step="0.5"
                value={room.length}
                onChange={(e) => onUpdateRoom({ ...room, length: Number(e.target.value) || room.length })}
                className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Width (ft)</span>
              <input
                type="number"
                min="4"
                max="14"
                step="0.5"
                value={room.width}
                onChange={(e) => onUpdateRoom({ ...room, width: Number(e.target.value) || room.width })}
                className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </label>
          </div>

          {/* Door Offset & Swing */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 font-medium">
                🚪 Door Position: <strong>{(room.door.offset || 2).toFixed(1)} ft</strong>
              </span>
              <button
                onClick={handleFlipDoorSwing}
                title="Flip door swing inward / outward"
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-white text-[10px] font-bold text-sky-400 flex items-center gap-1 transition-all"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span className="capitalize">{room.door.swing || 'inward'}</span>
              </button>
            </div>
            <input
              type="range"
              min="0.3"
              max={(room.door.wall === 'north' || room.door.wall === 'south' ? room.length : room.width) - (room.door.width || 2.5) - 0.2}
              step="0.1"
              value={room.door.offset || 2}
              onChange={(e) => handleUpdateOpeningOffset('door', parseFloat(e.target.value))}
              className="w-full h-1.5 accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Window Offset if present */}
          {room.window && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-300 font-medium">
                🪟 Window Position: <strong>{(room.window.offset || 2).toFixed(1)} ft</strong>
              </span>
              <input
                type="range"
                min="0.3"
                max={(room.window.wall === 'north' || room.window.wall === 'south' ? room.length : room.width) - (room.window.width || 3.0) - 0.2}
                step="0.1"
                value={room.window.offset || 2}
                onChange={(e) => handleUpdateOpeningOffset('window', parseFloat(e.target.value))}
                className="w-full h-1.5 accent-purple-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="flex-1 w-full h-full">
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="#020617" />
            <Rect
              x={geometry.offsetX}
              y={geometry.offsetY}
              width={room.length * geometry.scale}
              height={room.width * geometry.scale}
              fill="#0f172a"
              stroke="#475569"
              strokeWidth={3}
              cornerRadius={4}
            />

            {renderGrid()}
            {renderOpening(room.door, 'ENTRY', '#38bdf8')}
            {room.window && renderOpening(room.window, 'WINDOW', '#a78bfa')}

            {products.map((p) => {
              const isSelected = p.instanceId === selectedInstanceId;
              const warning = getCollisionWarning(p);
              const pw = p.width * geometry.scale;
              const pd = p.depth * geometry.scale;
              const clearanceWidth = pw + p.clearance.sides * 2 * geometry.scale;
              const clearanceHeight = pd + p.clearance.front * geometry.scale;

              return (
                <Group
                  key={p.instanceId}
                  x={geometry.ftToPxX(p.x)}
                  y={geometry.ftToPxY(p.y)}
                  rotation={p.rotation}
                  draggable={p.category !== 'faucet' && p.category !== 'mirror'}
                  onMouseDown={() => setSelectedInstanceId(p.instanceId)}
                  onTap={() => setSelectedInstanceId(p.instanceId)}
                  onDragMove={(event) => handleDragMove(p.instanceId, event.target.x(), event.target.y())}
                >
                  {showClearanceZones && p.mountType !== 'countertop' && p.mountType !== 'wall' && (
                    <Rect
                      x={-clearanceWidth / 2}
                      y={-pd / 2}
                      width={clearanceWidth}
                      height={clearanceHeight}
                      fill={warning.hasViolation ? 'rgba(239, 68, 68, 0.18)' : 'rgba(234, 179, 8, 0.08)'}
                      stroke={warning.hasViolation ? '#ef4444' : '#eab308'}
                      strokeWidth={1.5}
                      dash={[4, 4]}
                      cornerRadius={4}
                    />
                  )}

                  {/* Specific Architectural CAD Rendering by Category */}
                  {p.category === 'faucet' ? (
                    <Group>
                      <Circle
                        radius={9}
                        fill={isSelected ? '#38bdf8' : '#d4af37'}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        shadowColor="#d4af37"
                        shadowBlur={isSelected ? 8 : 0}
                      />
                      <Line points={[0, 0, 0, 7]} stroke="#ffffff" strokeWidth={2} lineCap="round" />
                    </Group>
                  ) : p.category === 'mirror' ? (
                    <Group>
                      <Rect
                        x={-pw / 2}
                        y={-pd / 2}
                        width={pw}
                        height={Math.max(8, pd * 0.18)}
                        fill={isSelected ? '#0284c7' : '#0369a1'}
                        stroke="#38bdf8"
                        strokeWidth={1.5}
                        cornerRadius={2}
                        shadowColor="#38bdf8"
                        shadowBlur={6}
                      />
                      <Text
                        text="LED MIRROR"
                        x={-pw / 2}
                        y={-pd / 2 - 12}
                        width={pw}
                        align="center"
                        fill="#38bdf8"
                        fontSize={8}
                        fontFamily="monospace"
                        fontStyle="bold"
                      />
                    </Group>
                  ) : (
                    <>
                      {/* Main Fixture Body */}
                      <Rect
                        x={-pw / 2}
                        y={-pd / 2}
                        width={pw}
                        height={pd}
                        fill={warning.hasViolation ? '#7f1d1d' : isSelected ? '#1e293b' : '#334155'}
                        stroke={warning.hasViolation ? '#ef4444' : isSelected ? '#38bdf8' : '#94a3b8'}
                        strokeWidth={isSelected || warning.hasViolation ? 2.5 : 1.5}
                        cornerRadius={p.category === 'bathtub' ? pw * 0.35 : 4}
                        shadowColor={isSelected ? '#38bdf8' : '#000000'}
                        shadowBlur={isSelected ? 10 : 0}
                      />

                      {/* Vanity Basin & Faucet Detail */}
                      {p.category === 'vanity' && (
                        <>
                          <Rect
                            x={-pw * 0.32}
                            y={-pd * 0.28}
                            width={pw * 0.64}
                            height={pd * 0.56}
                            fill="#f8fafc"
                            stroke="#cbd5e1"
                            strokeWidth={1.5}
                            cornerRadius={Math.min(pw * 0.32, pd * 0.28)}
                          />
                          <Circle
                            x={0}
                            y={-pd * 0.18}
                            radius={4}
                            fill="#d4af37"
                            stroke="#ffffff"
                            strokeWidth={1}
                          />
                        </>
                      )}

                      {/* Toilet Tank & Bowl Detail */}
                      {(p.category === 'smart_toilet' || p.category === 'toilet') && (
                        <>
                          <Rect
                            x={-pw * 0.42}
                            y={-pd / 2 + 2}
                            width={pw * 0.84}
                            height={pd * 0.28}
                            fill="#f8fafc"
                            stroke="#94a3b8"
                            strokeWidth={1}
                            cornerRadius={2}
                          />
                          <Rect
                            x={-pw * 0.35}
                            y={-pd / 2 + pd * 0.28}
                            width={pw * 0.7}
                            height={pd * 0.65}
                            fill="#f1f5f9"
                            stroke="#cbd5e1"
                            strokeWidth={1.5}
                            cornerRadius={pw * 0.35}
                          />
                        </>
                      )}

                      {/* Shower Drain & Glass Partition */}
                      {p.category === 'shower' && (
                        <>
                          <Circle
                            x={pw * 0.25}
                            y={-pd * 0.25}
                            radius={5}
                            fill="#94a3b8"
                            stroke="#64748b"
                            strokeWidth={1}
                          />
                          <Line
                            points={[-pw / 2, pd / 2, pw / 2, pd / 2]}
                            stroke="#38bdf8"
                            strokeWidth={3}
                            lineCap="round"
                          />
                        </>
                      )}

                      {/* Bathtub Oval Interior */}
                      {p.category === 'bathtub' && (
                        <Rect
                          x={-pw * 0.42}
                          y={-pd * 0.38}
                          width={pw * 0.84}
                          height={pd * 0.76}
                          fill="#0284c7"
                          opacity={0.3}
                          stroke="#38bdf8"
                          strokeWidth={1.5}
                          cornerRadius={pw * 0.35}
                        />
                      )}

                      <Text
                        text={p.category === 'smart_toilet' ? 'Smart Toilet' : p.category === 'vanity' ? 'Vanity' : p.category === 'shower' ? 'Shower' : p.name.split(' ')[0]}
                        x={-pw / 2}
                        y={-8}
                        width={pw}
                        align="center"
                        fill="#ffffff"
                        fontSize={10}
                        fontStyle="bold"
                      />
                      <Text
                        text={`${p.width}' x ${p.depth}'`}
                        x={-pw / 2}
                        y={6}
                        width={pw}
                        align="center"
                        fill="#94a3b8"
                        fontSize={8}
                        fontFamily="monospace"
                      />
                    </>
                  )}

                  {warning.hasViolation && (
                    <Circle
                      x={pw / 2}
                      y={-pd / 2}
                      radius={6}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {selectedProduct && (
        <div className="absolute bottom-4 left-4 right-4 glass-panel p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-gold-400 shrink-0 border border-slate-700">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">{selectedProduct.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                  Rs. {selectedProduct.price.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Position: ({selectedProduct.x}', {selectedProduct.y}') | Rotation: {selectedProduct.rotation} deg
              </p>
            </div>
          </div>

          {selectedWarning && selectedWarning.hasViolation ? (
            <div className="flex items-center gap-2 bg-red-950/80 text-red-300 border border-red-800 px-3 py-1.5 rounded-xl font-mono text-[11px] animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{selectedWarning.message}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-3 py-1.5 rounded-xl font-mono text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No overlap warning in current 2D state</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRotate(selectedProduct.instanceId)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-brand-400" />
              Rotate 90
            </button>
            {onOpenSwapCatalog && (
              <button
                onClick={() => onOpenSwapCatalog(selectedProduct)}
                className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Repeat className="w-3.5 h-3.5" />
                Swap Model
              </button>
            )}
            <button
              onClick={() => handleRemoveProduct(selectedProduct.instanceId)}
              title="Remove this fixture from layout"
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 hover:border-rose-500 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
