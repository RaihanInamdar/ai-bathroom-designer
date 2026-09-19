import React from 'react';
import { FloorFinish, WallFinish, SurfaceFinishes } from '../planner3d/MaterialFactory';
import { RoomConfig } from '../../types';
import { 
  Grid, 
  Layers, 
  Check
} from 'lucide-react';

interface TileStudioProps {
  room: RoomConfig;
  finishes: SurfaceFinishes;
  onUpdateFinishes: (finishes: SurfaceFinishes) => void;
}

export const FLOOR_FINISHES: { id: FloorFinish; name: string; desc: string; ratePerSqFt: number; color: string; pattern: string }[] = [
  {
    id: 'carrara_marble',
    name: 'Italian Carrara Marble',
    desc: 'Polished white marble with delicate grey and gold veining.',
    ratePerSqFt: 350,
    color: '#f8fafc',
    pattern: 'Linear Vein'
  },
  {
    id: 'herringbone_oak',
    name: 'Herringbone European Oak',
    desc: 'Water-resistant thermo-treated timber in classic parquet.',
    ratePerSqFt: 280,
    color: '#b45309',
    pattern: 'Chevron Parquet'
  },
  {
    id: 'charcoal_slate',
    name: 'Charcoal Split Slate',
    desc: 'Deep textured charcoal natural stone with anti-slip grip.',
    ratePerSqFt: 220,
    color: '#1e293b',
    pattern: 'Matte Cleft'
  },
  {
    id: 'terrazzo_mosaic',
    name: 'Venetian Terrazzo Chips',
    desc: 'Contemporary composite with jade, marble, and quartz flecks.',
    ratePerSqFt: 260,
    color: '#e2e8f0',
    pattern: 'Mineral Aggregate'
  },
  {
    id: 'hinoki_wood',
    name: 'Japanese Hinoki Cypress Grate',
    desc: 'Aromatic moisture-sealed wood slats for spa-like onsens.',
    ratePerSqFt: 420,
    color: '#d97706',
    pattern: 'Slatted Timber'
  },
  {
    id: 'travertine_stone',
    name: 'Warm Ivory Travertine',
    desc: 'Honed warm limestone with unfilled organic pores.',
    ratePerSqFt: 310,
    color: '#fed7aa',
    pattern: 'Cross-Cut Stone'
  }
];

export const WALL_FINISHES: { id: WallFinish; name: string; desc: string; ratePerSqFt: number; color: string; texture: string }[] = [
  {
    id: 'calacatta_gold',
    name: 'Calacatta Gold Bookmatched Slab',
    desc: 'Statuary white porcelain slab with dramatic amber veining.',
    ratePerSqFt: 450,
    color: '#fef3c7',
    texture: 'High-Gloss Polished'
  },
  {
    id: 'emerald_zellige',
    name: 'Emerald Green Moroccan Zellige',
    desc: 'Handmade glazed terracotta tile with deep emerald sheen.',
    ratePerSqFt: 380,
    color: '#064e3b',
    texture: 'Artisanal Glazed'
  },
  {
    id: 'fluted_hinoki',
    name: 'Fluted Cedar & Hinoki Slats',
    desc: 'Acoustic 3D vertical wood fluting creating peaceful warmth.',
    ratePerSqFt: 390,
    color: '#b45309',
    texture: '3D Ribbed Wood'
  },
  {
    id: 'concrete_plaster',
    name: 'Warm Slate Microcement',
    desc: 'Seamless joint-free architectural microcement finish.',
    ratePerSqFt: 240,
    color: '#64748b',
    texture: 'Matte Mineral'
  },
  {
    id: 'subway_ceramic',
    name: 'Beveled London Subway Tile',
    desc: 'Crisp gloss white beveled ceramic in brick running bond.',
    ratePerSqFt: 180,
    color: '#f8fafc',
    texture: 'Beveled Gloss'
  },
  {
    id: 'soft_sandstone',
    name: 'Natural Kyoto Sandstone',
    desc: 'Earthy textured sandstone blocks with warm ambient bounce.',
    ratePerSqFt: 290,
    color: '#f5f2eb',
    texture: 'Honed Textured'
  }
];

export const TileStudio: React.FC<TileStudioProps> = ({
  room,
  finishes,
  onUpdateFinishes
}) => {
  const floorArea = room.length * room.width;
  const wallArea = 2 * (room.length + room.width) * room.height;

  const currentFloor = FLOOR_FINISHES.find(f => f.id === finishes.floor) || FLOOR_FINISHES[0];
  const currentWall = WALL_FINISHES.find(w => w.id === finishes.wall) || WALL_FINISHES[0];

  const floorCost = floorArea * currentFloor.ratePerSqFt;
  const wallCost = wallArea * currentWall.ratePerSqFt;
  const totalSurfaceCost = floorCost + wallCost;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Overview & Tile Estimation Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 text-xs font-bold font-mono border border-gold-500/30">
                PBR MATERIAL LAB
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Architectural Surface Customizer</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-1">
              Tile, Stone & Wall Finishes
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-100 dark:bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block">Total Surface Area</span>
              <strong className="text-sm font-mono text-slate-900 dark:text-slate-100 font-bold">
                {floorArea + wallArea} sq.ft
              </strong>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-emerald-700 dark:text-emerald-400 block">Estimated Tile & Stone Cost</span>
              <strong className="text-base font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ₹{totalSurfaceCost.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Dimension & Coverage breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Floor Footprint ({room.length}' × {room.width}')</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">{currentFloor.name}</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {floorArea} sq.ft @ ₹{currentFloor.ratePerSqFt}/sq.ft = <strong className="text-emerald-600 dark:text-emerald-400">₹{floorCost.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">4 Walls Cladding ({room.height}' H)</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">{currentWall.name}</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {wallArea} sq.ft @ ₹{currentWall.ratePerSqFt}/sq.ft = <strong className="text-emerald-600 dark:text-emerald-400">₹{wallCost.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Floor Finishes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Grid className="w-4 h-4 text-gold-500" />
            1. Select Luxury Flooring Material ({FLOOR_FINISHES.length} Options)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Updates 3D WebGL in real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FLOOR_FINISHES.map((f) => {
            const isSelected = finishes.floor === f.id;
            return (
              <div
                key={f.id}
                onClick={() => onUpdateFinishes({ ...finishes, floor: f.id })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-gold-500 shadow-glow-gold'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: f.color }} />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{f.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-gold-500" />}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">{f.pattern}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{f.ratePerSqFt}/sq.ft
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Wall Finishes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold-500" />
            2. Select Wall Cladding & Slab Finishes ({WALL_FINISHES.length} Options)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Anti-mold & Waterproof</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WALL_FINISHES.map((w) => {
            const isSelected = finishes.wall === w.id;
            return (
              <div
                key={w.id}
                onClick={() => onUpdateFinishes({ ...finishes, wall: w.id })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-gold-500 shadow-glow-gold'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-slate-400" style={{ backgroundColor: w.color }} />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{w.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-gold-500" />}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{w.desc}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">{w.texture}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{w.ratePerSqFt}/sq.ft
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
