import React from 'react';
import { RecommendationBundle, RoomConfig } from '../../types';
import { 
  Scale, 
  Sparkles, 
  Check, 
  CheckCircle2
} from 'lucide-react';

interface DesignComparisonProps {
  optimal: RecommendationBundle;
  budgetSaver: RecommendationBundle;
  luxuryUpgrade: RecommendationBundle;
  currentType: 'optimal' | 'budget_saver' | 'luxury_upgrade';
  onSelectBundle: (type: 'optimal' | 'budget_saver' | 'luxury_upgrade') => void;
  room: RoomConfig;
}

export const DesignComparison: React.FC<DesignComparisonProps> = ({
  optimal,
  budgetSaver,
  luxuryUpgrade,
  currentType,
  onSelectBundle,
  room
}) => {
  const options = [
    {
      id: 'budget_saver' as const,
      name: 'Option A: Budget-Smart',
      bundle: budgetSaver,
      highlight: 'Maximizes Savings',
      badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'optimal' as const,
      name: 'Option B: AI Recommended',
      bundle: optimal,
      highlight: 'Best Balance of Luxury & Value',
      badgeClass: 'bg-gold-500/20 text-gold-600 dark:text-gold-400 border-gold-500/30'
    },
    {
      id: 'luxury_upgrade' as const,
      name: 'Option C: Presidential Suite',
      bundle: luxuryUpgrade,
      highlight: 'Top-of-the-Line Smart Tech',
      badgeClass: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
    }
  ];

  const totalArea = room.length * room.width;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 text-xs font-bold font-mono border border-gold-500/30">
            SIDE-BY-SIDE MATRIX
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Architectural Decision Engine</span>
        </div>
        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
          <Scale className="w-6 h-6 text-gold-500" />
          Package Comparison Matrix
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Evaluate spatial efficiency, fixture specifications, budget delta, and sustainability across the 3 AI-curated tiers for your {room.length}' × {room.width}' bathroom.
        </p>
      </div>

      {/* 3-Column Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {options.map((opt) => {
          const isSelected = currentType === opt.id;
          const usedArea = opt.bundle.products.reduce((acc, p) => acc + p.width * p.depth, 0);
          const freeArea = totalArea - usedArea;

          return (
            <div
              key={opt.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-gold-500 shadow-glow-gold'
                  : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Badge & Title */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${opt.badgeClass}`}>
                    {opt.highlight}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-500 text-white">
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{opt.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {opt.bundle.description}
                </p>

                {/* Price Section */}
                <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block uppercase font-semibold">Total Investment</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{opt.bundle.totalCost.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      (₹{opt.bundle.remainingBudget > 0 ? `+₹${opt.bundle.remainingBudget.toLocaleString('en-IN')} rem` : 'exact'})
                    </span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500">Free Circulation Area:</span>
                    <strong className="text-slate-900 dark:text-slate-200 font-mono">
                      {freeArea.toFixed(1)} sq.ft ({Math.round((freeArea / totalArea) * 100)}%)
                    </strong>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500">Style Aesthetic Match:</span>
                    <strong className="text-gold-600 dark:text-gold-400 font-mono">
                      {opt.bundle.designScore?.styleMatch || 95}%
                    </strong>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500">Fixtures Included:</span>
                    <strong className="text-slate-900 dark:text-slate-200">
                      {opt.bundle.products.length} Products
                    </strong>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500">Estimated Water Savings:</span>
                    <strong className="text-cyan-600 dark:text-cyan-400 font-mono">
                      ~95,000 L / year
                    </strong>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500">Warranty:</span>
                    <strong className="text-slate-900 dark:text-slate-200">
                      10-Year Comprehensive
                    </strong>
                  </div>
                </div>

                {/* Fixture Thumbnails List */}
                <div className="mt-4">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    Key Included Models:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {opt.bundle.products.slice(0, 4).map((p) => (
                      <li key={p.id} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </li>
                    ))}
                    {opt.bundle.products.length > 4 && (
                      <li className="text-[11px] text-slate-400 italic">
                        + {opt.bundle.products.length - 4} more accessories & fittings
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectBundle(opt.id)}
                className={`mt-6 w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isSelected
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-default'
                    : 'bg-gold-500 hover:bg-gold-400 text-slate-950 shadow-glow-gold'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    Currently Applied in 2D / 3D
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Load {opt.name.split(':')[0]}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
