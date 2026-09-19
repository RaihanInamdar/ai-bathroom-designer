import React from 'react';
import { LayoutArchetype } from '../../types';
import { Shuffle, Compass, Check } from 'lucide-react';

interface LayoutArchetypeSelectorProps {
  currentArchetype: LayoutArchetype;
  onSelectArchetype: (archetype: LayoutArchetype) => void;
  roomArea: number;
}

const ARCHETYPES: {
  id: LayoutArchetype;
  title: string;
  subtitle: string;
  icon: string;
  tag: string;
}[] = [
  {
    id: 'symmetrical_focal',
    title: 'Symmetrical Focal',
    subtitle: 'Centered vanity feature wall with balanced side alcoves',
    icon: '🏛️',
    tag: 'Architectural Classic'
  },
  {
    id: 'l_shaped',
    title: 'L-Shaped Corner Flow',
    subtitle: 'Corner wet zone maximizing open central walking area',
    icon: '📐',
    tag: 'Space Optimizer'
  },
  {
    id: 'split_parallel',
    title: 'Split-Parallel Gallery',
    subtitle: 'Grooming lounge on one wall, Wet & Toilet on opposing wall',
    icon: '↔️',
    tag: 'Boutique Hotel'
  },
  {
    id: 'wet_room_suite',
    title: 'Master Spa Wet-Room',
    subtitle: 'Enclosed shower & soaking tub suite with front dry zone',
    icon: '🛁',
    tag: 'Luxury Onsen'
  }
];

export const LayoutArchetypeSelector: React.FC<LayoutArchetypeSelectorProps> = ({
  currentArchetype,
  onSelectArchetype,
  roomArea
}) => {
  const handleShuffle = () => {
    const list: LayoutArchetype[] = ['symmetrical_focal', 'l_shaped', 'split_parallel', 'wet_room_suite'];
    const currentIndex = list.indexOf(currentArchetype);
    const nextArchetype = list[(currentIndex + 1) % list.length];
    onSelectArchetype(nextArchetype);
  };

  const activeArch = ARCHETYPES.find(a => a.id === currentArchetype) || ARCHETYPES[0];

  return (
    <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-500">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Unique Architectural Spatial Archetypes</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {roomArea.toFixed(0)} sq.ft Area-Proportioned
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any spatial concept below to rearrange fixtures across different walls and functional zones.
            </p>
          </div>
        </div>

        <button
          onClick={handleShuffle}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-gold-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
        >
          <Shuffle className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
          <span>Shuffle Spaces</span>
        </button>
      </div>

      {/* Concept Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {ARCHETYPES.map((arch) => {
          const isActive = arch.id === currentArchetype;
          return (
            <button
              key={arch.id}
              onClick={() => onSelectArchetype(arch.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 relative ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-gold-500 shadow-glow-gold'
                  : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base">{arch.icon}</span>
                {isActive ? (
                  <span className="w-4 h-4 rounded-full bg-gold-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">{arch.tag}</span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{arch.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight mt-0.5">
                  {arch.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
