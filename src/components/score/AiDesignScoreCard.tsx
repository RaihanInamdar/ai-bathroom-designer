import React, { useState } from 'react';
import { RecommendationBundle, RoomConfig, PlacedProduct } from '../../types';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Maximize2, 
  IndianRupee, 
  Droplets, 
  Palette, 
  Layers, 
  Zap, 
  Info
} from 'lucide-react';

interface AiDesignScoreCardProps {
  bundle: RecommendationBundle;
  room: RoomConfig;
}

export const AiDesignScoreCard: React.FC<AiDesignScoreCardProps> = ({ bundle, room }) => {
  const [showReasoning, setShowReasoning] = useState(true);
  const [inspectingProduct, setInspectingProduct] = useState<PlacedProduct | null>(bundle.products[0] || null);

  const score = bundle.designScore;
  const f = bundle.feasibility;

  const metrics = [
    { label: 'Space Utilization', val: score.spaceUtilization, icon: Maximize2, color: 'bg-blue-500', text: 'text-blue-500' },
    { label: 'Budget Efficiency', val: score.budgetEfficiency, icon: IndianRupee, color: 'bg-emerald-500', text: 'text-emerald-500' },
    { label: 'Style Match', val: score.styleMatch, icon: Palette, color: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Product Compatibility', val: score.productCompatibility, icon: Layers, color: 'bg-purple-500', text: 'text-purple-500' },
    { label: 'Water Efficiency', val: score.waterEfficiency, icon: Droplets, color: 'bg-cyan-500', text: 'text-cyan-500' },
  ];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 shadow-xl">
      {/* Top Score Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex flex-col items-center justify-center text-slate-950 font-bold shadow-glow-gold shrink-0">
            <span className="text-3xl font-extrabold font-mono leading-none">{score.overallScore}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 text-xs font-bold font-mono border border-gold-500/30">
                EXPLAINABLE AI ENGINE
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Multi-Factor Evaluator</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              ✨ AI Design & Ergonomic Score
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed from budget, style, water, footprint, and estimated fixture clearances.
            </p>
          </div>
        </div>

        {/* Constraint Feasibility Status */}
        <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Toilet Zone Clearance:</span>
            <span className={`font-bold ${f.toiletZoneClearance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {f.toiletZoneClearance ? 'PASS' : 'CHECK'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Vanity Front Standing:</span>
            <span className={`font-bold ${f.vanityZoneClearance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {f.vanityZoneClearance ? 'PASS' : 'CHECK'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Door Swing Obstruction:</span>
            <span className={`font-bold ${!f.doorSwingObstruction ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {f.doorSwingObstruction ? 'CHECK' : 'CLEAR'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Sub-Score Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${m.text}`} />
                <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {m.val}
                </span>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight">
                {m.label}
              </span>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.val}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* "Why did AI select this?" Explainability breakdown per fixture */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-gold-500" />
            "Why did AI select this?" — Per-Fixture Algorithmic Rationale
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any fixture to inspect rationale
          </span>
        </div>

        {/* Fixture Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {bundle.products.map((p) => (
            <button
              key={p.instanceId}
              onClick={() => setInspectingProduct(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                inspectingProduct?.instanceId === p.instanceId
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-gold-400" />
              <span>{p.name.split(' ')[0]} {p.category.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        {/* Detailed Inspection Card */}
        {inspectingProduct && (
          <div className="bg-slate-50 dark:bg-slate-950/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{inspectingProduct.name}</h4>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{inspectingProduct.price.toLocaleString('en-IN')} • {inspectingProduct.width}' × {inspectingProduct.depth}' ft • {inspectingProduct.finish}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-mono font-bold">
                Clearance: {inspectingProduct.explainability?.clearanceVerified === false ? 'CHECK' : 'EST.'}
              </span>
            </div>

            {inspectingProduct.explainability ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
                  <span className="text-slate-500 font-bold block mb-1">
                    Space Fit ({inspectingProduct.explainability.spaceScore}/100)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {inspectingProduct.explainability.spaceReason}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
                  <span className="text-slate-500 font-bold block mb-1">
                    Budget Fit ({inspectingProduct.explainability.budgetScore}/100)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {inspectingProduct.explainability.budgetReason}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
                  <span className="text-slate-500 font-bold block mb-1">
                    Style Match ({inspectingProduct.explainability.styleScore}/100)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {inspectingProduct.explainability.styleReason}
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
                  <span className="text-slate-500 font-bold block mb-1">
                    Water Saving ({inspectingProduct.explainability.waterScore}/100)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {inspectingProduct.explainability.waterReason}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">{inspectingProduct.reason}</p>
            )}
          </div>
        )}
      </div>

      {/* Room Level Explainability Accordion */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-gold-500 transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-gold-500" />
            Room-Level Algorithmic Summary
          </span>
          {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showReasoning && (
          <div className="mt-3 flex flex-col gap-2 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-200">
            {score.whyThisScore.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
