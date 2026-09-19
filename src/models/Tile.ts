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
  ratePerSqFt: number;   // Price in INR per sq.ft
  color: string;         // Hex code
  textureUrl?: string;   // Procedural or image texture
  description: string;
  roughness: number;     // 0 - 1 for PBR 3D materials
  metalness: number;     // 0 - 1
  tileSizeInches: { width: number; height: number }; // e.g. 24x24, 12x24
  origin?: string;       // e.g. "Italian Carrara", "Spanish Ceramic"
}

export interface SurfaceFinishes {
  floor: string;         // TileFinish id
  wall: string;          // TileFinish id
  ceiling?: string;      // Paint / finish id
}
