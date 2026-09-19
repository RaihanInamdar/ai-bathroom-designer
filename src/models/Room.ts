export type WallOrientation = 'north' | 'south' | 'east' | 'west';

export interface WallOpening {
  wall: WallOrientation;
  offset: number;     // Distance from wall start (ft)
  width: number;      // Opening width (ft)
  height?: number;    // Opening height (ft)
  sillHeight?: number;// Window sill height from floor (ft)
  swing?: 'inward' | 'outward'; // door swing direction
}

export interface PlumbingPoint {
  id?: string;
  type: 'water_inlet' | 'waste_drain' | 'shower_drain';
  wall?: WallOrientation;
  x: number;          // Room X coordinate (ft)
  y: number;          // Room Y coordinate (ft)
}

export interface WallSegment {
  id: string;
  wall: WallOrientation;
  start: { x: number; y: number };
  end: { x: number; y: number };
  length: number;     // ft
  height: number;     // ft
  grossArea: number;  // sq.ft
  netArea: number;    // sq.ft (minus doors/windows)
  finishId: string;
}

export interface RoomConfig {
  length: number;     // X dimension (ft)
  width: number;      // Y dimension (ft)
  height: number;     // Z dimension (ft)
  door: WallOpening;
  window?: WallOpening;
  plumbingPoints?: PlumbingPoint[];
  name?: string;
}

export interface Measurements {
  floorArea: number;       // sq.ft
  ceilingArea: number;     // sq.ft
  perimeter: number;       // ft
  grossWallArea: number;   // sq.ft
  netWallArea: number;     // sq.ft
  doorArea: number;        // sq.ft
  windowArea: number;      // sq.ft
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
