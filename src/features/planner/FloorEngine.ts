import { PlacedProduct } from '../../models/Product';
import { RoomConfig } from '../../models/Room';

export function getEffectiveDimensions(p: PlacedProduct): { width: number; depth: number } {
  const isRotated = p.rotation === 90 || p.rotation === 270;
  return {
    width: isRotated ? p.depth : p.width,
    depth: isRotated ? p.width : p.depth
  };
}

export function checkBoxesOverlap(
  p1: PlacedProduct,
  p2: PlacedProduct,
  buffer: number = 0.2
): boolean {
  if (p1.mountType === 'countertop' || p1.mountType === 'wall' || p2.mountType === 'countertop' || p2.mountType === 'wall') {
    return false;
  }

  const dim1 = getEffectiveDimensions(p1);
  const dim2 = getEffectiveDimensions(p2);

  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  const minX = (dim1.width + dim2.width) / 2 + buffer;
  const minY = (dim1.depth + dim2.depth) / 2 + buffer;

  return dx < minX && dy < minY;
}

export function isObstructionInDoorSwing(
  p: PlacedProduct,
  room: RoomConfig
): boolean {
  if (p.mountType === 'countertop' || p.mountType === 'wall' || p.category === 'faucet' || p.category === 'mirror' || p.category === 'accessory') {
    return false;
  }

  const door = room.door;
  const doorWidth = door.width || 2.5;
  const doorOffset = door.offset || 1.5;
  const hingeX = (door.wall === 'north' || door.wall === 'south') ? doorOffset : (door.wall === 'west' ? 0 : room.length);
  const hingeY = (door.wall === 'west' || door.wall === 'east') ? doorOffset : (door.wall === 'north' ? 0 : room.width);
  const dist = Math.hypot(p.x - hingeX, p.y - hingeY);

  const dim = getEffectiveDimensions(p);
  const requiredClearance = doorWidth + Math.min(dim.width, dim.depth) * 0.4;

  const isInQuadrant = 
    (door.wall === 'south' && p.y > room.width - doorWidth - 0.2 && Math.abs(p.x - (doorOffset + doorWidth / 2)) < doorWidth * 1.2) ||
    (door.wall === 'north' && p.y < doorWidth + 0.2 && Math.abs(p.x - (doorOffset + doorWidth / 2)) < doorWidth * 1.2) ||
    (door.wall === 'west' && p.x < doorWidth + 0.2 && Math.abs(p.y - (doorOffset + doorWidth / 2)) < doorWidth * 1.2) ||
    (door.wall === 'east' && p.x > room.length - doorWidth - 0.2 && Math.abs(p.y - (doorOffset + doorWidth / 2)) < doorWidth * 1.2);

  return dist < requiredClearance && isInQuadrant;
}

export function calculateCirculationRatio(products: PlacedProduct[], room: RoomConfig): number {
  const roomArea = room.length * room.width;
  if (roomArea <= 0) return 0.5;

  const usedArea = products
    .filter(p => p.mountType !== 'countertop' && p.mountType !== 'wall')
    .reduce((sum, p) => sum + (p.width * p.depth), 0);

  const freeArea = Math.max(0, roomArea - usedArea);
  return Number((freeArea / roomArea).toFixed(2));
}
