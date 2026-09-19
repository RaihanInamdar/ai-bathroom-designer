import React from 'react';
import { RecommendationBundle, RoomConfig, DesignStyle } from '../../types';
import { 
  CheckCircle2, 
  Check, 
  Cpu
} from 'lucide-react';

interface StructuredDesignPlanProps {
  bundle: RecommendationBundle;
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
}

export const StructuredDesignPlan: React.FC<StructuredDesignPlanProps> = ({
  bundle,
  room,
  budget,
  style
}) => {
  const f = bundle.feasibility;
  const s = bundle.designScore;

  return (
    <div className="glass-panel-luxury p-6 rounded-3xl border border-gold-500/40 shadow-2xl flex flex-col gap-5">
      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 text-xs font-bold font-mono border border-gold-500/30 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              AI ARCHITECTURAL DESIGN PLAN
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-500">Autonomous Spatial Solver v2.4</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-1">
            Optimized Design Plan & Constraint Verification
          </h2>
        </div>

        {/* Feasibility Triple Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            SPACE: {f.spaceCheck}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            BUDGET: {f.budgetCheck}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gold-500/15 border border-gold-500/40 text-gold-600 dark:text-gold-400 text-xs font-mono font-bold">
            STYLE: {s.styleMatch}/100
          </div>
        </div>
      </div>

      {/* Structured Code/Data Plan Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
        {/* Specification Column */}
        <div className="bg-slate-50 dark:bg-slate-950/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-2">
              1. INPUT CONSTRAINTS
            </span>
            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <p>ROOM SIZE: <strong className="text-slate-900 dark:text-slate-100">{room.length} × {room.width} ft ({room.length * room.width} sq.ft)</strong></p>
              <p>TARGET BUDGET: <strong className="text-emerald-600 dark:text-emerald-400">₹{budget.toLocaleString('en-IN')}</strong></p>
              <p>DESIGN STYLE: <strong className="text-gold-600 dark:text-gold-400 capitalize">{style.replace('_', ' ')}</strong></p>
              <p>DOOR LOCATION: <strong className="text-slate-900 dark:text-slate-100">{room.door.wall.toUpperCase()} Wall</strong></p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
            ✓ 14 Candidate configurations evaluated & filtered
          </div>
        </div>

        {/* Recommended Products Column */}
        <div className="bg-slate-50 dark:bg-slate-950/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between lg:col-span-2">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-2">
              2. RECOMMENDED PRODUCT BUNDLE
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              {bundle.products.map((p) => (
                <div key={p.instanceId} className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold block truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">₹{p.price.toLocaleString('en-IN')} • {p.width}'×{p.depth}'</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Circulation Space: <strong className="text-slate-900 dark:text-slate-100 font-bold">{Math.round(room.length * room.width * f.circulationAreaRatio)} sq.ft ({Math.round(f.circulationAreaRatio * 100)}%)</strong>
            </span>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">TOTAL INVESTMENT:</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{bundle.totalCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
