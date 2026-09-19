import React, { useState, useEffect, useMemo } from 'react';
import { 
  DesignStyle, 
  PlacedProduct, 
  RecommendationBundle, 
  RecommendationResponse,
  Product,
  OptimizationPriority,
  LayoutArchetype,
  ImageAnalysisResult,
  PlumbingPoint
} from './types';
import { CATALOG_PRODUCTS } from './data/products';
import { generateArchitecturalLayout } from './services/layoutEngine';
import { generateRecommendationsAPI } from './services/api';
import { Navbar, AppViewMode } from './components/common/Navbar';
import { DesignWizard } from './components/wizard/DesignWizard';
import { StructuredDesignPlan } from './components/plan/StructuredDesignPlan';
import { AiDesignScoreCard } from './components/score/AiDesignScoreCard';
import { FloorPlanner2D } from './components/planner2d/FloorPlanner2D';
import { ThreeStudio } from './components/planner3d/ThreeStudio';
import { BundleAlternatives } from './components/recommendations/BundleAlternatives';
import { SwapModal } from './components/recommendations/SwapModal';
import { QuotationModal } from './components/quotation/QuotationModal';
import { TileStudio } from './components/finishes/TileStudio';
import { EcoSavingsCalculator } from './components/eco/EcoSavingsCalculator';
import { DesignComparison } from './components/comparison/DesignComparison';
import { AiCopilot } from './components/copilot/AiCopilot';
import { calculateQuotation } from './services/quotation';
import { useDesignStore } from './store/designStore';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from './theme';

function derivePhotoArchetype(scan: ImageAnalysisResult, area: number): LayoutArchetype {
  const categories = new Set(scan.detectedElements.map((element) => element.category));
  const summary = `${scan.summary} ${scan.identifiedBottlenecks.join(' ')}`.toLowerCase();

  if (area >= 75 || summary.includes('tub') || summary.includes('spa')) {
    return 'wet_room_suite';
  }

  if (categories.has('shower') && categories.has('toilet') && categories.has('vanity')) {
    return 'split_parallel';
  }

  if (summary.includes('entry') || summary.includes('clearance') || summary.includes('compact')) {
    return 'l_shaped';
  }

  return 'symmetrical_focal';
}

function derivePhotoFinishes(scan: ImageAnalysisResult) {
  const style = scan.aestheticAnalysis.recommendedStyle;
  const tone = `${scan.aestheticAnalysis.materialTone} ${scan.aestheticAnalysis.lightingQuality}`.toLowerCase();
  const colorTemp = scan.imageMetrics?.colorTemperature;

  if (style === 'japanese_zen' || tone.includes('wood') || tone.includes('hinoki') || colorTemp === 'warm') {
    return { floor: 'wooden_hinoki', wall: 'designer_fluted_3d' };
  }

  if (style === 'classic_luxury' || tone.includes('brass') || tone.includes('carrara') || tone.includes('gold')) {
    return { floor: 'marble_calacatta_gold', wall: 'marble_carrara' };
  }

  if (style === 'contemporary' || tone.includes('charcoal') || tone.includes('slate') || colorTemp === 'cool') {
    return { floor: 'matte_graphite_slate', wall: 'concrete_industrial_cast' };
  }

  return { floor: 'designer_terrazzo_venetian', wall: 'ceramic_artisan_glazed' };
}

function derivePlumbingPoints(scan: ImageAnalysisResult, roomLength: number, roomWidth: number): PlumbingPoint[] {
  const midpoint = (box: ImageAnalysisResult['detectedElements'][number]['boundingBox']) => ({
    x: Number(Math.max(0.4, Math.min(roomLength - 0.4, ((box.x + box.width / 2) / 100) * roomLength)).toFixed(2)),
    y: Number(Math.max(0.4, Math.min(roomWidth - 0.4, ((box.y + box.height / 2) / 100) * roomWidth)).toFixed(2))
  });

  return scan.detectedElements
    .filter((element) => ['toilet', 'vanity', 'shower'].includes(element.category))
    .map((element, index) => {
      const center = midpoint(element.boundingBox);
      const type: PlumbingPoint['type'] = element.category === 'shower'
        ? 'shower_drain'
        : element.category === 'toilet'
          ? 'waste_drain'
          : 'water_inlet';

      return {
        id: `photo-${element.category}-${index}`,
        type,
        wall: scan.detectedLayout.windowWall || 'north',
        x: center.x,
        y: center.y
      };
    });
}

export function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeNavView, setActiveNavView] = useState<AppViewMode>('wizard');

  // Design inputs
  const room = useDesignStore((state) => state.room);
  const products = useDesignStore((state) => state.products);
  const finishes = useDesignStore((state) => state.finishes);
  const layoutArchetype = useDesignStore((state) => state.layoutArchetype);
  const setRoom = useDesignStore((state) => state.setRoom);
  const setProducts = useDesignStore((state) => state.setProducts);
  const setFinishes = useDesignStore((state) => state.setFinishes);
  const setLayoutArchetype = useDesignStore((state) => state.setLayoutArchetype);
  const [budget, setBudget] = useState<number>(100000);
  const [style, setStyle] = useState<DesignStyle>('japanese_zen');
  const [optimizationPriority, setOptimizationPriority] = useState<OptimizationPriority>('balanced');
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [includeBathtubPreference, setIncludeBathtubPreference] = useState<boolean | null>(null);
  
  // Recommendations
  const [recResponse, setRecResponse] = useState<RecommendationResponse | null>(null);
  const [activeBundleType, setActiveBundleType] = useState<'optimal' | 'budget_saver' | 'luxury_upgrade'>('optimal');
  const [activeBundle, setActiveBundle] = useState<RecommendationBundle | null>(null);

  // Selected & Swap Product
  const [selectedProduct, setSelectedProduct] = useState<PlacedProduct | null>(null);
  const [swapTargetProduct, setSwapTargetProduct] = useState<PlacedProduct | null>(null);

  // Modals
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);

  // Studio feature toggles (synced across 2D, 3D, and AI Copilot voice/chat)
  const [studioFeatures, setStudioFeatures] = useState({
    showRunningWater: true,
    showDimensions3D: false,
    showCeiling: false,
    isCutaway: true,
    showClearances: true
  });

  const handleToggleStudioFeature = (feature: 'water' | 'clearance' | 'dimensions' | 'ceiling' | 'cutaway', enabled?: boolean) => {
    setStudioFeatures(prev => {
      switch (feature) {
        case 'water':
          return { ...prev, showRunningWater: enabled !== undefined ? enabled : !prev.showRunningWater };
        case 'clearance':
          return { ...prev, showClearances: enabled !== undefined ? enabled : !prev.showClearances };
        case 'dimensions':
          return { ...prev, showDimensions3D: enabled !== undefined ? enabled : !prev.showDimensions3D };
        case 'ceiling':
          return { ...prev, showCeiling: enabled !== undefined ? enabled : !prev.showCeiling };
        case 'cutaway':
          return { ...prev, isCutaway: enabled !== undefined ? enabled : !prev.isCutaway };
        default:
          return prev;
      }
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const size = params.get('size');
    const sharedStyle = params.get('style') as DesignStyle | null;
    const sharedTier = params.get('tier');
    const validStyles: DesignStyle[] = ['minimalist_modern', 'classic_luxury', 'japanese_zen', 'contemporary', 'premium', 'modern'];

    if (size) {
      const match = size.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);
      if (match) {
        const length = Math.max(5, Math.min(18, Number(match[1])));
        const width = Math.max(4, Math.min(14, Number(match[2])));
        setRoom({ ...room, length, width });
      }
    }

    if (sharedStyle && validStyles.includes(sharedStyle)) {
      setStyle(sharedStyle);
    }

    if (sharedTier === 'budget_saver' || sharedTier === 'luxury_upgrade' || sharedTier === 'optimal') {
      setActiveBundleType(sharedTier);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quotation = useMemo(() => {
    return activeBundle ? calculateQuotation({ ...activeBundle, products }, room, finishes) : null;
  }, [activeBundle, products, room, finishes]);

  const saveDesignSnapshot = async (
    bundle: RecommendationBundle,
    savedProducts: PlacedProduct[],
    snapshot: { room: typeof room; budget: number; style: DesignStyle }
  ) => {
    try {
      await fetch('/api/save-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: snapshot.room,
          budget: snapshot.budget,
          style: snapshot.style,
          finishes,
          bundle: { ...bundle, products: savedProducts }
        })
      });
    } catch (error) {
      console.warn('Could not save design snapshot:', error);
    }
  };

  const handleImageAnalyzed = (scan: ImageAnalysisResult) => {
    setPhotoAnalysis(scan);
    if (scan.estimatedDimensions.confidence < 0.35 && scan.detectedElements.length === 0) {
      return;
    }

    const nextLength = Number(Math.max(5, Math.min(18, scan.estimatedDimensions.length)).toFixed(1));
    const nextWidth = Number(Math.max(4, Math.min(14, scan.estimatedDimensions.width)).toFixed(1));
    const nextRoom = {
      ...room,
      length: nextLength,
      width: nextWidth,
      height: Number(Math.max(8, Math.min(12, scan.estimatedDimensions.height || room.height)).toFixed(1)),
      door: {
        ...room.door,
        wall: scan.detectedLayout.doorWall,
        offset: Number(Math.max(0.4, Math.min(nextLength - 2.8, room.door.offset || nextLength * 0.25)).toFixed(2)),
        width: room.door.width || 2.5
      },
      window: scan.detectedLayout.windowWall
        ? {
            wall: scan.detectedLayout.windowWall,
            offset: Number((nextLength * 0.35).toFixed(2)),
            width: 3,
            swing: undefined
          }
        : room.window,
      plumbingPoints: derivePlumbingPoints(scan, nextLength, nextWidth)
    };

    setRoom(nextRoom);
    setStyle(scan.aestheticAnalysis.recommendedStyle);
    setFinishes(derivePhotoFinishes(scan));
    setLayoutArchetype(derivePhotoArchetype(scan, nextLength * nextWidth));
  };

  // Sync theme with html root class
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Generate recommendations
  const handleGenerateDesign = async (
    overridePriority?: OptimizationPriority,
    overrides?: {
      room?: typeof room;
      budget?: number;
      style?: DesignStyle;
      includeBathtub?: boolean;
    }
  ) => {
    setIsGenerating(true);
    const pri = overridePriority || optimizationPriority;
    const effectiveRoom = overrides?.room || room;
    const effectiveBudget = overrides?.budget ?? budget;
    const effectiveStyle = overrides?.style || style;
    const effectiveArchetype = photoAnalysis
      ? derivePhotoArchetype(photoAnalysis, effectiveRoom.length * effectiveRoom.width)
      : layoutArchetype;
    const photoRequestsTub = photoAnalysis
      ? `${photoAnalysis.summary} ${photoAnalysis.identifiedBottlenecks.join(' ')}`.toLowerCase().includes('tub')
      : false;
    try {
      const res = await generateRecommendationsAPI({
        room: {
          length: effectiveRoom.length,
          width: effectiveRoom.width,
          height: effectiveRoom.height,
          door: effectiveRoom.door,
          window: effectiveRoom.window,
          plumbingPoints: effectiveRoom.plumbingPoints
        },
        budget: effectiveBudget,
        style: effectiveStyle,
        optimizationPriority: pri,
        layoutArchetype: effectiveArchetype,
        includeBathtub: overrides?.includeBathtub ?? includeBathtubPreference ?? photoRequestsTub
      });

      if (photoAnalysis) {
        const roughInSummary = photoAnalysis.detectedLayout.plumbingLocations.length > 0
          ? `rough-ins at ${photoAnalysis.detectedLayout.plumbingLocations.join(', ')}`
          : 'no confident rough-in detections';
        const photoSummary = `Photo scan detected ${photoAnalysis.detectedElements.length} zones, ${photoAnalysis.estimatedDimensions.length}×${photoAnalysis.estimatedDimensions.width} ft envelope, ${photoAnalysis.aestheticAnalysis.recommendedStyle.replace('_', ' ')} styling, and ${roughInSummary}.`;
        res.optimal = {
          ...res.optimal,
          title: 'Photo-Adaptive AI Bathroom Design',
          description: photoSummary,
          aiSummary: photoSummary,
          layoutArchetype: effectiveArchetype
        };
      }

      setRecResponse(res);
      setActiveBundle(res.optimal);
      setProducts(res.optimal.products);
      saveDesignSnapshot(res.optimal, res.optimal.products, {
        room: effectiveRoom,
        budget: effectiveBudget,
        style: effectiveStyle
      });
      if (res.optimal.layoutArchetype) {
        setLayoutArchetype(res.optimal.layoutArchetype);
      }
      setActiveBundleType('optimal');
      setIsGenerated(true);
      setActiveNavView('planner3d');
    } catch (err) {
      console.error('Failed to generate recommendation:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch Active Bundle
  const handleSelectBundleType = (type: 'optimal' | 'budget_saver' | 'luxury_upgrade') => {
    if (!recResponse) return;
    setActiveBundleType(type);
    const nextBundle = type === 'optimal'
      ? recResponse.optimal
      : type === 'budget_saver'
        ? recResponse.budgetSaver
        : recResponse.luxuryUpgrade;
    setActiveBundle(nextBundle);
    setProducts(nextBundle.products);
    if (nextBundle.layoutArchetype) {
      setLayoutArchetype(nextBundle.layoutArchetype);
    }
  };

  // Switch Architectural Layout Archetype
  const handleSelectArchetype = (arch: LayoutArchetype) => {
    setLayoutArchetype(arch);
    if (products.length === 0) return;

    const van = products.find(p => p.category === 'vanity') || CATALOG_PRODUCTS.find(p => p.category === 'vanity')!;
    const toi = products.find(p => p.category === 'smart_toilet' || p.category === 'toilet') || CATALOG_PRODUCTS.find(p => p.category === 'smart_toilet' || p.category === 'toilet')!;
    const fct = products.find(p => p.category === 'faucet') || CATALOG_PRODUCTS.find(p => p.category === 'faucet')!;
    const shw = products.find(p => p.category === 'shower');
    const mir = products.find(p => p.category === 'mirror');
    const acc = products.find(p => p.category === 'accessory');
    const tub = products.find(p => p.category === 'bathtub');

    const newPlaced = generateArchitecturalLayout(
      { ...room, height: room.height || 9.0 },
      {
        toilet: toi,
        vanity: van,
        faucet: fct,
        shower: shw,
        mirror: mir,
        accessory: acc,
        bathtub: tub
      },
      style,
      arch
    );

    setProducts(newPlaced);
    if (activeBundle) {
      setActiveBundle({
        ...activeBundle,
        products: newPlaced,
        layoutArchetype: arch
      });
    }
  };

  // Apply Modified Bundle from "Change My Design" AI
  // Switch Priority & Re-optimize
  const handleSelectPriority = (pri: OptimizationPriority) => {
    setOptimizationPriority(pri);
    handleGenerateDesign(pri);
  };

  // Fixture Swap
  const handleSwapProduct = (newProduct: Product) => {
    if (!swapTargetProduct || !activeBundle) return;

    const updatedProducts = products.map((p) => {
      if (p.instanceId === swapTargetProduct.instanceId) {
        return {
          ...newProduct,
          instanceId: p.instanceId,
          x: p.x,
          y: p.y,
          rotation: p.rotation,
          wallAttached: p.wallAttached,
          score: 95,
          reason: `Manually customized fixture model in ${activeBundle.title}.`
        };
      }
      return p;
    });

    const newTotal = updatedProducts.reduce((sum, p) => sum + p.price, 0);

    const updatedBundle: RecommendationBundle = {
      ...activeBundle,
      products: updatedProducts,
      totalCost: newTotal,
      remainingBudget: budget - newTotal
    };

    setActiveBundle(updatedBundle);
    setProducts(updatedProducts);
    setSwapTargetProduct(null);
  };

  const handleDirectSwapProduct = (newProduct: Product) => {
    if (!activeBundle) return;
    const existing = products.find(p => 
      p.category === newProduct.category || 
      ((p.category === 'toilet' || p.category === 'smart_toilet') && (newProduct.category === 'toilet' || newProduct.category === 'smart_toilet'))
    );
    if (existing) {
      const updatedProducts = products.map((p) => {
        if (p.instanceId === existing.instanceId) {
          return {
            ...newProduct,
            instanceId: p.instanceId,
            x: p.x,
            y: p.y,
            rotation: p.rotation,
            wallAttached: p.wallAttached,
            score: 95,
            reason: `Copilot customized fixture model in ${activeBundle.title}.`
          };
        }
        return p;
      });

      const newTotal = updatedProducts.reduce((sum, p) => sum + p.price, 0);
      const updatedBundle = {
        ...activeBundle,
        products: updatedProducts,
        totalCost: newTotal,
        remainingBudget: budget - newTotal
      };
      setActiveBundle(updatedBundle);
      setProducts(updatedProducts);
    }
  };

  const handleUpdateProducts = (updatedProducts: PlacedProduct[]) => {
    setProducts(updatedProducts);
    if (activeBundle) {
      const newTotal = updatedProducts.reduce((sum, product) => sum + product.price, 0);
      setActiveBundle({
        ...activeBundle,
        products: updatedProducts,
        totalCost: newTotal,
        remainingBudget: budget - newTotal,
        budgetUtilizationPct: Math.round((newTotal / budget) * 100)
      });
    }
  };

  const currentBundle = activeBundle ? { ...activeBundle, products } : null;
  const studioStats = currentBundle ? [
    {
      label: 'AI Score',
      value: `${currentBundle.designScore?.overallScore || 96}/100`,
      note: 'Space and style fit'
    },
    {
      label: 'Water Saved',
      value: currentBundle.waterSavings ? `${(currentBundle.waterSavings.annualSavedLiters / 1000).toFixed(1)}k L` : '18.4k L',
      note: 'Annual estimate'
    },
    {
      label: 'Investment',
      value: `₹${currentBundle.totalCost.toLocaleString('en-IN')}`,
      note: `${Math.round((currentBundle.totalCost / budget) * 100)}% of budget`
    },
    {
      label: 'Clearance',
      value: currentBundle.feasibility?.spaceCheck || 'CHECK',
      note: currentBundle.feasibility?.spaceCheck === 'PASS' ? 'Estimated clearances pass' : 'Needs review'
    }
  ] : [];

  return (
    <ThemeProvider theme={getTheme(isDarkMode)}>
      <div className="min-h-screen flex flex-col bg-[#fbfbfe] text-slate-950 transition-colors duration-300 dark:bg-[#0a0d14] dark:text-slate-100 ambient-glow selection:bg-champagne-500/25 selection:text-champagne-900 dark:selection:text-champagne-200">
        <Navbar
          activeView={activeNavView}
          onChangeView={(view) => {
            setActiveNavView(view);
            if (view === 'wizard') setIsGenerated(false);
          }}
          onOpenQuotation={() => setIsQuotationOpen(true)}
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
          totalCost={quotation?.grandTotal || 0}
          budget={budget}
          hasDesign={isGenerated}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

      <main className="flex-1 w-full px-3 py-4 sm:px-5 lg:px-7">
        {!isGenerated || activeNavView === 'wizard' ? (
          <div className="max-w-4xl mx-auto w-full">
            <DesignWizard
              room={room}
              budget={budget}
              style={style}
              onUpdateRoom={setRoom}
              onUpdateBudget={setBudget}
              onUpdateStyle={setStyle}
              onImageAnalyzed={handleImageAnalyzed}
              onGenerate={() => handleGenerateDesign()}
              isGenerating={isGenerating}
            />
          </div>
        ) : currentBundle ? (
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 animate-in fade-in duration-300">
            <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
              <div className="glass-panel-luxury p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-champagne-500/15 text-champagne-600 dark:text-champagne-400 border border-champagne-500/30">
                      Active Spatial Design
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {room.length}' × {room.width}' ({(room.length * room.width).toFixed(0)} sq ft)
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {currentBundle.title}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {currentBundle.aiSummary || currentBundle.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-3">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400">Total Investment:</span>
                    <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                      ₹{currentBundle.totalCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsQuotationOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-champagne-400 via-champagne-500 to-amber-600 hover:from-champagne-300 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-champagne transition-all hover:scale-105"
                  >
                    Generate Bill of Materials
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {studioStats.map((stat) => (
                  <div key={stat.label} className="glass-panel p-3.5 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</span>
                    <div className="my-1 text-xl font-black text-slate-900 dark:text-white font-mono">{stat.value}</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{stat.note}</span>
                  </div>
                ))}
              </div>
            </section>


            {activeNavView === 'planner2d' && (
              <div className="h-[min(720px,calc(100vh-210px))] min-h-[560px] w-full">
                <FloorPlanner2D
                  room={room}
                  products={products}
                  onUpdateRoom={setRoom}
                  onUpdateProducts={handleUpdateProducts}
                  onOpenSwapCatalog={(p) => setSwapTargetProduct(p)}
                  showClearanceZones={studioFeatures.showClearances}
                  onToggleClearanceZones={(val) => handleToggleStudioFeature('clearance', val)}
                />
              </div>
            )}

            {activeNavView === 'planner3d' && (
              <div className="grid min-h-[620px] grid-cols-1 gap-4 xl:grid-cols-[0.74fr_1.26fr]">
                <div className="h-[620px]">
                  <FloorPlanner2D
                    room={room}
                    products={products}
                    onUpdateRoom={setRoom}
                    onUpdateProducts={handleUpdateProducts}
                    onOpenSwapCatalog={(p) => setSwapTargetProduct(p)}
                    showClearanceZones={studioFeatures.showClearances}
                    onToggleClearanceZones={(val) => handleToggleStudioFeature('clearance', val)}
                  />
                </div>

                <div className="h-[620px]">
                  <ThreeStudio
                    room={room}
                    products={products}
                    style={style}
                    finishes={finishes}
                    selectedProductId={selectedProduct?.instanceId || null}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                    onUpdateProducts={handleUpdateProducts}
                    onUpdateFinishes={setFinishes}
                    showRunningWater={studioFeatures.showRunningWater}
                    onToggleRunningWater={(val) => handleToggleStudioFeature('water', val)}
                    showDimensions3D={studioFeatures.showDimensions3D}
                    onToggleDimensions3D={(val) => handleToggleStudioFeature('dimensions', val)}
                    showCeiling={studioFeatures.showCeiling}
                    onToggleCeiling={(val) => handleToggleStudioFeature('ceiling', val)}
                    isCutaway={studioFeatures.isCutaway}
                    onToggleCutaway={(val) => handleToggleStudioFeature('cutaway', val)}
                  />
                </div>
              </div>
            )}

            {activeNavView === 'finishes' && (
              <TileStudio
                room={room}
                finishes={finishes}
                onUpdateFinishes={setFinishes}
              />
            )}

            {activeNavView === 'eco' && (
              <EcoSavingsCalculator
                bundle={currentBundle}
              />
            )}

            {activeNavView === 'comparison' && recResponse && (
              <DesignComparison
                optimal={recResponse.optimal}
                budgetSaver={recResponse.budgetSaver}
                luxuryUpgrade={recResponse.luxuryUpgrade}
                currentType={activeBundleType}
                onSelectBundle={handleSelectBundleType}
                room={room}
              />
            )}

            {activeNavView === 'recommendations' && recResponse && (
              <BundleAlternatives
                optimal={recResponse.optimal}
                budgetSaver={recResponse.budgetSaver}
                luxuryUpgrade={recResponse.luxuryUpgrade}
                activeBundleType={activeBundleType}
                onSelectBundle={handleSelectBundleType}
                onOpenSwapModal={(p) => setSwapTargetProduct(p)}
              />
            )}

            {/* Optional Collapsible In-Depth Specifications */}
            <div className="pt-1 flex flex-col items-center">
              <button
                onClick={() => setShowDetailedSpecs(!showDetailedSpecs)}
                className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>{showDetailedSpecs ? '▲ Hide' : '▼ Show'} Detailed Feasibility & Engineering Report</span>
              </button>

              {showDetailedSpecs && (
                <div className="mt-4 w-full flex flex-col gap-5 animate-in fade-in duration-200">
                  <StructuredDesignPlan
                    bundle={currentBundle}
                    room={room}
                    budget={budget}
                    style={style}
                  />
                  <AiDesignScoreCard
                    bundle={currentBundle}
                    room={room}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Fixture Model Swap Drawer */}
      <SwapModal
        currentProduct={swapTargetProduct}
        onClose={() => setSwapTargetProduct(null)}
        onSwap={handleSwapProduct}
      />

      {/* Client Quotation / BOM Modal */}
      {isQuotationOpen && currentBundle && (
        <QuotationModal
          bundle={currentBundle}
          room={room}
          finishes={finishes}
          onClose={() => setIsQuotationOpen(false)}
        />
      )}

      {/* Floating AI Copilot Drawer */}
      <AiCopilot
        room={room}
        budget={budget}
        style={style}
        finishes={finishes}
        bundle={currentBundle}
        products={products}
        onUpdateRoom={setRoom}
        onUpdateBudget={setBudget}
        onUpdateStyle={setStyle}
        onUpdateFinishes={setFinishes}
        onSetIncludeBathtub={setIncludeBathtubPreference}
        onTriggerRegenerate={(overrides) => handleGenerateDesign(undefined, overrides)}
        onSwapProduct={handleDirectSwapProduct}
        onUpdateProducts={handleUpdateProducts}
        onToggleStudioFeature={handleToggleStudioFeature}
        isOpen={isCopilotOpen}
        onToggleOpen={() => setIsCopilotOpen(!isCopilotOpen)}
      />
      </div>
    </ThemeProvider>
  );
}
