export type WallOrientation = 'north' | 'south' | 'east' | 'west';

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
  wallAttached: WallOrientation | 'none';
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
  wall: WallOrientation;
  offset: number; // ft
  width: number;  // ft
  height?: number;
  sillHeight?: number;
  swing?: 'inward' | 'outward'; // door swing direction
}

export interface PlumbingPoint {
  id?: string;
  type: 'water_inlet' | 'waste_drain' | 'shower_drain';
  wall?: WallOrientation;
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

export interface WallSegment {
  id: string;
  wall: WallOrientation;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;
  height: number;
  grossArea: number;
  netArea: number;
  finishId: string;
}

export interface Measurements {
  floorArea: number;
  ceilingArea: number;
  perimeter: number;
  grossWallArea: number;
  netWallArea: number;
  doorArea: number;
  windowArea: number;
}

export function calculateMeasurements(room: RoomConfig): Measurements {
  const floorArea = Number((room.length * room.width).toFixed(2));
  const ceilingArea = floorArea;
  const perimeter = Number((2 * (room.length + room.width)).toFixed(2));
  const grossWallArea = Number((perimeter * room.height).toFixed(2));
  const doorWidth = room.door?.width || 2.5;
  const doorHeight = room.door?.height || 7.0;
  const doorArea = Number((doorWidth * doorHeight).toFixed(2));
  const windowWidth = room.window?.width || 0;
  const windowHeight = room.window?.height || (room.window ? 3.0 : 0);
  const windowArea = Number((windowWidth * windowHeight).toFixed(2));
  const netWallArea = Number(Math.max(0, grossWallArea - doorArea - windowArea).toFixed(2));

  return {
    floorArea,
    ceilingArea,
    perimeter,
    grossWallArea,
    netWallArea,
    doorArea,
    windowArea
  };
}

export type TileType =
  | 'marble'
  | 'granite'
  | 'ceramic'
  | 'wooden'
  | 'matte'
  | 'glossy'
  | 'stone'
  | 'mosaic'
  | 'concrete'
  | 'vintage'
  | 'designer';

export interface TileFinish {
  id: string;
  name: string;
  type: TileType;
  category: 'floor' | 'wall' | 'both';
  ratePerSqFt: number;
  color: string;
  textureUrl?: string;
  description: string;
  roughness: number;
  metalness: number;
  tileSizeInches: { width: number; height: number };
  origin?: string;
}

export interface SurfaceFinishes {
  floor: string;
  wall: string;
  ceiling?: string;
}

export interface QuotationBreakdown {
  wallTilesCost: number;
  floorTilesCost: number;
  sanitaryProductsCost: number;
  accessoriesCost: number;
  labourCost: number;
  transportCost: number;
  subtotalBeforeTax: number;
  gstRatePct: number;
  gstAmount: number;
  finalCost: number;
  fixtureSubtotal?: number;
  surfaceMaterialCost?: number;
  installationCost?: number;
  grandTotal?: number;
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
  annualBaselineLiters: number;
  annualDesignLiters: number;
  annualSavedLiters: number;
  percentReduction: number;
  annualBillSavingsInr: number;
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
    doorWall: WallOrientation;
    windowWall?: WallOrientation;
    plumbingLocations: string[];
  };
  identifiedBottlenecks: string[];
  aiRecommendations: {
    existingIssue: string;
    recommendedFixture: string;
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

export interface AIDetectionResult {
  detectedElements: DetectedElement[];
  estimatedDimensions: ImageAnalysisResult['estimatedDimensions'];
  detectedLayout: ImageAnalysisResult['detectedLayout'];
  detectedFinishes?: {
    floorType: string;
    wallTiles: string;
    colorPalette: string[];
  };
  summary: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  room: RoomConfig;
  walls: WallSegment[];
  floor: {
    finishId: string;
    area: number;
  };
  ceiling: {
    finishId: string;
    area: number;
    height: number;
  };
  products: PlacedProduct[];
  measurements: Measurements;
  quotation: QuotationBreakdown;
  aiDetection: AIDetectionResult | null;
  recommendations: RecommendationResponse | null;
  style: DesignStyle;
  budget: number;
  activeArchetype: LayoutArchetype;
  finishes: SurfaceFinishes;
}
