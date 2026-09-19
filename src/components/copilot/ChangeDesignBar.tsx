import React, { useState } from 'react';
import { RecommendationBundle, RoomConfig, DesignStyle, ModifyDesignResponse } from '../../types';
import { modifyDesignAPI } from '../../services/api';
import { 
  Sparkles, 
  Send, 
  CheckCircle2
} from 'lucide-react';

interface ChangeDesignBarProps {
  currentBundle: RecommendationBundle;
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
  onApplyModifiedBundle: (bundle: RecommendationBundle) => void;
}

export const ChangeDesignBar: React.FC<ChangeDesignBarProps> = ({
  currentBundle,
  room,
  budget,
  style,
  onApplyModifiedBundle
}) => {
  const [prompt, setPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [lastChangeSummary, setLastChangeSummary] = useState<ModifyDesignResponse['changesSummary'] | null>(null);

  const handleExecutePrompt = async (textToRun: string) => {
    if (!textToRun.trim() || isModifying) return;
    setIsModifying(true);
    setLastChangeSummary(null);

    try {
      const response = await modifyDesignAPI({
        currentBundle,
        room,
        budget,
        style,
        userPrompt: textToRun
      });

      if (response.success && response.modifiedBundle) {
        setLastChangeSummary(response.changesSummary);
        onApplyModifiedBundle(response.modifiedBundle);
        setPrompt('');
      }
    } catch (err) {
      console.error('Modify design failed:', err);
    } finally {
      setIsModifying(false);
    }
  };

  const QUICK_PROMPTS = [
    { label: '📉 Reduce below ₹85,000', prompt: 'Reduce the total cost below ₹85,000 while keeping the smart toilet and design style' },
    { label: '👑 Make it more luxurious', prompt: 'Make the design more luxurious with flagship Verre Studio smart fixtures' },
    { label: '🛁 I want a bathtub', prompt: 'Add a freestanding soaking bathtub into the wet zone' },
    { label: '💧 Improve water efficiency', prompt: 'Maximize water conservation score using Class Five dual flush and Katalyst rainhead' },
  ];

  return (
    <div className="glass-panel-luxury p-5 rounded-3xl border border-brand-500/40 shadow-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              "Change My Design" AI Assistant
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                Live Re-Optimization
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type natural language instructions to dynamically modify fixtures, adjust budget, or swap layout zones.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Current Total: <strong className="text-emerald-600 dark:text-emerald-400">₹{currentBundle.totalCost.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecutePrompt(prompt);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Reduce it below ₹85,000' or 'Make it more luxurious' or 'Add a bathtub'..."
            className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isModifying}
          className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 shrink-0"
        >
          {isModifying ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Modify</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500 font-semibold">Try:</span>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleExecutePrompt(qp.prompt)}
            disabled={isModifying}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-gold-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* AI Modification Diff Feedback with Before/After Metrics */}
      {lastChangeSummary && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 flex flex-col gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {lastChangeSummary.title}
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              New Total: ₹{lastChangeSummary.newTotal.toLocaleString('en-IN')} ({lastChangeSummary.priceDelta < 0 ? `-₹${Math.abs(lastChangeSummary.priceDelta).toLocaleString('en-IN')}` : `+₹${lastChangeSummary.priceDelta.toLocaleString('en-IN')}`})
            </span>
          </div>

          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {lastChangeSummary.explanation}
          </p>

          {/* Before vs After Metric Comparison Strip */}
          {lastChangeSummary.beforeScores && lastChangeSummary.afterScores && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/70 dark:bg-slate-950/70 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Overall Score:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {lastChangeSummary.beforeScores.overall} → {lastChangeSummary.afterScores.overall}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Space Score:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lastChangeSummary.beforeScores.space} → {lastChangeSummary.afterScores.space}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Style Match:</span>
                <span className="font-bold text-gold-600 dark:text-gold-400">
                  {lastChangeSummary.beforeScores.style} → {lastChangeSummary.afterScores.style}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Budget Efficiency:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {lastChangeSummary.beforeScores.budget} → {lastChangeSummary.afterScores.budget}
                </span>
              </div>
            </div>
          )}

          {/* Replacements Diff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/60 font-mono text-[11px]">
            {lastChangeSummary.replacedProducts.map((r, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Replaced:</span>
                <span className="truncate">{r.newProduct} ({r.priceDelta < 0 ? `-₹${Math.abs(r.priceDelta).toLocaleString('en-IN')}` : `+₹${r.priceDelta.toLocaleString('en-IN')}`})</span>
              </div>
            ))}
            {lastChangeSummary.retainedProducts.map((ret, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="text-brand-500 font-bold">✓ Retained:</span>
                <span className="truncate">{ret}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
