import { RoomConfig, WallSegment, Measurements } from './Room';
import { SurfaceFinishes } from './Tile';
import { PlacedProduct, DesignStyle } from './Product';

export type LayoutArchetype = 
  | 'l_shaped'           // Corner Wet Zone + Flow
  | 'symmetrical_focal'  // Centerpiece Vanity Suite
  | 'split_parallel'     // Dual-Wall Gallery
  | 'wet_room_suite';    // Master Wet-Room & Spa

export type OptimizationPriority = 
  | 'balanced'
  | 'budget_first'
  | 'water_eco'
  | 'luxury_first';

export interface QuotationBreakdown {
  wallTilesCost: number;
  floorTilesCost: number;
  sanitaryProductsCost: number;
  accessoriesCost: number;
  labourCost: number;
  transportCost: number;
  subtotalBeforeTax: number;
  gstRatePct: number;    // e.g. 18
  gstAmount: number;
  finalCost: number;     // Grand Total
  // Legacy / convenience fields
  fixtureSubtotal?: number;
  surfaceMaterialCost?: number;
  installationCost?: number;
  grandTotal?: number;
}

export interface DetectedElement {
  id: string;
  label: string;
  confidence: number;
  category: 'toilet' | 'vanity' | 'shower' | 'door' | 'window' | 'tile' | 'lighting' | 'mirror';
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: Record<string, any>;
}

export interface AIDetectionResult {
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
  detectedFinishes: {
    floorType: string;
    wallTiles: string;
    colorPalette: string[];
  };
  summary: string;
}

export interface RecommendationBundle {
  bundleType: 'optimal' | 'budget_saver' | 'luxury_upgrade';
  title: string;
  description: string;
  products: PlacedProduct[];
  totalCost: number;
  remainingBudget: number;
  budgetUtilizationPct: number;
  layoutArchetype?: LayoutArchetype;
  aiSummary: string;
  designScore?: {
    overallScore: number;
    spaceUtilization: number;
    budgetEfficiency: number;
    styleMatch: number;
    waterEfficiency: number;
    whyThisScore: string[];
  };
  waterSavings?: {
    annualSavedLiters: number;
    percentReduction: number;
    annualBillSavingsInr: number;
  };
  searchMetrics?: any;
}

export interface RecommendationResponse {
  optimal: RecommendationBundle;
  budgetSaver: RecommendationBundle;
  luxuryUpgrade: RecommendationBundle;
  searchMetrics?: any;
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
