import { RoomConfig } from '../types';

export interface PresetRoomOption {
  id: string;
  name: string;
  subtitle: string;
  dimensions: string;
  config: RoomConfig;
  idealFor: string;
  defaultBudget: number;
}

export const PRESET_ROOMS: PresetRoomOption[] = [
  {
    id: 'preset-standard',
    name: 'Standard Master Bath',
    subtitle: 'Balanced 3-Piece Layout',
    dimensions: '8 ft × 6 ft (48 sq.ft)',
    idealFor: 'Apartments, Master Ensuite & Modern Condos',
    defaultBudget: 100000,
    config: {
      name: 'Standard Master Bath (8x6 ft)',
      length: 8.0,
      width: 6.0,
      height: 9.0,
      door: { wall: 'south', offset: 2.0, width: 2.5 },
      window: { wall: 'east', offset: 2.0, width: 2.0 },
      plumbingPoints: [
        { type: 'water_inlet', wall: 'north', x: 2.0, y: 0.5 },
        { type: 'waste_drain', wall: 'north', x: 4.5, y: 0.5 },
        { type: 'shower_drain', wall: 'north', x: 6.8, y: 0.5 }
      ]
    }
  },
  {
    id: 'preset-compact',
    name: 'Compact Powder Room',
    subtitle: 'Space-Optimized 2-Piece',
    dimensions: '6 ft × 5 ft (30 sq.ft)',
    idealFor: 'Guest Bathrooms & City Studios',
    defaultBudget: 65000,
    config: {
      name: 'Compact Powder Room (6x5 ft)',
      length: 6.0,
      width: 5.0,
      height: 8.5,
      door: { wall: 'south', offset: 1.5, width: 2.2 },
      window: { wall: 'north', offset: 2.0, width: 1.5 },
      plumbingPoints: [
        { type: 'water_inlet', wall: 'west', x: 0.5, y: 2.0 },
        { type: 'waste_drain', wall: 'north', x: 3.5, y: 0.5 }
      ]
    }
  },
  {
    id: 'preset-master-spa',
    name: 'Master Spa Suite',
    subtitle: '4-Piece with Walk-in Shower',
    dimensions: '10 ft × 8 ft (80 sq.ft)',
    idealFor: 'Luxury Villas & High-end Residences',
    defaultBudget: 180000,
    config: {
      name: 'Master Spa Suite (10x8 ft)',
      length: 10.0,
      width: 8.0,
      height: 9.5,
      door: { wall: 'south', offset: 3.0, width: 2.8 },
      window: { wall: 'north', offset: 4.0, width: 3.0 },
      plumbingPoints: [
        { type: 'water_inlet', wall: 'west', x: 0.5, y: 3.5 },
        { type: 'waste_drain', wall: 'north', x: 5.0, y: 0.5 },
        { type: 'shower_drain', wall: 'east', x: 9.0, y: 2.0 }
      ]
    }
  },
  {
    id: 'preset-presidential',
    name: 'Presidential Oasis',
    subtitle: '5-Piece with Soaking Tub + Rain Shower',
    dimensions: '12 ft × 10 ft (120 sq.ft)',
    idealFor: 'Penthouse & Luxury Estate Master Bath',
    defaultBudget: 280000,
    config: {
      name: 'Presidential Oasis (12x10 ft)',
      length: 12.0,
      width: 10.0,
      height: 10.0,
      door: { wall: 'south', offset: 4.0, width: 3.0 },
      window: { wall: 'north', offset: 4.5, width: 3.5 },
      plumbingPoints: [
        { type: 'water_inlet', wall: 'west', x: 0.5, y: 4.0 },
        { type: 'waste_drain', wall: 'north', x: 6.0, y: 0.5 },
        { type: 'shower_drain', wall: 'east', x: 10.5, y: 2.5 }
      ]
    }
  }
];
