import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { PlacedProduct, RoomConfig, DesignStyle, Product } from '../../types';
import { MaterialFactory, SurfaceFinishes } from './MaterialFactory';
import { createFixtureMesh } from './ProceduralMeshes';
import { CATALOG_PRODUCTS } from '../../data/products';
import { TILES_CATALOG } from '../../data/tiles';
import {
  Camera,
  Compass,
  Eye,
  Maximize2,
  Moon,
  Repeat,
  Sparkles,
  Sun,
  Ruler,
  Layers,
  Sliders,
  Palette,
  Droplets,
  Move,
  Trash2
} from 'lucide-react';

interface ThreeStudioProps {
  room: RoomConfig;
  products: PlacedProduct[];
  style: DesignStyle;
  finishes?: SurfaceFinishes;
  selectedProductId?: string | null;
  onSelectProduct?: (product: PlacedProduct | null) => void;
  onUpdateProducts?: (products: PlacedProduct[]) => void;
  onUpdateFinishes?: (finishes: SurfaceFinishes) => void;
  showRunningWater?: boolean;
  onToggleRunningWater?: (enabled: boolean) => void;
  showDimensions3D?: boolean;
  onToggleDimensions3D?: (enabled: boolean) => void;
  showCeiling?: boolean;
  onToggleCeiling?: (enabled: boolean) => void;
  isCutaway?: boolean;
  onToggleCutaway?: (enabled: boolean) => void;
}

export type AtmosphereMode = 'daylight' | 'warm_spa' | 'evening_mood';
export type GraphicsQuality = 'ultra' | 'balanced' | 'performance';
export type CameraViewPreset = 'perspective' | 'top' | 'eye_level' | 'shower' | 'vanity' | 'focal';

interface SceneProps extends ThreeStudioProps {
  atmosphere: AtmosphereMode;
  qualityPreset: GraphicsQuality;
  showRunningWater: boolean;
  activeCameraView: CameraViewPreset;
  showCeiling: boolean;
  showDimensions3D: boolean;
  isCutaway: boolean;
  onSelectSurface: (surface: 'floor' | 'wall') => void;
  onSpotlightProduct: (product: PlacedProduct | null) => void;
  isDraggingProduct: boolean;
  setIsDraggingProduct: (dragging: boolean) => void;
  onDragProduct: (product: PlacedProduct, newX: number, newY: number) => void;
}

function CameraRig({
  room,
  activeCameraView,
  focalProduct,
  products
}: {
  room: RoomConfig;
  activeCameraView: CameraViewPreset;
  focalProduct: PlacedProduct | null;
  products: PlacedProduct[];
}) {
  const L = room.length;
  const W = room.width;
  const H = room.height;
  const radius = Math.max(8, Math.sqrt(L * L + W * W + H * H) * 1.05);

  let position: [number, number, number];
  let fov = 45;

  const showerProduct = products.find(p => p.category === 'shower' || p.category === 'bathtub');
  const vanityProduct = products.find(p => p.category === 'vanity');

  if (activeCameraView === 'top') {
    position = [L / 2, radius * 1.3, W / 2];
    fov = 36;
  } else if (activeCameraView === 'eye_level') {
    position = [room.door.offset || Math.max(1.8, L * 0.25), 5.0, W - 0.4];
    fov = 64;
  } else if (activeCameraView === 'shower') {
    if (showerProduct) {
      const sx = showerProduct.x;
      const sy = showerProduct.y;
      const offsetX = sx > L / 2 ? -2.6 : 2.6;
      const offsetZ = sy > W / 2 ? -2.6 : 2.6;
      position = [sx + offsetX, 4.4, sy + offsetZ];
    } else {
      position = [L * 0.75, 4.4, W * 0.75];
    }
    fov = 48;
  } else if (activeCameraView === 'vanity') {
    if (vanityProduct) {
      const vx = vanityProduct.x;
      const vy = vanityProduct.y;
      const offsetX = vx > L / 2 ? -1.0 : (vx < L * 0.35 ? 1.0 : 0);
      const offsetZ = vy > W / 2 ? -2.6 : 2.6;
      position = [vx + offsetX, 3.8, vy + offsetZ];
    } else {
      position = [L * 0.35, 3.8, W * 0.35];
    }
    fov = 46;
  } else if (activeCameraView === 'focal' && focalProduct) {
    position = [focalProduct.x + 2.5, 3.8, focalProduct.y + 2.5];
    fov = 42;
  } else {
    // Elevated Isometric 3/4 Perspective
    position = [L * 1.15, H * 1.28, W * 1.4];
    fov = 46;
  }

  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={fov}
      near={0.1}
      far={150}
    />
  );
}

function CameraTarget({
  room,
  activeCameraView,
  focalProduct,
  products
}: {
  room: RoomConfig;
  activeCameraView: CameraViewPreset;
  focalProduct: PlacedProduct | null;
  products: PlacedProduct[];
}) {
  const { camera } = useThree();

  React.useEffect(() => {
    let target: THREE.Vector3;
    const showerProduct = products.find(p => p.category === 'shower' || p.category === 'bathtub');
    const vanityProduct = products.find(p => p.category === 'vanity');

    if (activeCameraView === 'top') {
      target = new THREE.Vector3(room.length / 2, 0, room.width / 2);
    } else if (activeCameraView === 'eye_level') {
      target = new THREE.Vector3(room.length / 2, 3.6, room.width * 0.25);
    } else if (activeCameraView === 'shower') {
      if (showerProduct) {
        target = new THREE.Vector3(showerProduct.x, 3.0, showerProduct.y);
      } else {
        target = new THREE.Vector3(room.length * 0.8, 3.0, room.width * 0.8);
      }
    } else if (activeCameraView === 'vanity') {
      if (vanityProduct) {
        target = new THREE.Vector3(vanityProduct.x, 2.8, vanityProduct.y);
      } else {
        target = new THREE.Vector3(room.length * 0.3, 2.8, room.width * 0.3);
      }
    } else if (activeCameraView === 'focal' && focalProduct) {
      target = new THREE.Vector3(focalProduct.x, 2.2, focalProduct.y);
    } else {
      target = new THREE.Vector3(room.length / 2, room.height * 0.35, room.width / 2);
    }

    camera.lookAt(target);
  }, [activeCameraView, camera, focalProduct, products, room.height, room.length, room.width]);

  return null;
}

function FloorDragGizmo({
  product,
  isDragging,
  onStartDrag
}: {
  product: PlacedProduct;
  isDragging: boolean;
  onStartDrag: () => void;
}) {
  const radius = Math.max(product.width, product.depth) * 0.68;

  return (
    <group position={[product.x, 0.05, product.y]}>
      {/* Outer interactive ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e: any) => {
          e.stopPropagation();
          onStartDrag();
        }}
      >
        <ringGeometry args={[radius * 0.85, radius * 1.05, 48]} />
        <meshBasicMaterial
          color={isDragging ? '#f59e0b' : '#38bdf8'}
          transparent
          opacity={isDragging ? 0.95 : 0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4 Directional Arrow Cones */}
      <mesh position={[radius * 1.18, 0, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.32, 16]} />
        <meshBasicMaterial color={isDragging ? '#f59e0b' : '#38bdf8'} />
      </mesh>
      <mesh position={[-radius * 1.18, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.32, 16]} />
        <meshBasicMaterial color={isDragging ? '#f59e0b' : '#38bdf8'} />
      </mesh>
      <mesh position={[0, 0, radius * 1.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.32, 16]} />
        <meshBasicMaterial color={isDragging ? '#f59e0b' : '#38bdf8'} />
      </mesh>
      <mesh position={[0, 0, -radius * 1.18]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.32, 16]} />
        <meshBasicMaterial color={isDragging ? '#f59e0b' : '#38bdf8'} />
      </mesh>
    </group>
  );
}

function ShowerWaterEffect({ product }: { product: PlacedProduct }) {
  const streamRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (streamRef.current) {
      (streamRef.current.material as THREE.MeshStandardMaterial).opacity = 0.32 + Math.sin(t * 12) * 0.08;
    }
    if (rippleRef.current) {
      const s = 1 + Math.sin(t * 8) * 0.12;
      rippleRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[product.x, 0, product.y]}>
      <mesh ref={streamRef} position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.42, 0.65, 7.0, 20]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={rippleRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.65, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function FaucetWaterEffect({ product }: { product: PlacedProduct }) {
  const streamRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (streamRef.current) {
      (streamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 16) * 0.15;
    }
    if (rippleRef.current) {
      const s = 1 + Math.sin(t * 10) * 0.18;
      rippleRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={[product.x, 0, product.y]}>
      <mesh ref={streamRef} position={[0, 2.65, 0.12]}>
        <cylinderGeometry args={[0.018, 0.022, 0.42, 12]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.6} />
      </mesh>
      <mesh ref={rippleRef} position={[0, 2.45, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.16, 24]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function TubWaterEffect({ product }: { product: PlacedProduct }) {
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (rippleRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.08;
      rippleRef.current.scale.set(s, s, 1);
      (rippleRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 5) * 0.1;
    }
  });

  return (
    <group position={[product.x, 0, product.y]}>
      <mesh position={[-product.width * 0.35, 2.0, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.8, 12]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} />
      </mesh>
      <mesh ref={rippleRef} position={[0, 1.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, product.width * 0.38, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RunningWaterEffect({ products, showWater }: { products: PlacedProduct[]; showWater: boolean }) {
  if (!showWater) return null;

  return (
    <group>
      {products.map((p) => {
        if (p.category === 'shower') {
          return <ShowerWaterEffect key={`water-${p.instanceId}`} product={p} />;
        }
        if (p.category === 'faucet') {
          return <FaucetWaterEffect key={`water-${p.instanceId}`} product={p} />;
        }
        if (p.category === 'bathtub') {
          return <TubWaterEffect key={`water-${p.instanceId}`} product={p} />;
        }
        return null;
      })}
    </group>
  );
}

function FixtureObject({
  product,
  mats,
  isSelected,
  isDragging,
  onSelect,
  onSpotlightProduct,
  onStartDrag
}: {
  product: PlacedProduct;
  mats: ReturnType<typeof MaterialFactory.getStyleMaterials>;
  isSelected: boolean;
  isDragging: boolean;
  onSelect?: (product: PlacedProduct | null) => void;
  onSpotlightProduct: (product: PlacedProduct | null) => void;
  onStartDrag: () => void;
}) {
  const object = useMemo(() => {
    const meshGroup = createFixtureMesh(product, mats);
    meshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return meshGroup;
  }, [mats, product]);

  return (
    <group>
      <primitive
        object={object}
        position={[product.x, 0, product.y]}
        rotation={[0, -(product.rotation * Math.PI) / 180, 0]}
        onPointerOver={(event: any) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(event: any) => {
          event.stopPropagation();
          document.body.style.cursor = 'default';
        }}
        onClick={(event: any) => {
          event.stopPropagation();
          onSpotlightProduct(product);
          onSelect?.(product);
        }}
        onPointerDown={(event: any) => {
          if (isSelected) {
            event.stopPropagation();
            onStartDrag();
          }
        }}
      />
      {isSelected && (
        <FloorDragGizmo
          product={product}
          isDragging={isDragging}
          onStartDrag={onStartDrag}
        />
      )}
    </group>
  );
}

function DimensionRulers3D({ room }: { room: RoomConfig }) {
  const L = room.length;
  const W = room.width;

  return (
    <group position={[0, 0.04, 0]}>
      {/* Length guideline along North Wall (Z = -0.3) */}
      <mesh position={[L / 2, 0, -0.35]}>
        <boxGeometry args={[L, 0.02, 0.04]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {/* Length End Ticks */}
      <mesh position={[0, 0, -0.35]}>
        <boxGeometry args={[0.04, 0.02, 0.3]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[L, 0, -0.35]}>
        <boxGeometry args={[0.04, 0.02, 0.3]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Width guideline along West Wall (X = -0.3) */}
      <mesh position={[-0.35, 0, W / 2]}>
        <boxGeometry args={[0.04, 0.02, W]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {/* Width End Ticks */}
      <mesh position={[-0.35, 0, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.04]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[-0.35, 0, W]}>
        <boxGeometry args={[0.3, 0.02, 0.04]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

function ArchitecturalRoomShell({
  room,
  mats,
  showCeiling,
  isCutaway,
  activeCameraView,
  onSelectSurface
}: {
  room: RoomConfig;
  mats: ReturnType<typeof MaterialFactory.getStyleMaterials>;
  showCeiling: boolean;
  isCutaway: boolean;
  activeCameraView: string;
  onSelectSurface: (surface: 'floor' | 'wall') => void;
}) {
  const L = room.length;
  const W = room.width;
  const H = room.height;
  const door = room.door;
  const windowOpening = room.window;
  const doorHeight = 6.8;
  const doorWidth = door.width || 2.5;
  const doorOffset = door.offset || 1.8;

  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.3
  }), []);

  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.4,
    metalness: 0.1
  }), []);

  const ceilingMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.7,
    side: THREE.BackSide
  }), []);

  const cutawayActive = isCutaway && activeCameraView !== 'eye_level';
  const wallOpacity = cutawayActive ? 0.72 : 1;
  const wallMat = useMemo(() => {
    const base = mats.wallMaterial.clone();
    base.transparent = wallOpacity < 1;
    base.opacity = wallOpacity;
    base.side = THREE.DoubleSide;
    return base;
  }, [mats.wallMaterial, wallOpacity]);

  const clampOffset = (offset: number, openingWidth: number, span: number) => {
    return Math.max(0.2, Math.min(Math.max(0.2, span - openingWidth - 0.2), offset));
  };

  const getWallSpan = (wall: RoomConfig['door']['wall']) => (
    wall === 'north' || wall === 'south' ? L : W
  );

  const getWallRotation = (wall: RoomConfig['door']['wall']): [number, number, number] => {
    if (wall === 'south') return [0, Math.PI, 0];
    if (wall === 'west') return [0, Math.PI / 2, 0];
    if (wall === 'east') return [0, -Math.PI / 2, 0];
    return [0, 0, 0];
  };

  const getWallPosition = (
    wall: RoomConfig['door']['wall'],
    start: number,
    span: number,
    centerY: number
  ): [number, number, number] => {
    const center = start + span / 2;
    if (wall === 'north') return [center, centerY, 0];
    if (wall === 'south') return [center, centerY, W];
    if (wall === 'west') return [0, centerY, center];
    return [L, centerY, center];
  };

  const renderWallPanel = (
    wall: RoomConfig['door']['wall'],
    start: number,
    span: number,
    panelHeight: number,
    bottom: number,
    key: string
  ) => {
    if (span <= 0.05 || panelHeight <= 0.05) return null;

    return (
      <mesh
        key={key}
        position={getWallPosition(wall, start, span, bottom + panelHeight / 2)}
        rotation={getWallRotation(wall)}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface('wall');
        }}
      >
        <planeGeometry args={[span, panelHeight]} />
        <primitive attach="material" object={wallMat} />
      </mesh>
    );
  };

  const renderDoorFrame = (wall: RoomConfig['door']['wall']) => {
    const span = getWallSpan(wall);
    const start = clampOffset(doorOffset, doorWidth, span);
    const center = start + doorWidth / 2;
    const frameDepth = 0.08;
    const frameWidth = 0.12;
    const frameHeight = Math.min(doorHeight, H);
    const isHorizontalWall = wall === 'north' || wall === 'south';
    const z = wall === 'north' ? -0.035 : wall === 'south' ? W + 0.035 : center;
    const x = wall === 'west' ? -0.035 : wall === 'east' ? L + 0.035 : center;

    const post = (offset: number, key: string) => {
      const postX = isHorizontalWall ? start + offset : x;
      const postZ = isHorizontalWall ? z : start + offset;
      return (
        <mesh key={key} position={[postX, frameHeight / 2, postZ]}>
          <boxGeometry args={isHorizontalWall ? [frameWidth, frameHeight, frameDepth] : [frameDepth, frameHeight, frameWidth]} />
          <primitive attach="material" object={frameMat} />
        </mesh>
      );
    };

    const headerPosition: [number, number, number] = isHorizontalWall
      ? [center, frameHeight + frameWidth / 2, z]
      : [x, frameHeight + frameWidth / 2, center];

    const leafRotation = wall === 'north'
      ? [0, Math.PI / 7, 0]
      : wall === 'south'
        ? [0, Math.PI - Math.PI / 7, 0]
        : wall === 'west'
          ? [0, Math.PI / 2 - Math.PI / 7, 0]
          : [0, -Math.PI / 2 + Math.PI / 7, 0];

    const leafPosition: [number, number, number] = isHorizontalWall
      ? [start + doorWidth * 0.42, frameHeight / 2, wall === 'north' ? 0.34 : W - 0.34]
      : [wall === 'west' ? 0.34 : L - 0.34, frameHeight / 2, start + doorWidth * 0.42];

    return (
      <group key={`door-frame-${wall}`}>
        {post(0, 'door-post-a')}
        {post(doorWidth, 'door-post-b')}
        <mesh position={headerPosition}>
          <boxGeometry args={isHorizontalWall ? [doorWidth + frameWidth * 2, frameWidth, frameDepth] : [frameDepth, frameWidth, doorWidth + frameWidth * 2]} />
          <primitive attach="material" object={frameMat} />
        </mesh>
        <mesh position={leafPosition} rotation={leafRotation as [number, number, number]}>
          <boxGeometry args={[doorWidth * 0.78, frameHeight * 0.92, 0.06]} />
          <primitive attach="material" object={doorMat} />
        </mesh>
      </group>
    );
  };

  const renderWallWithDoor = (wall: RoomConfig['door']['wall']) => {
    const span = getWallSpan(wall);
    const isDoorWall = wall === door.wall;

    if (!isDoorWall) {
      return renderWallPanel(wall, 0, span, H, 0, `${wall}-full`);
    }

    const start = clampOffset(doorOffset, doorWidth, span);
    const end = Math.min(span - 0.05, start + doorWidth);
    const lintelHeight = Math.max(0, H - doorHeight);

    return (
      <group key={`${wall}-door-wall`}>
        {renderWallPanel(wall, 0, start, H, 0, `${wall}-left`)}
        {renderWallPanel(wall, end, span - end, H, 0, `${wall}-right`)}
        {renderWallPanel(wall, start, end - start, lintelHeight, doorHeight, `${wall}-lintel`)}
        {renderDoorFrame(wall)}
      </group>
    );
  };

  const renderWindow = () => {
    if (!windowOpening) return null;

    const wall = windowOpening.wall;
    const span = getWallSpan(wall);
    const windowMeta = windowOpening as typeof windowOpening & { height?: number; sillHeight?: number };
    const width = Math.min(windowOpening.width || 3, span - 0.4);
    const height = Math.min(windowMeta.height || 2.5, Math.max(1.2, H - 1.5));
    const sill = Math.min(windowMeta.sillHeight || H * 0.48, H - height - 0.4);
    const start = clampOffset(windowOpening.offset || 1.2, width, span);
    const center = start + width / 2;
    const centerY = sill + height / 2;
    const isHorizontalWall = wall === 'north' || wall === 'south';
    const panelPosition = getWallPosition(wall, start, width, centerY);
    const normalNudge = wall === 'north'
      ? [0, 0, 0.035]
      : wall === 'south'
        ? [0, 0, -0.035]
        : wall === 'west'
          ? [0.035, 0, 0]
          : [-0.035, 0, 0];
    const position: [number, number, number] = [
      panelPosition[0] + normalNudge[0],
      panelPosition[1] + normalNudge[1],
      panelPosition[2] + normalNudge[2]
    ];

    const rail = (railCenter: number, railWidth: number, railHeight: number, key: string, vertical = false) => {
      const railPosition: [number, number, number] = isHorizontalWall
        ? [vertical ? railCenter : center, vertical ? centerY : railCenter, position[2]]
        : [position[0], vertical ? centerY : railCenter, vertical ? railCenter : center];

      return (
        <mesh key={key} position={railPosition} rotation={getWallRotation(wall)}>
          <boxGeometry args={vertical ? [0.06, height + 0.16, 0.05] : [railWidth, railHeight, 0.05]} />
          <primitive attach="material" object={frameMat} />
        </mesh>
      );
    };

    return (
      <group key="window-panel">
        <mesh position={position} rotation={getWallRotation(wall)}>
          <planeGeometry args={[width, height]} />
          <primitive attach="material" object={mats.glassMaterial} />
        </mesh>
        {rail(sill, width + 0.16, 0.06, 'window-bottom')}
        {rail(sill + height, width + 0.16, 0.06, 'window-top')}
        {rail(start, 0.06, height + 0.16, 'window-left', true)}
        {rail(start + width, 0.06, height + 0.16, 'window-right', true)}
      </group>
    );
  };

  return (
    <group>
      {/* Floor - Interactive Click to Re-Tile */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[L / 2, 0, W / 2]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelectSurface('floor');
        }}
      >
        <planeGeometry args={[L, W]} />
        <primitive attach="material" object={mats.floorMaterial} />
      </mesh>

      {/* Ceiling (Optional / in Walk Mode) */}
      {showCeiling && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[L / 2, H, W / 2]}>
          <planeGeometry args={[L, W]} />
          <primitive attach="material" object={ceilingMat} />
        </mesh>
      )}

      {(['north', 'south', 'west', 'east'] as RoomConfig['door']['wall'][]).map(renderWallWithDoor)}

      {/* Architectural Crown Soffit Trim & Warm Perimeter Cove Strip */}
      <mesh position={[L / 2, H - 0.08, 0.04]}>
        <boxGeometry args={[L, 0.12, 0.06]} />
        <primitive attach="material" object={frameMat} />
      </mesh>
      <mesh position={[L / 2, H - 0.12, 0.06]}>
        <boxGeometry args={[L * 0.95, 0.03, 0.02]} />
        <primitive attach="material" object={mats.ledGlowWarm} />
      </mesh>

      {/* Baseboard Trim along North Wall */}
      <mesh position={[L / 2, 0.12, 0.03]} receiveShadow>
        <boxGeometry args={[L, 0.24, 0.05]} />
        <meshStandardMaterial color={mats.accentColor || 0x1e293b} roughness={0.4} />
      </mesh>

      {/* Baseboard Trim along West Wall */}
      <mesh position={[0.03, 0.12, W / 2]} receiveShadow>
        <boxGeometry args={[0.05, 0.24, W]} />
        <meshStandardMaterial color={mats.accentColor || 0x1e293b} roughness={0.4} />
      </mesh>

      {renderWindow()}
    </group>
  );
}

function BathroomScene({
  room,
  products,
  style,
  finishes,
  selectedProductId,
  onSelectProduct,
  atmosphere,
  qualityPreset,
  showRunningWater,
  activeCameraView,
  showCeiling,
  showDimensions3D,
  isCutaway,
  onSelectSurface,
  onSpotlightProduct,
  isDraggingProduct,
  setIsDraggingProduct,
  onDragProduct
}: SceneProps) {
  const mats = useMemo(() => MaterialFactory.getStyleMaterials(style, finishes), [finishes, style]);
  const L = room.length;
  const W = room.width;
  const H = room.height;

  const focalProduct = useMemo(() => {
    return products.find(p => p.instanceId === selectedProductId) || products.find(p => p.category === 'vanity') || products[0] || null;
  }, [products, selectedProductId]);

  const shadowMapDim = qualityPreset === 'ultra' ? 2048 : (qualityPreset === 'balanced' ? 1024 : 512);

  const currentTarget = useMemo(() => {
    const showerProduct = products.find(p => p.category === 'shower' || p.category === 'bathtub');
    const vanityProduct = products.find(p => p.category === 'vanity');
    if (activeCameraView === 'top') {
      return [L / 2, 0, W / 2] as [number, number, number];
    }
    if (activeCameraView === 'shower' && showerProduct) {
      return [showerProduct.x, 3.0, showerProduct.y] as [number, number, number];
    }
    if (activeCameraView === 'vanity' && vanityProduct) {
      return [vanityProduct.x, 2.8, vanityProduct.y] as [number, number, number];
    }
    if (activeCameraView === 'eye_level') {
      return [L / 2, 3.6, W * 0.25] as [number, number, number];
    }
    if (activeCameraView === 'focal' && focalProduct) {
      return [focalProduct.x, 2.2, focalProduct.y] as [number, number, number];
    }
    return [L / 2, H * 0.35, W / 2] as [number, number, number];
  }, [activeCameraView, products, focalProduct, L, W, H]);

  return (
    <>
      <color attach="background" args={[atmosphere === 'evening_mood' ? '#090d16' : (atmosphere === 'warm_spa' ? '#1c1917' : '#0f172a')]} />
      <CameraRig room={room} activeCameraView={activeCameraView} focalProduct={focalProduct} products={products} />
      <CameraTarget room={room} activeCameraView={activeCameraView} focalProduct={focalProduct} products={products} />

      {/* --- ATMOSPHERIC LIGHTING RIGS --- */}
      {atmosphere === 'daylight' ? (
        <>
          <ambientLight intensity={0.85} color="#f8fafc" />
          <directionalLight
            position={[L * 1.1, H * 1.8, W * 1.2]}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={shadowMapDim}
            shadow-mapSize-height={shadowMapDim}
            shadow-bias={-0.0001}
          />
          {room.window && (
            <spotLight
              position={[room.window.offset + 1.0, H * 0.7, 0]}
              target-position={[L / 2, 0, W / 2]}
              intensity={2.2}
              color="#fffbeb"
              angle={Math.PI / 3.5}
              penumbra={0.5}
              castShadow
            />
          )}
        </>
      ) : atmosphere === 'warm_spa' ? (
        <>
          <ambientLight intensity={0.55} color="#fed7aa" />
          <directionalLight
            position={[L * 0.7, H * 1.5, W * 0.9]}
            intensity={0.95}
            color="#fef3c7"
            castShadow
            shadow-mapSize-width={shadowMapDim}
            shadow-mapSize-height={shadowMapDim}
          />
          <pointLight position={[L / 2, H - 0.4, W / 2]} intensity={1.8} color="#fef08a" distance={15} />
          <pointLight position={[L * 0.35, H - 0.5, W * 0.35]} intensity={1.5} color="#fed7aa" distance={10} />
        </>
      ) : (
        // Evening Mood
        <>
          <ambientLight intensity={0.3} color="#38bdf8" />
          <directionalLight
            position={[-L * 0.5, H * 1.2, -W * 0.5]}
            intensity={0.4}
            color="#93c5fd"
          />
          <pointLight position={[L / 2, 1.2, W / 2]} intensity={1.2} color="#38bdf8" distance={10} />
          <pointLight position={[1.5, 3.5, 1.5]} intensity={1.6} color="#fbbf24" distance={8} />
        </>
      )}

      {/* Room Structure with Smart Cutaway */}
      <ArchitecturalRoomShell
        room={room}
        mats={mats}
        showCeiling={showCeiling || activeCameraView === 'eye_level'}
        isCutaway={isCutaway}
        activeCameraView={activeCameraView}
        onSelectSurface={onSelectSurface}
      />

      {/* Fixtures with Interactive 3D Floor Drag Gizmo */}
      {products.map((product) => (
        <FixtureObject
          key={product.instanceId}
          product={product}
          mats={mats}
          isSelected={selectedProductId === product.instanceId}
          isDragging={isDraggingProduct && selectedProductId === product.instanceId}
          onSelect={onSelectProduct}
          onSpotlightProduct={onSpotlightProduct}
          onStartDrag={() => {
            onSelectProduct?.(product);
            setIsDraggingProduct(true);
          }}
        />
      ))}

      {/* Interactive Running Water Animation FX */}
      <RunningWaterEffect products={products} showWater={showRunningWater} />

      {/* Dimension Guides */}
      {showDimensions3D && <DimensionRulers3D room={room} />}

      {/* 3D Floor Drag Intersection Plane */}
      {isDraggingProduct && focalProduct && (
        <mesh
          position={[L / 2, 0.02, W / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={(e) => {
            e.stopPropagation();
            const halfW = (focalProduct.width || 2) / 2;
            const halfD = (focalProduct.depth || 2) / 2;
            const clampedX = Math.max(halfW + 0.3, Math.min(L - halfW - 0.3, Number(e.point.x.toFixed(2))));
            const clampedZ = Math.max(halfD + 0.3, Math.min(W - halfD - 0.3, Number(e.point.z.toFixed(2))));
            onDragProduct(focalProduct, clampedX, clampedZ);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setIsDraggingProduct(false);
          }}
        >
          <planeGeometry args={[L * 4, W * 4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* PBR Contact Shadows */}
      <ContactShadows
        position={[L / 2, 0.015, W / 2]}
        opacity={qualityPreset === 'ultra' ? 0.4 : (qualityPreset === 'balanced' ? 0.35 : 0.25)}
        scale={Math.max(L, W) * 1.3}
        blur={qualityPreset === 'ultra' ? 2.4 : (qualityPreset === 'balanced' ? 1.8 : 1.0)}
        far={H}
      />

      <OrbitControls
        key={activeCameraView}
        enabled={!isDraggingProduct}
        target={currentTarget}
        enableDamping={true}
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={Math.max(16, Math.sqrt(L * L + W * W) * 2.2)}
        maxPolarAngle={activeCameraView === 'top' ? 0.05 : Math.PI / 2.05}
        makeDefault
      />
    </>
  );
}

export const ThreeStudio: React.FC<ThreeStudioProps> = ({
  room,
  products,
  style,
  finishes,
  selectedProductId,
  onSelectProduct,
  onUpdateProducts,
  onUpdateFinishes,
  showRunningWater: propShowWater,
  onToggleRunningWater,
  showDimensions3D: propShowDimensions,
  onToggleDimensions3D,
  showCeiling: propShowCeiling,
  onToggleCeiling,
  isCutaway: propIsCutaway,
  onToggleCutaway
}) => {
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('warm_spa');
  const qualityPreset: GraphicsQuality = 'ultra';
  
  const [internalShowWater, setInternalShowWater] = useState<boolean>(true);
  const showRunningWater = propShowWater !== undefined ? propShowWater : internalShowWater;
  const setShowRunningWater = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(showRunningWater) : val;
    setInternalShowWater(nextVal);
    onToggleRunningWater?.(nextVal);
  };

  const [isDraggingProduct, setIsDraggingProduct] = useState<boolean>(false);
  const [activeCameraView, setActiveCameraView] = useState<CameraViewPreset>('perspective');

  const [internalShowCeiling, setInternalShowCeiling] = useState(false);
  const showCeiling = propShowCeiling !== undefined ? propShowCeiling : internalShowCeiling;
  const setShowCeiling = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(showCeiling) : val;
    setInternalShowCeiling(nextVal);
    onToggleCeiling?.(nextVal);
  };

  const [internalShowDimensions3D, setInternalShowDimensions3D] = useState(false);
  const showDimensions3D = propShowDimensions !== undefined ? propShowDimensions : internalShowDimensions3D;
  const setShowDimensions3D = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(showDimensions3D) : val;
    setInternalShowDimensions3D(nextVal);
    onToggleDimensions3D?.(nextVal);
  };

  const [internalIsCutaway, setInternalIsCutaway] = useState(true);
  const isCutaway = propIsCutaway !== undefined ? propIsCutaway : internalIsCutaway;
  const setIsCutaway = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isCutaway) : val;
    setInternalIsCutaway(nextVal);
    onToggleCutaway?.(nextVal);
  };
  const [activeTileSurface, setActiveTileSurface] = useState<'floor' | 'wall' | null>(null);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [spotlightProduct, setSpotlightProduct] = useState<PlacedProduct | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  const handleDragProduct = (targetProduct: PlacedProduct, newX: number, newY: number) => {
    const dx = newX - targetProduct.x;
    const dy = newY - targetProduct.y;
    const updatedProducts = products.map((product) => {
      if (product.instanceId === targetProduct.instanceId) {
        return { ...product, x: newX, y: newY };
      }

      if (targetProduct.category === 'vanity' && (product.category === 'faucet' || product.category === 'mirror')) {
        return {
          ...product,
          x: Number((product.x + dx).toFixed(2)),
          y: Number((product.y + dy).toFixed(2))
        };
      }

      return product;
    });

    onUpdateProducts?.(updatedProducts);
    setSpotlightProduct((current) => (
      current?.instanceId === targetProduct.instanceId ? { ...current, x: newX, y: newY } : current
    ));
  };

  const handleTakeSnapshot = () => {
    if (!renderer) return;
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Kohler_3D_${style}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Only show the detailed floating card when the user explicitly clicks a product
  const productForCard = spotlightProduct;

  const alternatives = useMemo(() => {
    if (!productForCard) return [];
    return CATALOG_PRODUCTS
      .filter(p => p.category === productForCard.category && p.id !== productForCard.id)
      .slice(0, 4);
  }, [productForCard]);

  const handleQuickSwap = (newProduct: Product) => {
    if (!productForCard) return;
    const updatedProducts = products.map((product) => (
      product.instanceId === productForCard.instanceId
        ? {
            ...newProduct,
            instanceId: product.instanceId,
            x: product.x,
            y: product.y,
            rotation: product.rotation,
            wallAttached: product.wallAttached,
            mountType: product.mountType,
            score: 96,
            reason: 'Custom selected fixture model.'
          }
        : product
    ));

    onUpdateProducts?.(updatedProducts);
    setSpotlightProduct(updatedProducts.find((product) => product.instanceId === productForCard.instanceId) || null);
    setShowSwapDrawer(false);
  };

  const handleRemoveSpotlightProduct = () => {
    if (!productForCard) return;
    const targetId = productForCard.instanceId;
    const updatedProducts = products.filter((p) => p.instanceId !== targetId);
    onUpdateProducts?.(updatedProducts);
    setSpotlightProduct(null);
    onSelectProduct?.(null);
    setShowSwapDrawer(false);
  };

  return (
    <div className="relative w-full h-full min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[#090d12] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
      <Canvas
        shadows
        dpr={qualityPreset === 'ultra' ? [1, 2] : (qualityPreset === 'balanced' ? [1, 1.5] : 1)}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => {
          setSpotlightProduct(null);
          onSelectProduct?.(null);
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = atmosphere === 'evening_mood' ? 0.9 : 1.15;
          setRenderer(gl);
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        <BathroomScene
          room={room}
          products={products}
          style={style}
          finishes={finishes}
          selectedProductId={selectedProductId}
          onSelectProduct={onSelectProduct}
          atmosphere={atmosphere}
          qualityPreset={qualityPreset}
          showRunningWater={showRunningWater}
          activeCameraView={activeCameraView}
          showCeiling={showCeiling}
          showDimensions3D={showDimensions3D}
          isCutaway={isCutaway}
          onSelectSurface={(surf) => setActiveTileSurface(surf)}
          onSpotlightProduct={setSpotlightProduct}
          isDraggingProduct={isDraggingProduct}
          setIsDraggingProduct={setIsDraggingProduct}
          onDragProduct={handleDragProduct}
        />
      </Canvas>

      {/* Direct Dragging Floating Notice */}
      {isDraggingProduct && productForCard && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-full text-xs shadow-2xl flex items-center gap-2 z-30 animate-pulse pointer-events-none">
          <Move className="w-4 h-4" />
          <span>Dragging {productForCard.name} ({productForCard.x.toFixed(1)}', {productForCard.y.toFixed(1)}') • Release to place</span>
        </div>
      )}

      {/* --- TOP HUD TOOLBAR --- */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-white/10 bg-slate-950/76 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            3D PBR STUDIO | {style.replace('_', ' ').toUpperCase()} | {room.length}' x {room.width}'
          </span>
          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {atmosphere.replace('_', ' ')}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/76 p-1.5 shadow-lg backdrop-blur-md">
          {/* Atmospheres */}
          <button
            onClick={() => setAtmosphere(atmosphere === 'warm_spa' ? 'daylight' : (atmosphere === 'daylight' ? 'evening_mood' : 'warm_spa'))}
            title="Cycle Atmosphere: Warm Spa / Daylight / Evening"
            className="px-2.5 py-1 text-xs font-medium rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
          >
            {atmosphere === 'daylight' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : atmosphere === 'warm_spa' ? <Sparkles className="w-3.5 h-3.5 text-gold-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline capitalize">{atmosphere.replace('_', ' ')}</span>
          </button>

          {/* Running Water FX Toggle */}
          <button
            onClick={() => setShowRunningWater(!showRunningWater)}
            title="Toggle interactive running water animation for faucets, showers & tubs"
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
              showRunningWater
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Water {showRunningWater ? 'ON' : 'OFF'}</span>
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Cutaway Toggle */}
          <button
            onClick={() => setIsCutaway(!isCutaway)}
            title={isCutaway ? 'Cutaway View (Front walls open)' : 'Enclosed View (All walls solid)'}
            className={`p-1.5 rounded-md transition-colors ${isCutaway ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Rulers Toggle */}
          <button
            onClick={() => setShowDimensions3D(!showDimensions3D)}
            title={showDimensions3D ? 'Hide 3D rulers' : 'Show 3D rulers'}
            className={`p-1.5 rounded-md transition-colors ${showDimensions3D ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>

          {/* Ceiling Toggle */}
          <button
            onClick={() => setShowCeiling(!showCeiling)}
            title={showCeiling ? 'Hide ceiling soffit' : 'Show ceiling soffit'}
            className={`p-1.5 rounded-md transition-colors ${showCeiling ? 'bg-emerald-500 text-slate-950' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTakeSnapshot}
            title="Download high-res 3D PNG"
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --- IN-SCENE LIVE TILE PICKER DRAWER --- */}
      {activeTileSurface && (
        <div className="absolute top-16 left-4 z-30 w-80 glass-panel-luxury p-4 rounded-3xl border border-gold-500/40 shadow-2xl animate-in slide-in-from-top-3 duration-200 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Re-Tile {activeTileSurface} Surface
              </span>
            </div>
            <button
              onClick={() => setActiveTileSurface(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded-full hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 mb-2">
            Select from 11 luxury architectural tile types:
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {TILES_CATALOG.filter(t => activeTileSurface === 'floor' ? t.category !== 'wall' : t.category !== 'floor').map((tile) => (
              <button
                key={tile.id}
                onClick={() => {
                  const currentFinishes = finishes || { floor: 'wooden_hinoki', wall: 'marble_carrara' };
                  onUpdateFinishes?.({
                    ...currentFinishes,
                    [activeTileSurface]: tile.id
                  });
                }}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-750 hover:border-gold-500/80 text-left transition-all flex flex-col gap-1.5 shadow-sm group"
              >
                <div className="w-full h-8 rounded-lg flex items-center justify-end px-2 shadow-inner" style={{ backgroundColor: tile.color }}>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/70 text-white font-mono uppercase font-bold tracking-wider">
                    {tile.type}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-gold-300 truncate">
                  {tile.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-medium">
                  ₹{tile.ratePerSqFt}/sq.ft
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- FLOATING FIXTURE INSPECT & QUICK-SWAP CARD --- */}
      {productForCard && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[410px] glass-panel-luxury p-4 rounded-3xl border border-gold-500/40 shadow-2xl animate-in slide-in-from-bottom-3 duration-200 z-30 pointer-events-auto max-h-[calc(100%-2rem)] overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3.5">
              {productForCard.imageUrl ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-950 shadow-md">
                  <img src={productForCard.imageUrl} alt={productForCard.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-gold-400 shrink-0 border border-slate-700">
                  <Sparkles className="w-7 h-7" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                    {productForCard.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRemoveSpotlightProduct}
                      title="Remove this fixture from bathroom"
                      className="w-6 h-6 rounded-full bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold flex items-center justify-center transition-all border border-rose-500/30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setSpotlightProduct(null);
                        onSelectProduct?.(null);
                      }}
                      title="Close product specs"
                      className="w-6 h-6 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {productForCard.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{productForCard.price.toLocaleString('en-IN')}
                  </span>
                  {productForCard.waterSavingRating && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
                      ★ {productForCard.waterSavingRating} Water Star
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-100">Why placed:</strong> {productForCard.reason}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Dimensions: {productForCard.width}' × {productForCard.depth}' × {productForCard.height}'</span>
              <span>Finish: {productForCard.finish}</span>
            </div>

            {/* In-Scene Quick Swap Drawer */}
            {showSwapDrawer ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Choose Alternative {productForCard.category.replace('_', ' ')}:</span>
                  <button onClick={() => setShowSwapDrawer(false)} className="text-slate-400 hover:text-white">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => handleQuickSwap(alt)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-gold-500/60 text-left transition-all flex flex-col gap-1"
                    >
                      <span className="text-[11px] font-bold text-slate-100 truncate">{alt.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400">₹{alt.price.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSwapDrawer(true)}
                  className="flex-1 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  Quick Swap
                </button>
                {onSelectProduct && (
                  <button
                    onClick={() => onSelectProduct(productForCard)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                  >
                    Specs
                  </button>
                )}
                <button
                  onClick={handleRemoveSpotlightProduct}
                  title="Remove this fixture from bathroom"
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 hover:border-rose-500 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Item
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FLOATING CAMERA ANGLE PRESETS PILL TOOLBAR --- */}
      <div className={`absolute bottom-4 left-4 pointer-events-auto z-20 items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] ${productForCard ? 'hidden lg:flex' : 'flex'}`}>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold border-r border-slate-800">
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Angles</span>
        </div>

        {([
          { id: 'perspective' as const, label: 'Orbit', icon: Eye, tip: 'Free 3/4 Orbit Perspective' },
          { id: 'eye_level' as const, label: 'Eye Level', icon: Compass, tip: 'Standing in doorway looking in' },
          { id: 'top' as const, label: 'Top-Down', icon: Maximize2, tip: 'Architectural Bird\'s-Eye Blueprint' },
          { id: 'shower' as const, label: 'Shower View', icon: Droplets, tip: 'Wet zone shower & tub focus' },
          { id: 'vanity' as const, label: 'Vanity Focus', icon: Sparkles, tip: 'Vanity, mirror & basin focus' }
        ]).map((preset) => {
          const Icon = preset.icon;
          const isActive = activeCameraView === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setActiveCameraView(preset.id)}
              title={preset.tip}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-bold scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
