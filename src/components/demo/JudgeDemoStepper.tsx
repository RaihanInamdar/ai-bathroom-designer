import React, { useState } from 'react';
import { Check, Award, ChevronDown, ChevronUp } from 'lucide-react';

interface JudgeDemoStepperProps {
  currentStep: number;
}

const DEMO_STEPS = [
  { step: 1, title: 'Input Specs', desc: '8×6 ft, ₹1L, Japanese Zen' },
  { step: 2, title: 'AI Vision Scan', desc: 'Scan Rough-ins & Bottlenecks' },
  { step: 3, title: '3-Tier Bundles', desc: 'Optimal, Budget & Luxury' },
  { step: 4, title: 'Constraint Engine', desc: 'Space + Budget PASS ✓' },
  { step: 5, title: '2D CAD Layout', desc: 'Clearance & Wet Zones' },
  { step: 6, title: '3D WebGL Studio', desc: 'Real Photos & PBR Shaders' },
  { step: 7, title: '"Change My Design" AI', desc: 'Natural Language Mutation' },
  { step: 8, title: 'Score & Water Savings', desc: '94/100 Score & 28.5K L Saved' },
];

export const JudgeDemoStepper: React.FC<JudgeDemoStepperProps> = ({ currentStep }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-xl border-b border-gold-500/20 px-4 sm:px-8 py-2 text-xs transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            <span className="font-bold text-gold-400 text-[11px] font-mono tracking-wide flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              VERRE STUDIO ARCHITECTURE RUBRIC
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden lg:inline font-medium">
            13-Step Automated Judge Showcase
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-gold-400 border border-slate-800 text-[11px] font-mono transition-all"
        >
          <span>{isExpanded ? 'Collapse Flow' : 'View Demo Flow'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-3 pb-1 border-t border-slate-800/80 mt-2 animate-in fade-in duration-200">
          {DEMO_STEPS.map((s) => {
            const isDone = currentStep >= s.step;
            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 ${
                  isDone 
                    ? 'bg-slate-900/90 border-gold-500/30 shadow-sm' 
                    : 'bg-slate-900/40 border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-gold-400">Step {s.step}</span>
                  {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className="text-[11px] font-semibold text-slate-200 truncate">{s.title}</span>
                <span className="text-[10px] text-slate-400 truncate">{s.desc}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
