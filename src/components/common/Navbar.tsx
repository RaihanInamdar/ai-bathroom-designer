import React from 'react';
import { AppBar, Toolbar, Tooltip, Chip } from '@mui/material';
import { 
  Sparkles, 
  Layers, 
  Box, 
  FileText, 
  Sliders, 
  Sun, 
  Moon, 
  Grid, 
  Leaf, 
  Scale, 
  Bot
} from 'lucide-react';

export type AppViewMode = 
  | 'wizard' 
  | 'planner2d' 
  | 'planner3d' 
  | 'finishes' 
  | 'eco' 
  | 'comparison' 
  | 'recommendations';

interface NavbarProps {
  activeView: AppViewMode;
  onChangeView: (view: AppViewMode) => void;
  onOpenQuotation: () => void;
  onToggleCopilot: () => void;
  totalCost: number;
  budget: number;
  hasDesign: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onChangeView,
  onOpenQuotation,
  onToggleCopilot,
  totalCost,
  budget,
  hasDesign,
  isDarkMode,
  onToggleDarkMode
}) => {
  const budgetUsedPct = budget > 0 ? Math.min(Math.round((totalCost / budget) * 100), 100) : 0;

  const NAV_ITEMS: { id: AppViewMode; label: string; icon: React.ReactNode; requiresDesign?: boolean }[] = [
    { id: 'wizard', label: 'Wizard', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'planner2d', label: '2D CAD', icon: <Layers className="w-3.5 h-3.5" />, requiresDesign: true },
    { id: 'planner3d', label: '3D Studio', icon: <Box className="w-3.5 h-3.5" />, requiresDesign: true },
    { id: 'finishes', label: 'Finishes', icon: <Grid className="w-3.5 h-3.5" />, requiresDesign: true },
    { id: 'eco', label: 'Eco Save', icon: <Leaf className="w-3.5 h-3.5" />, requiresDesign: true },
    { id: 'comparison', label: 'Matrix', icon: <Scale className="w-3.5 h-3.5" />, requiresDesign: true },
    { id: 'recommendations', label: 'Packages', icon: <Sparkles className="w-3.5 h-3.5" />, requiresDesign: true }
  ];

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        backgroundImage: 'none'
      }}
      className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-white/10 backdrop-blur-2xl transition-colors select-none"
    >
      <Toolbar disableGutters className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-2 min-h-0 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div 
          onClick={() => onChangeView('wizard')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 via-gold-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-glow-gold group-hover:scale-105 transition-all">
            <span className="font-serif text-base tracking-tighter font-extrabold">V</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black font-serif tracking-widest text-slate-900 dark:text-white">
                VERRE STUDIO
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-medium">
              Spatial Generative Suite
            </p>
          </div>
        </div>

        {/* View Switcher Navigation Tabs */}
        <nav className="hidden xl:flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            const isDisabled = item.requiresDesign && !hasDesign;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                disabled={isDisabled}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Budget Meter */}
          {hasDesign && totalCost > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-400 text-[10px] font-sans uppercase font-bold">Est.</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-400 text-[10px]">/ ₹{budget.toLocaleString('en-IN')}</span>
              <Chip
                label={`${budgetUsedPct}%`}
                size="small"
                sx={{
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  backgroundColor: budgetUsedPct > 100 ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                  color: budgetUsedPct > 100 ? '#f43f5e' : '#10b981'
                }}
              />
            </div>
          )}

          {/* Light / Dark Mode Toggle */}
          <Tooltip title={isDarkMode ? "Switch to Light Luxury Theme" : "Switch to Dark Obsidian Theme"}>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full bg-slate-100 dark:bg-onyx-850 hover:bg-slate-200 dark:hover:bg-onyx-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all hover:scale-105"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-champagne-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </Tooltip>

          {/* AI Copilot Button */}
          <button
            onClick={onToggleCopilot}
            className="px-3.5 py-1.5 rounded-full bg-champagne-500/15 hover:bg-champagne-500/25 text-champagne-700 dark:text-champagne-300 border border-champagne-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-105"
          >
            <Bot className="w-3.5 h-3.5 text-champagne-500" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Quotation BOM */}
          <button
            onClick={onOpenQuotation}
            disabled={!hasDesign}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-champagne-400 via-champagne-500 to-amber-600 hover:from-champagne-300 hover:to-amber-500 disabled:opacity-35 disabled:cursor-not-allowed text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-glow-champagne transition-all hover:scale-105"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quotation</span>
          </button>
        </div>
      </Toolbar>
    </AppBar>
  );
};
