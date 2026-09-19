import React from 'react';
import { OptimizationPriority, OptimizationSearchMetrics } from '../../types';
import { 
  Sparkles, 
  TrendingDown, 
  Droplets, 
  Crown, 
  Cpu, 
  RefreshCw
} from 'lucide-react';

interface OptimizationPrioritySelectorProps {
  currentPriority: OptimizationPriority;
  metrics?: OptimizationSearchMetrics;
  onSelectPriority: (priority: OptimizationPriority) => void;
  onTriggerReoptimize: () => void;
  isOptimizing: boolean;
}

export const OptimizationPrioritySelector: React.FC<OptimizationPrioritySelectorProps> = ({
  currentPriority,
  metrics,
  onSelectPriority,
  onTriggerReoptimize,
  isOptimizing
}) => {
  const priorities: { id: OptimizationPriority; label: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'balanced',
      label: 'Pareto Best Overall',
      desc: 'Balanced Pareto multi-objective optimization across all 5 parameters.',
      icon: Sparkles,
      color: 'text-gold-500 border-gold-500'
    },
    {
      id: 'budget_first',
      label: 'Lowest Cost First',
      desc: 'Maximizes budget surplus while preserving estimated ergonomic clearance.',
      icon: TrendingDown,
      color: 'text-emerald-500 border-emerald-500'
    },
    {
      id: 'water_eco',
      label: 'Maximum Water Saving',
      desc: 'Prioritizes lower-flow dual-flush and aerated fixtures.',
      icon: Droplets,
      color: 'text-cyan-500 border-cyan-500'
    },
    {
      id: 'luxury_first',
      label: 'Ultra Luxury Suite',
      desc: 'Selects intelligent smart bidets, digital thermostatic valves & cast stone.',
      icon: Crown,
      color: 'text-purple-500 border-purple-500'
    }
  ];

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              AI Optimization Priority & Algorithmic Search
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select an objective function to re-solve multi-variable spatial & budget constraints.
          </p>
        </div>

        <button
          onClick={onTriggerReoptimize}
          disabled={isOptimizing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-glow-gold disabled:opacity-50 shrink-0"
        >
          {isOptimizing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>✨ Optimize Design</span>
        </button>
      </div>

      {/* Priority Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {priorities.map((p) => {
          const isSelected = currentPriority === p.id;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPriority(p.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-white dark:bg-slate-900/90 border-brand-500 shadow-md ring-1 ring-brand-500'
                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${p.color}`} />
                {isSelected && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                    ACTIVE
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.label}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Metrics Bar (Actual Search Computation Stats) */}
      {metrics && (
        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">Product Permutations Explored:</span>
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{metrics.combinationsExplored}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">Spatial Layouts Evaluated:</span>
            <strong className="text-slate-900 dark:text-slate-100 font-bold">{metrics.layoutsEvaluated}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">Invalid Layouts Rejected:</span>
            <strong className="text-amber-500 font-bold">{metrics.invalidLayoutsRejected}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">Pareto Score:</span>
            <strong className="text-emerald-500 font-bold">{metrics.paretoOptimalityScore}/100</strong>
          </div>
          <div className="text-[11px] text-slate-400">
            Search Time: {metrics.searchTimeMs}ms
          </div>
        </div>
      )}
    </div>
  );
};
