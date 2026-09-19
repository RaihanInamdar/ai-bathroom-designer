import { WallOrientation } from './Room';

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

export type DesignStyle = 
  | 'minimalist_modern' 
  | 'classic_luxury' 
  | 'japanese_zen' 
  | 'contemporary' 
  | 'premium'
  | 'modern';

export interface ProductClearance {
  front: number; // ft
  sides: number; // ft
}

export interface ProductExplainability {
  spaceScore: number;
  spaceReason: string;
  budgetScore: number;
  budgetReason: string;
  styleScore: number;
  styleReason: string;
  waterScore: number;
  waterReason: string;
  clearanceVerified: boolean;
  clearanceNote: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  width: number;  // ft
  depth: number;  // ft
  height: number; // ft
  styles: DesignStyle[];
  tags: string[];
  rating: number;
  reviewsCount: number;
  material: string;
  finish: string;
  clearance: ProductClearance;
  description: string;
  meshType: string;
  color: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  flushVolumeLiters?: number;
  flowRateGpm?: number;
  waterSavingRating?: number;
  mountType?: 'floor' | 'countertop' | 'wall';
  brand?: string;
}

export interface PlacedProduct extends Product {
  instanceId: string;
  x: number;          // center X in ft
  y: number;          // center Y in ft
  rotation: number;   // 0, 90, 180, 270
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
