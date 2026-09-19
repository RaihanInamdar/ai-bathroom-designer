import { RoomConfig, WallOrientation } from '../../models/Room';
import { Product, PlacedProduct, DesignStyle } from '../../models/Product';
import { LayoutArchetype } from '../../models/Bathroom';
import { isObstructionInDoorSwing } from './FloorEngine';

export interface LayoutFixtures {
  toilet: Product;
  vanity: Product;
  faucet: Product;
  shower?: Product;
  mirror?: Product;
  accessory?: Product;
  bathtub?: Product;
}

function getCoordinatesOnWall(
  wall: WallOrientation,
  posAlongWall: number,
  product: Product,
  room: RoomConfig
): { x: number; y: number; rotation: number } {
  const L = room.length;
  const W = room.width;
  const d = product.depth;
  const w = product.width;

  switch (wall) {
    case 'north':
      return {
        x: Math.max(w / 2 + 0.15, Math.min(L - w / 2 - 0.15, posAlongWall)),
        y: Number((d / 2 + 0.12).toFixed(2)),
        rotation: 0
      };
    case 'south':
      return {
        x: Math.max(w / 2 + 0.15, Math.min(L - w / 2 - 0.15, posAlongWall)),
        y: Number((W - d / 2 - 0.12).toFixed(2)),
        rotation: 180
      };
    case 'west':
      return {
        x: Number((d / 2 + 0.12).toFixed(2)),
        y: Math.max(w / 2 + 0.15, Math.min(W - w / 2 - 0.15, posAlongWall)),
        rotation: 270
      };
    case 'east':
      return {
        x: Number((L - d / 2 - 0.12).toFixed(2)),
        y: Math.max(w / 2 + 0.15, Math.min(W - w / 2 - 0.15, posAlongWall)),
        rotation: 90
      };
  }
}

export function generateArchitecturalLayout(
  room: RoomConfig,
  fixtures: LayoutFixtures,
  style: DesignStyle,
  archetype: LayoutArchetype = 'symmetrical_focal'
): PlacedProduct[] {
  const L = room.length;
  const W = room.width;
  const area = L * W;
  const doorWall = room.door.wall;
  const isCompact = area < 42;
  const isLarge = area >= 70;

  const placed: PlacedProduct[] = [];

  let vanityData: { x: number; y: number; rotation: number; wall: WallOrientation };
  let showerData: { x: number; y: number; rotation: number; wall: WallOrientation } | null = null;
  let toiletData: { x: number; y: number; rotation: number; wall: WallOrientation };
  let tubData: { x: number; y: number; rotation: number; wall: 'none' | WallOrientation } | null = null;
  let accessoryData: { x: number; y: number; rotation: number; wall: WallOrientation } | null = null;

  const van = fixtures.vanity;
  const toi = fixtures.toilet;
  const shw = fixtures.shower;
  const tub = fixtures.bathtub;
  const acc = fixtures.accessory;

  const effectiveArchetype: LayoutArchetype = isCompact ? 'l_shaped' : archetype;

  switch (effectiveArchetype) {
    case 'symmetrical_focal': {
      if (shw && !isCompact) {
        showerData = {
          x: Number((L - shw.width / 2 - 0.15).toFixed(2)),
          y: Number((shw.depth / 2 + 0.15).toFixed(2)),
          rotation: 0,
          wall: 'north'
        };
      }

      const remainingNorth = (showerData && shw) ? (L - shw.width - 0.5) : (L - 0.3);
      if (remainingNorth >= van.width + 0.3) {
        const vanPos = remainingNorth / 2 + 0.15;
        vanityData = { ...getCoordinatesOnWall('north', vanPos, van, room), wall: 'north' };
      } else {
        const vanPos = W * 0.48;
        vanityData = { ...getCoordinatesOnWall('west', vanPos, van, room), wall: 'west' };
      }

      const toiMinY = showerData ? showerData.y + (shw ? shw.depth : 3) / 2 + 1.2 : 1.5;
      const toiPos = Math.min(W - toi.width / 2 - 0.3, Math.max(toiMinY, W * 0.72));
      toiletData = { ...getCoordinatesOnWall('east', toiPos, toi, room), wall: 'east' };

      if (acc) {
        accessoryData = { ...getCoordinatesOnWall('west', W * 0.55, acc, room), wall: 'west' };
      }

      if (isLarge && tub && L >= 11) {
        tubData = {
          x: Number((L * 0.45).toFixed(2)),
          y: Number((W * 0.6).toFixed(2)),
          rotation: 0,
          wall: 'none'
        };
      }
      break;
    }

    case 'l_shaped': {
      if (shw && !isCompact) {
        showerData = {
          x: Number((L - shw.width / 2 - 0.15).toFixed(2)),
          y: Number((shw.depth / 2 + 0.15).toFixed(2)),
          rotation: 0,
          wall: 'north'
        };
      }

      const vanPos = Math.max(van.width / 2 + 0.3, Math.min(W - van.width / 2 - 0.3, W * 0.46));
      vanityData = { ...getCoordinatesOnWall('west', vanPos, van, room), wall: 'west' };

      const toiMinY = showerData ? showerData.y + (shw ? shw.depth : 3) / 2 + 1.2 : 1.5;
      const toiPos = Math.min(W - toi.width / 2 - 0.3, Math.max(toiMinY, W * 0.74));
      toiletData = { ...getCoordinatesOnWall('east', toiPos, toi, room), wall: 'east' };

      if (acc) {
        const accPos = Math.max(0.6, vanityData.y - van.width / 2 - 0.7);
        accessoryData = { ...getCoordinatesOnWall('west', accPos, acc, room), wall: 'west' };
      }

      if (isLarge && tub && L >= 11) {
        tubData = {
          x: Number((L * 0.52).toFixed(2)),
          y: Number((W * 0.58).toFixed(2)),
          rotation: 0,
          wall: 'none'
        };
      }
      break;
    }

    case 'split_parallel': {
      const vanPos = Math.max(van.width / 2 + 0.3, Math.min(W - van.width / 2 - 0.3, W * 0.5));
      vanityData = { ...getCoordinatesOnWall('west', vanPos, van, room), wall: 'west' };

      if (shw && !isCompact) {
        showerData = {
          x: Number((L - shw.width / 2 - 0.15).toFixed(2)),
          y: Number((shw.depth / 2 + 0.15).toFixed(2)),
          rotation: 0,
          wall: 'north'
        };
      }

      const toiMinY = showerData ? showerData.y + (shw ? shw.depth : 3) / 2 + 1.2 : 1.5;
      const toiPos = Math.min(W - toi.width / 2 - 0.3, Math.max(toiMinY, W * 0.75));
      toiletData = { ...getCoordinatesOnWall('east', toiPos, toi, room), wall: 'east' };

      if (acc) {
        const accPos = Math.max(0.6, W * 0.2);
        accessoryData = { ...getCoordinatesOnWall('west', accPos, acc, room), wall: 'west' };
      }

      if (isLarge && tub && L >= 11.5) {
        tubData = {
          x: Number((tub.width / 2 + 0.4).toFixed(2)),
          y: Number((tub.depth / 2 + 0.4).toFixed(2)),
          rotation: 0,
          wall: 'north'
        };
      }
      break;
    }

    case 'wet_room_suite':
    default: {
      if (isLarge && tub && L >= 10.5) {
        if (shw && !isCompact) {
          showerData = {
            x: Number((L - shw.width / 2 - 0.15).toFixed(2)),
            y: Number((shw.depth / 2 + 0.15).toFixed(2)),
            rotation: 0,
            wall: 'north'
          };
        }

        tubData = {
          x: Number((tub.width / 2 + 0.35).toFixed(2)),
          y: Number((tub.depth / 2 + 0.35).toFixed(2)),
          rotation: 0,
          wall: 'north'
        };

        const vanPos = Math.min(W - van.width / 2 - 0.3, Math.max(tub.depth + van.width / 2 + 0.6, W * 0.68));
        vanityData = { ...getCoordinatesOnWall('west', vanPos, van, room), wall: 'west' };

        const toiMinY = showerData ? showerData.y + (shw ? shw.depth : 3) / 2 + 1.2 : 1.5;
        const toiPos = Math.min(W - toi.width / 2 - 0.3, Math.max(toiMinY, W * 0.74));
        toiletData = { ...getCoordinatesOnWall('east', toiPos, toi, room), wall: 'east' };

        if (acc) {
          accessoryData = { ...getCoordinatesOnWall('west', W * 0.28, acc, room), wall: 'west' };
        }
      } else {
        if (shw && !isCompact) {
          showerData = {
            x: Number((L - shw.width / 2 - 0.15).toFixed(2)),
            y: Number((shw.depth / 2 + 0.15).toFixed(2)),
            rotation: 0,
            wall: 'north'
          };
        }

        const vanPos = Math.max(van.width / 2 + 0.3, Math.min(W - van.width / 2 - 0.3, W * 0.46));
        vanityData = { ...getCoordinatesOnWall('west', vanPos, van, room), wall: 'west' };

        const toiMinY = showerData ? showerData.y + (shw ? shw.depth : 3) / 2 + 1.2 : 1.5;
        const toiPos = Math.min(W - toi.width / 2 - 0.3, Math.max(toiMinY, W * 0.72));
        toiletData = { ...getCoordinatesOnWall('east', toiPos, toi, room), wall: 'east' };

        if (acc) {
          accessoryData = { ...getCoordinatesOnWall('west', Math.max(0.6, W * 0.18), acc, room), wall: 'west' };
        }
      }
      break;
    }
  }

  // Safety door swing check
  const candidateToilet: PlacedProduct = {
    ...toi,
    instanceId: `inst-toi-${toi.id}`,
    x: toiletData.x,
    y: toiletData.y,
    rotation: toiletData.rotation,
    wallAttached: toiletData.wall,
    score: 95,
    reason: 'Sanitary station'
  };

  if (isObstructionInDoorSwing(candidateToilet, room)) {
    if (doorWall === 'south') {
      const safeY = showerData ? Math.max(showerData.y + 2.5, W * 0.5) : W * 0.5;
      toiletData = { ...getCoordinatesOnWall('east', safeY, toi, room), wall: 'east' };
    } else {
      toiletData = { ...getCoordinatesOnWall('west', W * 0.5, toi, room), wall: 'west' };
    }
  }

  // Push to placed products array
  if (showerData && shw) {
    placed.push({
      ...shw,
      instanceId: `inst-shw-${shw.id}`,
      mountType: 'floor',
      x: showerData.x,
      y: showerData.y,
      rotation: showerData.rotation,
      wallAttached: showerData.wall,
      score: 97,
      reason: `Wet zone enclosed in ${showerData.wall} corner.`
    });
  }

  placed.push({
    ...van,
    instanceId: `inst-van-${van.id}`,
    mountType: 'floor',
    x: vanityData.x,
    y: vanityData.y,
    rotation: vanityData.rotation,
    wallAttached: vanityData.wall,
    score: 98,
    reason: `${effectiveArchetype.replace('_', ' ').toUpperCase()} grooming suite on ${vanityData.wall} wall.`
  });

  if (fixtures.faucet) {
    const f = fixtures.faucet;
    placed.push({
      ...f,
      instanceId: `inst-fct-${f.id}`,
      mountType: 'countertop',
      x: vanityData.x,
      y: vanityData.y,
      rotation: vanityData.rotation,
      wallAttached: vanityData.wall,
      score: 98,
      reason: `Mounted to ${van.name} countertop.`
    });
  }

  if (fixtures.mirror) {
    const m = fixtures.mirror;
    placed.push({
      ...m,
      instanceId: `inst-mir-${m.id}`,
      mountType: 'wall',
      x: vanityData.x,
      y: vanityData.y,
      rotation: vanityData.rotation,
      wallAttached: vanityData.wall,
      score: 98,
      reason: `Mounted above vanity at eye level.`
    });
  }

  placed.push({
    ...toi,
    instanceId: `inst-toi-${toi.id}`,
    mountType: 'floor',
    x: toiletData.x,
    y: toiletData.y,
    rotation: toiletData.rotation,
    wallAttached: toiletData.wall,
    score: 96,
    reason: `Positioned on ${toiletData.wall} wall outside door swing.`
  });

  if (tubData && tub) {
    placed.push({
      ...tub,
      instanceId: `inst-tub-${tub.id}`,
      mountType: 'floor',
      x: tubData.x,
      y: tubData.y,
      rotation: tubData.rotation,
      wallAttached: tubData.wall,
      score: 97,
      reason: `Freestanding soaking tub center.`
    });
  }

  if (accessoryData && acc) {
    placed.push({
      ...acc,
      instanceId: `inst-acc-${acc.id}`,
      mountType: 'wall',
      x: accessoryData.x,
      y: accessoryData.y,
      rotation: accessoryData.rotation,
      wallAttached: accessoryData.wall,
      score: 92,
      reason: `Towel warmer on ${accessoryData.wall} wall.`
    });
  }

  return placed;
}
