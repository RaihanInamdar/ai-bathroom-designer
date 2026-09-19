import React from 'react';
import { WaterSavingsReport } from '../../types';
import { 
  Droplets, 
  IndianRupee, 
  Leaf, 
  Award
} from 'lucide-react';

interface WaterConservationCardProps {
  savings: WaterSavingsReport;
}

export const WaterConservationCard: React.FC<WaterConservationCardProps> = ({ savings }) => {
  const baselineWidth = 100;
  const kohlerWidth = Math.round((savings.annualKohlerLiters / savings.annualBaselineLiters) * 100);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-col gap-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold font-mono border border-cyan-500/30">
                KOHLER WATER CONSERVATION METRIC
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Estimated, not certified</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              💧 Estimated Annual Water & Utility Savings
            </h3>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-2xl font-extrabold text-cyan-500">
            {savings.annualSavedLiters.toLocaleString('en-IN')} L
          </span>
          <span className="text-xs text-slate-500 block">Saved / Year ({savings.percentReduction}% Reduction)</span>
        </div>
      </div>

      {/* Visual Bar Comparison Graph */}
      <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 font-mono text-xs">
        <div>
          <div className="flex items-center justify-between mb-1.5 text-slate-600 dark:text-slate-400">
            <span>Traditional Non-Aerated Bathroom</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{savings.annualBaselineLiters.toLocaleString('en-IN')} Liters/yr</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-xl overflow-hidden">
            <div className="h-full bg-red-400/80 dark:bg-red-500/70 rounded-xl" style={{ width: `${baselineWidth}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 text-slate-600 dark:text-slate-400">
            <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              ✨ AI KOHLER Water-Smart Design
            </span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{savings.annualKohlerLiters.toLocaleString('en-IN')} Liters/yr</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-xl overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl" style={{ width: `${kohlerWidth}%` }} />
          </div>
        </div>
      </div>

      {/* 3 Metric Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 font-sans flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Annual Bill Savings
          </span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            ₹{savings.annualBillSavingsInr.toLocaleString('en-IN')} / yr
          </span>
          <span className="text-[10px] text-slate-400 font-sans">10-Yr ROI: ₹{savings.tenYearBillSavingsInr.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 font-sans flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Carbon Offset
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            {savings.co2OffsetKg} kg CO₂e
          </span>
          <span className="text-[10px] text-slate-400 font-sans">Reduced water heating load</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 font-sans flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-gold-500" /> Green Rating
          </span>
          <span className="text-base font-bold text-gold-600 dark:text-gold-400">
            Lower-Flow Spec
          </span>
          <span className="text-[10px] text-slate-400 font-sans">Certification not claimed</span>
        </div>
      </div>

      {/* Assumptions Footer */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 leading-relaxed">
        <strong className="text-slate-700 dark:text-slate-300">Calculation Assumptions:</strong>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          {savings.assumptions.map((asm, i) => (
            <li key={i}>{asm}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
