import React from 'react';
import { Card } from '@mui/material';
import { RecommendationBundle, PlacedProduct } from '../../types';
import { 
  Sparkles, 
  TrendingDown, 
  Crown, 
  Zap, 
  Repeat
} from 'lucide-react';

interface BundleAlternativesProps {
  optimal: RecommendationBundle;
  budgetSaver: RecommendationBundle;
  luxuryUpgrade: RecommendationBundle;
  activeBundleType: 'optimal' | 'budget_saver' | 'luxury_upgrade';
  onSelectBundle: (type: 'optimal' | 'budget_saver' | 'luxury_upgrade') => void;
  onOpenSwapModal?: (product: PlacedProduct) => void;
}

export const BundleAlternatives: React.FC<BundleAlternativesProps> = ({
  optimal,
  budgetSaver,
  luxuryUpgrade,
  activeBundleType,
  onSelectBundle,
  onOpenSwapModal
}) => {
  const bundles = [
    {
      type: 'optimal' as const,
      data: optimal,
      badge: 'AI Recommended',
      badgeColor: 'bg-gold-500/20 text-gold-600 dark:text-gold-400 border-gold-500/30',
      icon: Sparkles,
      iconColor: 'text-gold-500',
    },
    {
      type: 'budget_saver' as const,
      data: budgetSaver,
      badge: 'Max Savings',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: TrendingDown,
      iconColor: 'text-emerald-500',
    },
    {
      type: 'luxury_upgrade' as const,
      data: luxuryUpgrade,
      badge: 'Presidential Suite',
      badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
      icon: Crown,
      iconColor: 'text-purple-500',
    }
  ];

  const currentBundle = 
    activeBundleType === 'optimal' ? optimal :
    activeBundleType === 'budget_saver' ? budgetSaver : luxuryUpgrade;

  return (
    <div className="flex flex-col gap-6">
      {/* 3 Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bundles.map((b) => {
          const isSelected = activeBundleType === b.type;
          const Icon = b.icon;

          return (
            <Card
              key={b.type}
              elevation={isSelected ? 3 : 0}
              onClick={() => onSelectBundle(b.type)}
              sx={{
                borderRadius: '1.5rem',
                backgroundColor: 'transparent',
                backgroundImage: 'none'
              }}
              className={`p-5 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-slate-900/95 border-amber-500 shadow-glow-gold'
                  : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${b.badgeColor}`}>
                    {b.badge}
                  </span>
                  <Icon className={`w-4 h-4 ${b.iconColor}`} />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{b.data.title}</h3>
                {isSelected && (<p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{b.data.description}</p>)}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Total Investment:</span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{b.data.totalCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>{b.data.products.length} Fixtures Included</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{b.data.designScore?.styleMatch || 95}% Style Match</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Bundle Itemized Breakdown with Original Product Photography */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-500" />
              {currentBundle.title} — Itemized Specifications
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{currentBundle.aiSummary}</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Remaining Budget: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{currentBundle.remainingBudget.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Product Cards with Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentBundle.products.map((prod) => (
            <div
              key={prod.instanceId}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                {prod.imageUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                      {prod.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{prod.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{prod.name}</h4>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {prod.width}' × {prod.depth}' × {prod.height}' • {prod.finish}
                  </div>
                </div>
              </div>

              {/* AI Reasoning Pill */}
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 leading-relaxed">
                💡 <strong className="text-slate-900 dark:text-slate-200">Why Selected:</strong> {prod.reason}
              </p>

              {/* Swap Button */}
              {onOpenSwapModal && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <span className="text-[11px] text-slate-500">{prod.material}</span>
                  <button
                    onClick={() => onOpenSwapModal(prod)}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    Swap Model
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
