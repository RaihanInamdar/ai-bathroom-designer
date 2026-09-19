export type DesignStyle = 
  | 'minimalist_modern' 
  | 'classic_luxury' 
  | 'japanese_zen' 
  | 'contemporary' 
  | 'premium'
  | 'modern';

export type ProductCategory = 
  | 'smart_toilet' 
  | 'toilet' 
  | 'faucet' 
  | 'vanity' 
  | 'shower' 
  | 'bathtub' 
  | 'mirror' 
  | 'cabinet'
  | 'light'
  | 'accessory';

export type OptimizationPriority = 
  | 'balanced'       // Best Overall
  | 'budget_first'   // Lowest Cost
  | 'water_eco'      // Maximum Water Saving
  | 'luxury_first';  // Ultra Luxury

export type LayoutArchetype = 
  | 'l_shaped'           // Corner Wet Zone + Flow
  | 'symmetrical_focal'  // Centerpiece Vanity Suite
  | 'split_parallel'     // Dual-Wall Gallery
  | 'wet_room_suite';    // Master Wet-Room & Spa

export interface ProductExplainability {
  spaceScore: number;       // e.g. 94 / 100
  spaceReason: string;
  budgetScore: number;      // e.g. 91 / 100
  budgetReason: string;
  styleScore: number;       // e.g. 96 / 100
  styleReason: string;
  waterScore: number;       // e.g. 90 / 100
  waterReason: string;
  clearanceVerified: boolean;
  clearanceNote: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  width: number; // ft
  depth: number; // ft
  height: number; // ft
  styles: DesignStyle[];
  tags: string[];
  rating: number;
  reviewsCount: number;
  material: string;
  finish: string;
  clearance: { front: number; sides: number };
  description: string;
  meshType: string;
  color: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  flushVolumeLiters?: number; // e.g. 3.8
  flowRateGpm?: number;       // e.g. 1.2
  waterSavingRating?: number; // 1 - 5 stars
  mountType?: 'floor' | 'countertop' | 'wall';
  brand?: string;
}

export interface PlacedProduct extends Product {
  instanceId: string;
  x: number; // center ft in room
  y: number; // center ft in room
  rotation: number; // 0, 90, 180, 270
  wallAttached: 'north' | 'south' | 'east' | 'west' | 'none';
  score: number;
  reason: string;
  explainability?: ProductExplainability;
  collisionWarning?: {
    hasViolation: boolean;
    violatingWith?: string;
    requiredDistanceFt: number;
    actualDistanceFt: number;
    message: string;
  };
}

export interface WallOpening {
  wall: 'north' | 'south' | 'east' | 'west';
  offset: number; // ft
  width: number;  // ft
  swing?: 'inward' | 'outward'; // door swing direction
}

export interface PlumbingPoint {
  id?: string;
  type: 'water_inlet' | 'waste_drain' | 'shower_drain';
  wall?: 'north' | 'south' | 'east' | 'west';
  x: number;
  y: number;
}

export interface RoomConfig {
  length: number; // ft
  width: number;  // ft
  height: number; // ft
  door: WallOpening;
  window?: WallOpening;
  plumbingPoints?: PlumbingPoint[];
  name?: string;
}

export interface FeasibilityValidation {
  isFeasible: boolean;
  budgetCheck: 'PASS' | 'FAIL';
  spaceCheck: 'PASS' | 'FAIL';
  styleCheck: 'PASS' | 'FAIL';
  toiletZoneClearance: boolean; // >= 2.5x3.0 ft
  vanityZoneClearance: boolean; // >= 3.0x1.5 ft
  showerWetZoneClearance: boolean; // >= 3.0x3.0 ft
  circulationAreaRatio: number; // >= 0.50
  doorSwingObstruction: boolean;
  rejectedCandidatesCount: number;
  rejectionLog: string[];
}

export interface OptimizationSearchMetrics {
  combinationsExplored: number;   // e.g. 240
  layoutsEvaluated: number;       // e.g. 48
  invalidLayoutsRejected: number; // e.g. 31
  paretoOptimalityScore: number;  // e.g. 94.6
  searchTimeMs: number;
  activePriority: OptimizationPriority;
}

export interface DesignScoreBreakdown {
  overallScore: number; // e.g. 94 / 100
  spaceUtilization: number; // 96
  budgetEfficiency: number; // 92
  styleMatch: number; // 95
  productCompatibility: number; // 94
  waterEfficiency: number; // 91
  whyThisScore: string[];
}

export interface WaterSavingsReport {
  annualBaselineLiters: number; // e.g. 68000
  annualKohlerLiters: number;   // e.g. 39500
  annualSavedLiters: number;    // e.g. 28500
  percentReduction: number;     // e.g. 42%
  annualBillSavingsInr: number; // e.g. 4275
  tenYearBillSavingsInr: number;
  co2OffsetKg: number;
  assumptions: string[];
}

export interface RecommendationBundle {
  bundleType: 'optimal' | 'budget_saver' | 'luxury_upgrade';
  title: string;
  description: string;
  products: PlacedProduct[];
  totalCost: number;
  remainingBudget: number;
  budgetUtilizationPct: number;
  feasibility: FeasibilityValidation;
  designScore: DesignScoreBreakdown;
  waterSavings: WaterSavingsReport;
  searchMetrics?: OptimizationSearchMetrics;
  layoutArchetype?: LayoutArchetype;
  aiSummary: string;
}

export interface RecommendationRequest {
  room: {
    length: number;
    width: number;
    height?: number;
    door: WallOpening;
    window?: WallOpening;
    plumbingPoints?: PlumbingPoint[];
  };
  budget: number;
  style: DesignStyle;
  preferredCategories?: string[];
  includeBathtub?: boolean;
  optimizationPriority?: OptimizationPriority;
  layoutArchetype?: LayoutArchetype;
}

export interface RecommendationResponse {
  optimal: RecommendationBundle;
  budgetSaver: RecommendationBundle;
  luxuryUpgrade: RecommendationBundle;
  roomValidation: {
    isValid: boolean;
    totalFloorArea: number;
    usedFloorArea: number;
    freeFloorArea: number;
    coveragePct: number;
    warnings: string[];
  };
  availableAlternatives: Record<string, Product[]>;
  searchMetrics: OptimizationSearchMetrics;
}

export interface ModifyDesignRequest {
  currentBundle: RecommendationBundle;
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
  userPrompt: string; // e.g. "Reduce below ₹85,000", "Make it more luxurious", "Add a bathtub", "Optimize water savings"
  priority?: OptimizationPriority;
}

export interface ModifyDesignResponse {
  success: boolean;
  modifiedBundle: RecommendationBundle;
  changesSummary: {
    title: string;
    replacedProducts: { oldProduct: string; newProduct: string; priceDelta: number }[];
    retainedProducts: string[];
    priceDelta: number;
    newTotal: number;
    beforeScores: { overall: number; space: number; budget: number; style: number; water: number };
    afterScores: { overall: number; space: number; budget: number; style: number; water: number };
    feasibilityCheck: 'PASS' | 'FAIL';
    explanation: string;
  };
}

export interface DetectedElement {
  id: string;
  label: string;
  confidence: number;
  category: 'toilet' | 'vanity' | 'shower' | 'door' | 'window' | 'tile' | 'lighting';
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: Record<string, any>;
}

export interface ImageAnalysisResult {
  detectedElements: DetectedElement[];
  estimatedDimensions: {
    length: number;
    width: number;
    height: number;
    confidence: number;
    notes: string;
  };
  detectedLayout: {
    doorWall: 'north' | 'south' | 'east' | 'west';
    windowWall?: 'north' | 'south' | 'east' | 'west';
    plumbingLocations: string[];
  };
  identifiedBottlenecks: string[];
  aiRecommendations: {
    existingIssue: string;
    recommendedKohlerFixture: string;
    spaceOrWaterBenefit: string;
  }[];
  aestheticAnalysis: {
    primaryColorPalette: string[];
    materialTone: string;
    lightingQuality: string;
    recommendedStyle: DesignStyle;
    styleMatchConfidence: number;
  };
  imageMetrics?: {
    dominantBrightness: number;
    colorTemperature: 'warm' | 'neutral' | 'cool';
    contrastRatio: number;
    detectedSurfaces: string[];
  };
  summary: string;
}
