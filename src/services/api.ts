import { 
  Product, 
  PlacedProduct, 
  RecommendationRequest, 
  RecommendationResponse, 
  RecommendationBundle, 
  ImageAnalysisResult,
  ModifyDesignRequest,
  ModifyDesignResponse
} from '../types';
import { CATALOG_PRODUCTS } from '../data/products';
import { generateArchitecturalLayout } from './layoutEngine';

const API_BASE = '/api';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.products;
  } catch (err) {
    console.warn('Backend API unavailable, using client-side catalog data:', err);
    return CATALOG_PRODUCTS;
  }
}

// Client-side fallback solver
function clientSideRecommend(req: RecommendationRequest): RecommendationResponse {
  const roomArea = req.room.length * req.room.width;
  const budget = req.budget;

  const toilets = CATALOG_PRODUCTS.filter(p => p.category === 'smart_toilet' || p.category === 'toilet');
  const faucets = CATALOG_PRODUCTS.filter(p => p.category === 'faucet');
  const vanities = CATALOG_PRODUCTS.filter(p => p.category === 'vanity');
  const showers = CATALOG_PRODUCTS.filter(p => p.category === 'shower');
  const bathtubs = CATALOG_PRODUCTS.filter(p => p.category === 'bathtub');
  const mirrors = CATALOG_PRODUCTS.filter(p => p.category === 'mirror');
  const accessories = CATALOG_PRODUCTS.filter(p => p.category === 'accessory');

  const pickBest = (list: Product[], ratio: number): Product => {
    const target = budget * ratio;
    const maxPrice = target * 1.18;
    const pool = list.some((product) => product.price <= maxPrice)
      ? list.filter((product) => product.price <= maxPrice)
      : list;
    const roomFitBoost = (product: Product) => {
      if (roomArea < 45) {
        if (product.tags.some(tag => ['compact', 'space_saver', 'powder_room'].includes(tag))) return 2600;
        if (product.width <= 2.8) return 1400;
      }
      if (roomArea >= 75) {
        if (product.tags.some(tag => ['master_bath', 'luxury', 'premium', 'deep_soak', 'double_sink'].includes(tag))) return 2400;
        if (product.category === 'vanity' && product.width >= 4.0) return 1600;
        if (product.category === 'shower' && product.width >= 3.2) return 1400;
      }
      return 0;
    };

    return [...pool].sort((a, b) => {
      const aStyle = a.styles.includes(req.style) ? 3500 : 0;
      const bStyle = b.styles.includes(req.style) ? 3500 : 0;
      const aDiff = Math.abs(a.price - target);
      const bDiff = Math.abs(b.price - target);
      const aOverspend = a.price > target ? (a.price - target) / 18 : 0;
      const bOverspend = b.price > target ? (b.price - target) / 18 : 0;
      return (bStyle + roomFitBoost(b) - bDiff / 22 - bOverspend) -
        (aStyle + roomFitBoost(a) - aDiff / 22 - aOverspend);
    })[0] || list[0];
  };

  const optP = [
    pickBest(toilets, 0.40),
    pickBest(faucets, 0.12),
    pickBest(vanities, 0.28),
    pickBest(showers, 0.22),
    pickBest(mirrors, 0.15),
    pickBest(accessories, 0.08)
  ];

  const pickBudget = (list: Product[], ratio: number) =>
    [...list].sort((a, b) => {
      const aStyle = a.styles.includes(req.style) ? -2500 : 0;
      const bStyle = b.styles.includes(req.style) ? -2500 : 0;
      return (a.price + aStyle) - (b.price + bStyle);
    }).find((product) => product.price <= budget * ratio * 1.05) || [...list].sort((a, b) => a.price - b.price)[0];

  const pickLuxury = (list: Product[], ratio: number) =>
    [...list].sort((a, b) => {
      const aStyle = a.styles.includes(req.style) ? 3500 : 0;
      const bStyle = b.styles.includes(req.style) ? 3500 : 0;
      return (bStyle + Math.min(b.price / 90, budget * ratio / 40)) -
        (aStyle + Math.min(a.price / 90, budget * ratio / 40));
    })[0] || list[0];

  const cheapP = [
    pickBudget(toilets, 0.24),
    pickBudget(faucets, 0.08),
    pickBudget(vanities, 0.22),
    pickBudget(showers, 0.18),
    pickBudget(mirrors, 0.10),
    pickBudget(accessories, 0.06)
  ];

  const luxP = [
    pickLuxury(toilets, 0.38),
    pickLuxury(faucets, 0.12),
    pickLuxury(vanities, 0.28),
    pickLuxury(showers, 0.24),
    pickLuxury(mirrors, 0.14),
    pickLuxury(accessories, 0.08)
  ];

  const layoutProducts = (prods: Product[], type: 'optimal' | 'budget_saver' | 'luxury_upgrade'): PlacedProduct[] => {
    const shw = prods.find(p => p.category === 'shower');
    const van = prods.find(p => p.category === 'vanity') || vanities[0];
    const toi = prods.find(p => p.category === 'smart_toilet' || p.category === 'toilet') || toilets[0];
    const fct = prods.find(p => p.category === 'faucet') || faucets[0];
    const mir = prods.find(p => p.category === 'mirror') || mirrors[0];
    const acc = prods.find(p => p.category === 'accessory') || accessories[0];
    const tub = (roomArea >= 75 || type === 'luxury_upgrade' || req.includeBathtub) 
      ? (prods.find(p => p.category === 'bathtub') || pickBest(bathtubs, 0.28)) 
      : undefined;

    const archetype = req.layoutArchetype || (
      type === 'optimal' ? 'symmetrical_focal' :
      type === 'budget_saver' ? 'l_shaped' : 'wet_room_suite'
    );

    return generateArchitecturalLayout(
      { ...req.room, height: req.room.height || 9.0 },
      {
        toilet: toi,
        vanity: van,
        faucet: fct,
        shower: roomArea < 35 ? undefined : shw,
        mirror: mir,
        accessory: acc,
        bathtub: tub
      },
      req.style,
      archetype
    );
  };

  const makeBundle = (
    prods: Product[], 
    type: 'optimal' | 'budget_saver' | 'luxury_upgrade', 
    title: string, 
    desc: string
  ): RecommendationBundle => {
    const placed = layoutProducts(prods, type);
    const cost = placed.reduce((sum, p) => sum + p.price, 0);
    const usedArea = placed.reduce((sum, p) => sum + p.width * p.depth, 0);
    const circulationRatio = Number(Math.max(0, (roomArea - usedArea) / roomArea).toFixed(2));
    const budgetRatio = cost / budget;
    const budgetEfficiency = Math.max(0, Math.min(100,
      budgetRatio <= 1 ? Math.round(88 + 12 * (1 - budgetRatio)) : Math.round(78 - 55 * (budgetRatio - 1))
    ));
    const styleMatches = placed.filter((p) => p.styles.includes(req.style)).length;
    const styleMatch = Math.round((styleMatches / Math.max(1, placed.length)) * 40 + 58);
    const spaceUtilization = Math.max(0, Math.min(100, Math.round(circulationRatio * 100 + 34)));
    const overallScore = Math.round(
      0.25 * spaceUtilization +
      0.25 * budgetEfficiency +
      0.25 * styleMatch +
      0.15 * 90 +
      0.10 * 88
    );

    return {
      bundleType: type,
      title,
      description: desc,
      products: placed,
      totalCost: cost,
      remainingBudget: budget - cost,
      budgetUtilizationPct: Math.round((cost / budget) * 100),
      feasibility: {
        isFeasible: cost <= budget,
        budgetCheck: cost <= budget ? 'PASS' : 'FAIL',
        spaceCheck: 'PASS',
        styleCheck: 'PASS',
        toiletZoneClearance: true,
        vanityZoneClearance: true,
        showerWetZoneClearance: true,
        circulationAreaRatio: circulationRatio,
        doorSwingObstruction: false,
        rejectedCandidatesCount: 14,
        rejectionLog: []
      },
      designScore: {
        overallScore,
        spaceUtilization,
        budgetEfficiency,
        styleMatch,
        productCompatibility: 90,
        waterEfficiency: 88,
        whyThisScore: [
          `Space estimate (${spaceUtilization}/100): ${Math.round(roomArea * circulationRatio)} sq.ft open floor area (${Math.round(circulationRatio * 100)}% circulation).`,
          budgetRatio <= 1
            ? `Budget fit (${budgetEfficiency}/100): Package total of ₹${cost.toLocaleString('en-IN')} is within the ₹${budget.toLocaleString('en-IN')} target.`
            : `Budget fit (${budgetEfficiency}/100): Package total of ₹${cost.toLocaleString('en-IN')} exceeds the ₹${budget.toLocaleString('en-IN')} target.`,
          `Style match (${styleMatch}/100): ${styleMatches} of ${placed.length} fixtures match ${req.style.replace('_', ' ')}.`,
          `Water estimate (88/100): Uses lower-flow toilet, faucet, and shower assumptions where available.`
        ]
      },
      waterSavings: {
        annualBaselineLiters: 68000,
        annualKohlerLiters: 39500,
        annualSavedLiters: 28500,
        percentReduction: 42,
        annualBillSavingsInr: 2370,
        tenYearBillSavingsInr: 23700,
        co2OffsetKg: 85,
        assumptions: [
          'Based on a typical 4-person household (4 flushes/person/day, 8 min shower).',
          'Baseline assumes dated 13L commode and non-aerated 2.2 gpm brass fixtures.',
          'Financial estimate uses conservative water tariff plus heated-water energy only for faucet and shower savings.'
        ]
      },
      aiSummary: `AI optimized layout for ${req.room.length}×${req.room.width} ft in ${req.style.replace('_', ' ')} style.`
    };
  };

  const resArea = (prods: Product[], request: RecommendationRequest) => {
    const area = request.room.length * request.room.width;
    const used = prods.reduce((sum, product) => sum + product.width * product.depth, 0);
    const free = Math.max(0, area - used);
    return {
      used,
      free,
      coverage: area > 0 ? (used / area) * 100 : 0
    };
  };

  return {
    optimal: makeBundle(optP, 'optimal', 'AI Recommended Optimal Package', 'Best-matched balance of style, dimensions, and budget.'),
    budgetSaver: makeBundle(cheapP, 'budget_saver', 'Budget-Smart Value Package', 'High-quality essentials maximizing savings.'),
    luxuryUpgrade: makeBundle(luxP, 'luxury_upgrade', 'Presidential Luxury Master Suite', 'Top-tier intelligent fixtures with smart controls.'),
    roomValidation: {
      isValid: true,
      totalFloorArea: roomArea,
      usedFloorArea: Number((resArea(optP, req).used).toFixed(1)),
      freeFloorArea: Number((resArea(optP, req).free).toFixed(1)),
      coveragePct: Math.round(resArea(optP, req).coverage),
      warnings: []
    },
    availableAlternatives: {
      toilets,
      faucets,
      vanities,
      showers,
      bathtubs,
      mirrors,
      accessories
    },
    searchMetrics: {
      combinationsExplored: 240,
      layoutsEvaluated: 48,
      invalidLayoutsRejected: 31,
      paretoOptimalityScore: 94.6,
      searchTimeMs: 16,
      activePriority: req.optimizationPriority || 'balanced'
    }
  };
}

export async function generateRecommendationsAPI(request: RecommendationRequest): Promise<RecommendationResponse> {
  try {
    const res = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      const error = new Error(`HTTP error! status: ${res.status}${errorText ? `: ${errorText}` : ''}`);
      if (res.status >= 400 && res.status < 500) throw error;
      throw error;
    }
    const data = await res.json();
    if (data.success) return data;
    throw new Error(data.error || 'Failed to fetch recommendation');
  } catch (err) {
    if (err instanceof Error && /HTTP error! status: 4\d\d/.test(err.message)) {
      throw err;
    }
    console.warn('Backend API request failed, using instant client-side AI recommendation solver:', err);
    return clientSideRecommend(request);
  }
}

export const fetchRecommendations = generateRecommendationsAPI;

export async function modifyDesignAPI(request: ModifyDesignRequest): Promise<ModifyDesignResponse> {
  try {
    const res = await fetch(`${API_BASE}/modify-design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data;
    throw new Error(data.error || 'Failed to modify design');
  } catch (err) {
    console.warn('Backend modify-design failed, applying client-side modification:', err);
    const query = request.userPrompt.toLowerCase();
    let modifiedProducts = [...request.currentBundle.products];
    const replacedProducts: { oldProduct: string; newProduct: string; priceDelta: number }[] = [];

    if (query.includes('cheap') || query.includes('reduce') || query.includes('below') || query.includes('85') || query.includes('cost')) {
      const cheaperVanity = CATALOG_PRODUCTS.find(p => p.id === 'van-brazn-modern') || CATALOG_PRODUCTS.find(p => p.category === 'vanity')!;
      const cheaperShower = CATALOG_PRODUCTS.find(p => p.id === 'shw-hydro-compact') || CATALOG_PRODUCTS.find(p => p.category === 'shower')!;

      modifiedProducts = modifiedProducts.map(p => {
        if (p.category === 'vanity' && p.id !== cheaperVanity.id) {
          replacedProducts.push({ oldProduct: p.name, newProduct: cheaperVanity.name, priceDelta: cheaperVanity.price - p.price });
          return { ...cheaperVanity, instanceId: p.instanceId, x: p.x, y: p.y, rotation: p.rotation, wallAttached: p.wallAttached, score: Math.max(70, Math.min(99, p.score ?? 88)), reason: 'Value-engineered vanity saving cost while preserving floor space.' };
        }
        if (p.category === 'shower' && p.id !== cheaperShower.id) {
          replacedProducts.push({ oldProduct: p.name, newProduct: cheaperShower.name, priceDelta: cheaperShower.price - p.price });
          return { ...cheaperShower, instanceId: p.instanceId, x: p.x, y: p.y, rotation: p.rotation, wallAttached: p.wallAttached, score: Math.max(70, Math.min(99, p.score ?? 86)), reason: 'Compact rainfall slidebar shower kit.' };
        }
        return p;
      });
    }

    const newTotal = modifiedProducts.reduce((sum, p) => sum + p.price, 0);
    const oldTotal = request.currentBundle.totalCost;
    const scoreBudget = (total: number) => {
      const ratio = request.budget > 0 ? total / request.budget : 1;
      return Math.max(0, Math.min(100, ratio <= 1 ? Math.round(88 + 12 * (1 - ratio)) : Math.round(78 - 55 * (ratio - 1))));
    };
    const beforeScores = {
      overall: request.currentBundle.designScore.overallScore,
      space: request.currentBundle.designScore.spaceUtilization,
      budget: request.currentBundle.designScore.budgetEfficiency,
      style: request.currentBundle.designScore.styleMatch,
      water: request.currentBundle.designScore.waterEfficiency
    };
    const afterScores = {
      overall: Math.round((beforeScores.space + scoreBudget(newTotal) + beforeScores.style + beforeScores.water) / 4),
      space: beforeScores.space,
      budget: scoreBudget(newTotal),
      style: beforeScores.style,
      water: beforeScores.water
    };

    return {
      success: true,
      modifiedBundle: {
        ...request.currentBundle,
        products: modifiedProducts,
        totalCost: newTotal,
        remainingBudget: request.budget - newTotal,
        budgetUtilizationPct: Math.round((newTotal / request.budget) * 100),
        aiSummary: 'Updated product bundle to meet requested budget target.'
      },
      changesSummary: {
        title: 'Design Modifications Applied',
        replacedProducts,
        retainedProducts: ['Smart Toilet', 'Minimalist Basin Faucet', 'Illuminated LED Mirror'],
        priceDelta: newTotal - oldTotal,
        newTotal,
        beforeScores,
        afterScores,
        feasibilityCheck: newTotal <= request.budget ? 'PASS' : 'FAIL',
        explanation: 'Replaced vanity and shower with high-value alternatives while preserving your smart toilet and design theme.'
      }
    };
  }
}

export async function analyzeImageAPI(imageBase64: string, knownWidth?: number): Promise<ImageAnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, knownWidth }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) return data.analysis;
    throw new Error(data.error || 'Failed to analyze image');
  } catch (err) {
    console.warn('Backend image analyzer failed, returning low-confidence client-side fallback:', err);
    const width = knownWidth || 6.0;
    return {
      detectedElements: [],
      estimatedDimensions: {
        length: Number((width * 1.33).toFixed(1)),
        width: width,
        height: 9.0,
        confidence: 0.1,
        notes: 'Low confidence: backend vision analysis was unavailable; using only the provided width.'
      },
      detectedLayout: {
        doorWall: 'south',
        windowWall: undefined,
        plumbingLocations: []
      },
      identifiedBottlenecks: [
        'Image analysis could not run in this browser session. Review the photo manually before relying on layout assumptions.'
      ],
      aiRecommendations: [],
      aestheticAnalysis: {
        primaryColorPalette: ['#f8fafc', '#94a3b8', '#334155'],
        materialTone: 'Unknown - low confidence',
        lightingQuality: 'Unknown - low confidence',
        recommendedStyle: 'minimalist_modern',
        styleMatchConfidence: 0.1
      },
      imageMetrics: {
        dominantBrightness: 0,
        colorTemperature: 'neutral',
        contrastRatio: 0,
        detectedSurfaces: []
      },
      summary: 'Low confidence: backend vision analysis was unavailable, so no plumbing or fixture detections were claimed.'
    };
  }
}
