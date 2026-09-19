import { 
  DesignStyle, 
  LayoutArchetype, 
  PlacedProduct, 
  Product, 
  ProductExplainability, 
  RoomConfig 
} from '../types';

export interface LayoutFixtures {
  toilet: Product;
  vanity: Product;
  faucet: Product;
  shower?: Product;
  mirror?: Product;
  accessory?: Product;
  bathtub?: Product;
}

function findFixture(
  products: Product[],
  catalog: Product[],
  matcher: (product: Product) => boolean
): Product | undefined {
  return products.find(matcher) || catalog.find(matcher);
}

export function pickLayoutFixtures(products: Product[], catalog: Product[]): LayoutFixtures {
  const toilet = findFixture(
    products,
    catalog,
    (product) => product.category === 'smart_toilet' || product.category === 'toilet'
  );
  const vanity = findFixture(products, catalog, (product) => product.category === 'vanity');
  const faucet = findFixture(products, catalog, (product) => product.category === 'faucet');

  if (!toilet || !vanity || !faucet) {
    throw new Error('Catalog is missing required toilet, vanity, or faucet fixtures');
  }

  return {
    toilet,
    vanity,
    faucet,
    shower: findFixture(products, catalog, (product) => product.category === 'shower'),
    mirror: findFixture(products, catalog, (product) => product.category === 'mirror'),
    accessory: findFixture(products, catalog, (product) => product.category === 'accessory'),
    bathtub: findFixture(products, catalog, (product) => product.category === 'bathtub')
  };
}

function clampScore(value: number): number {
  return Math.round(Math.max(40, Math.min(99, value)));
}

export function buildProductExplainability(
  product: Product,
  style: DesignStyle,
  frontClearanceAvailable: number
): ProductExplainability {
  const isStyleMatch = product.styles.includes(style);
  const styleName = style.replace('_', ' ');
  const requiredFrontClearance = product.clearance?.front ?? 2.5;
  const sideClearance = product.clearance?.sides ?? 0.5;
  const clearanceVerified = frontClearanceAvailable >= Math.min(requiredFrontClearance, 2.1);
  const spaceScore = clampScore((frontClearanceAvailable / Math.max(requiredFrontClearance, 0.5)) * 90);
  const budgetScore = clampScore(100 - product.price / 8000);
  const styleScore = isStyleMatch ? 96 : 72;
  const flowBonus = product.flowRateGpm && product.flowRateGpm <= 1.5 ? 8 : 0;
  const flushBonus = product.flushVolumeLiters && product.flushVolumeLiters <= 4 ? 8 : 0;
  const waterScore = clampScore((product.waterSavingRating || 3) * 16 + flowBonus + flushBonus);

  return {
    spaceScore,
    spaceReason: `${product.width}' × ${product.depth}' fixture has ${frontClearanceAvailable.toFixed(1)} ft front clearance versus ${requiredFrontClearance.toFixed(1)} ft specified.`,
    budgetScore,
    budgetReason: `Priced at ₹${product.price.toLocaleString('en-IN')}; lower fixture cost scores higher on this axis.`,
    styleScore,
    styleReason: isStyleMatch
      ? `Listed styles include ${styleName} (${product.finish}).`
      : `Not tagged for ${styleName}; treated as a compatible fill-in.`,
    waterScore,
    waterReason: product.flushVolumeLiters
      ? `Rated ${product.flushVolumeLiters} L flush, water-saving rating ${product.waterSavingRating || 3}/5.`
      : product.flowRateGpm
        ? `Rated ${product.flowRateGpm} gpm, water-saving rating ${product.waterSavingRating || 3}/5.`
        : `Water-saving rating ${product.waterSavingRating || 3}/5; no flush or flow spec on this SKU.`,
    clearanceVerified,
    clearanceNote: clearanceVerified
      ? `Front clearance ${frontClearanceAvailable.toFixed(1)} ft with ${sideClearance} ft side buffer.`
      : `Manual review: front clearance ${frontClearanceAvailable.toFixed(1)} ft is below the ${requiredFrontClearance.toFixed(1)} ft spec.`
  };
}

export type WallName = 'north' | 'south' | 'east' | 'west';

export function getWallSpan(wall: WallName, room: RoomConfig): number {
  return (wall === 'west' || wall === 'east') ? room.width : room.length;
}

// Convert wall attachment and offset along wall into room (x, y) coordinates
function getCoordinatesOnWall(
  wall: WallName,
  posAlongWall: number,
  product: Product,
  room: RoomConfig
): { x: number; y: number; rotation: number } {
  const L = room.length;
  const W = room.width;
  const d = product.depth;
  const w = product.width;

  switch (wall) {
    case 'north': // at y = 0, facing South (+Z)
      return {
        x: Math.max(w / 2 + 0.15, Math.min(L - w / 2 - 0.15, posAlongWall)),
        y: Number((d / 2 + 0.12).toFixed(2)),
        rotation: 0
      };
    case 'south': // at y = W, facing North (-Z)
      return {
        x: Math.max(w / 2 + 0.15, Math.min(L - w / 2 - 0.15, posAlongWall)),
        y: Number((W - d / 2 - 0.12).toFixed(2)),
        rotation: 180
      };
    case 'west': // at x = 0, facing East (+X)
      return {
        x: Number((d / 2 + 0.12).toFixed(2)),
        y: Math.max(w / 2 + 0.15, Math.min(W - w / 2 - 0.15, posAlongWall)),
        rotation: 270
      };
    case 'east': // at x = L, facing West (-X)
      return {
        x: Number((L - d / 2 - 0.12).toFixed(2)),
        y: Math.max(w / 2 + 0.15, Math.min(W - w / 2 - 0.15, posAlongWall)),
        rotation: 90
      };
  }
}

// Door swing collision checker
export function isPointInDoorSwing(
  x: number,
  y: number,
  radius: number,
  room: RoomConfig
): boolean {
  const door = room.door;
  const doorWidth = door.width || 2.5;
  const doorOffset = door.offset || 1.5;
  const hingeX = door.wall === 'north' || door.wall === 'south' 
    ? doorOffset + doorWidth / 2 
    : (door.wall === 'west' ? 0 : room.length);
  const hingeY = door.wall === 'west' || door.wall === 'east' 
    ? doorOffset + doorWidth / 2 
    : (door.wall === 'north' ? 0 : room.width);

  const dist = Math.hypot(x - hingeX, y - hingeY);
  return dist < (doorWidth + radius * 0.75);
}

// Check if two floor boxes overlap
function doBoxesOverlap(
  p1: { x: number; y: number; width: number; depth: number; rotation: number },
  p2: { x: number; y: number; width: number; depth: number; rotation: number },
  buffer: number = 0.2
): boolean {
  const w1 = (p1.rotation === 90 || p1.rotation === 270) ? p1.depth : p1.width;
  const d1 = (p1.rotation === 90 || p1.rotation === 270) ? p1.width : p1.depth;
  const w2 = (p2.rotation === 90 || p2.rotation === 270) ? p2.depth : p2.width;
  const d2 = (p2.rotation === 90 || p2.rotation === 270) ? p2.width : p2.depth;

  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  return dx < (w1 + w2) / 2 + buffer && dy < (d1 + d2) / 2 + buffer;
}

type PlacementWall = WallName | 'none';

interface PlacementCandidate {
  x: number;
  y: number;
  rotation: number;
  wall: PlacementWall;
  score: number;
  reason: string;
  frontClearance: number;
  plumbingDistance?: number;
}

interface FixturePlanItem {
  key: 'shower' | 'bathtub' | 'vanity' | 'toilet' | 'accessory';
  product?: Product;
  required: boolean;
}

function getOppositeWall(wall: WallName): WallName {
  switch (wall) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}

function getWallOffsetFromPoint(wall: WallName, x: number, y: number): number {
  return wall === 'north' || wall === 'south' ? x : y;
}

function getFixtureFootprint(
  product: Product,
  x: number,
  y: number,
  rotation: number
): { left: number; right: number; top: number; bottom: number; width: number; depth: number } {
  const width = (rotation === 90 || rotation === 270) ? product.depth : product.width;
  const depth = (rotation === 90 || rotation === 270) ? product.width : product.depth;

  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - depth / 2,
    bottom: y + depth / 2,
    width,
    depth
  };
}

function isWithinRoom(product: Product, candidate: PlacementCandidate, room: RoomConfig): boolean {
  const box = getFixtureFootprint(product, candidate.x, candidate.y, candidate.rotation);
  const margin = 0.08;
  return (
    box.left >= margin &&
    box.right <= room.length - margin &&
    box.top >= margin &&
    box.bottom <= room.width - margin
  );
}

function getOpeningFootprint(
  opening: { wall: WallName; offset: number; width: number },
  room: RoomConfig,
  depth: number
): { left: number; right: number; top: number; bottom: number } {
  if (opening.wall === 'north') {
    return { left: opening.offset, right: opening.offset + opening.width, top: 0, bottom: depth };
  }

  if (opening.wall === 'south') {
    return { left: opening.offset, right: opening.offset + opening.width, top: room.width - depth, bottom: room.width };
  }

  if (opening.wall === 'west') {
    return { left: 0, right: depth, top: opening.offset, bottom: opening.offset + opening.width };
  }

  return { left: room.length - depth, right: room.length, top: opening.offset, bottom: opening.offset + opening.width };
}

function overlapsOpeningFootprint(
  product: Product,
  candidate: PlacementCandidate,
  room: RoomConfig,
  opening: { wall: WallName; offset: number; width: number },
  depth: number,
  buffer = 0.05
): boolean {
  const fixture = getFixtureFootprint(product, candidate.x, candidate.y, candidate.rotation);
  const openingBox = getOpeningFootprint(opening, room, depth);

  return (
    fixture.left < openingBox.right + buffer &&
    fixture.right > openingBox.left - buffer &&
    fixture.top < openingBox.bottom + buffer &&
    fixture.bottom > openingBox.top - buffer
  );
}

function wallOpeningDistance(
  wall: WallName,
  x: number,
  y: number,
  opening?: { wall: WallName; offset: number; width: number }
): number {
  if (!opening || opening.wall !== wall) {
    return Number.POSITIVE_INFINITY;
  }

  const offset = getWallOffsetFromPoint(wall, x, y);
  const start = opening.offset;
  const end = opening.offset + opening.width;
  if (offset >= start && offset <= end) {
    return 0;
  }
  return Math.min(Math.abs(offset - start), Math.abs(offset - end));
}

function blocksOpening(
  product: Product,
  candidate: PlacementCandidate,
  room: RoomConfig,
  opening?: { wall: WallName; offset: number; width: number },
  buffer = 0.35
): boolean {
  if (!opening || candidate.wall !== opening.wall) {
    return false;
  }

  const productSpan = (candidate.wall === 'north' || candidate.wall === 'south')
    ? product.width
    : product.width;
  const centerOffset = getWallOffsetFromPoint(candidate.wall, candidate.x, candidate.y);
  const fixtureStart = centerOffset - productSpan / 2 - buffer;
  const fixtureEnd = centerOffset + productSpan / 2 + buffer;
  const openingStart = opening.offset;
  const openingEnd = opening.offset + opening.width;

  return fixtureStart < openingEnd && fixtureEnd > openingStart;
}

function frontClearance(candidate: PlacementCandidate, product: Product, room: RoomConfig): number {
  switch (candidate.rotation) {
    case 0:
      return room.width - (candidate.y + product.depth / 2);
    case 180:
      return candidate.y - product.depth / 2;
    case 90:
      return candidate.x - product.depth / 2;
    case 270:
      return room.length - (candidate.x + product.depth / 2);
    default:
      return Math.min(room.length, room.width) / 2;
  }
}

function getPlumbingType(product: Product): 'water_inlet' | 'waste_drain' | 'shower_drain' | null {
  switch (product.category) {
    case 'smart_toilet':
    case 'toilet':
      return 'waste_drain';
    case 'shower':
    case 'bathtub':
      return 'shower_drain';
    case 'vanity':
    case 'faucet':
      return 'water_inlet';
    default:
      return null;
  }
}

function nearestPlumbingDistance(product: Product, candidate: PlacementCandidate, room: RoomConfig): number | null {
  const type = getPlumbingType(product);
  if (!type || !room.plumbingPoints?.length) {
    return null;
  }

  const matching = room.plumbingPoints.filter((point) => point.type === type);
  const points = matching.length > 0 ? matching : room.plumbingPoints;
  return Math.min(...points.map((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y)));
}

function categoryName(product: Product): string {
  if (product.category === 'smart_toilet') {
    return 'toilet';
  }
  return product.category.replace('_', ' ');
}

function archetypeWallBonus(
  product: Product,
  wall: PlacementWall,
  room: RoomConfig,
  archetype: LayoutArchetype
): number {
  if (wall === 'none') {
    return archetype === 'wet_room_suite' && product.category === 'bathtub' ? 20 : 0;
  }

  const doorWall = room.door.wall;
  const focalWall = getOppositeWall(doorWall);
  const isWetFixture = product.category === 'shower' || product.category === 'bathtub';
  const isGrooming = product.category === 'vanity';
  const isToilet = product.category === 'toilet' || product.category === 'smart_toilet';

  if (archetype === 'symmetrical_focal' && isGrooming && wall === focalWall) return 26;
  if (archetype === 'split_parallel' && wall !== doorWall) return isWetFixture ? 18 : 14;
  if (archetype === 'l_shaped' && wall !== doorWall && wall !== focalWall) return 18;
  if (archetype === 'wet_room_suite' && isWetFixture && wall === focalWall) return 24;
  if (isToilet && wall !== doorWall) return 10;

  return wall === focalWall ? 8 : 0;
}

function scoreCandidate(
  product: Product,
  candidate: PlacementCandidate,
  placed: PlacedProduct[],
  room: RoomConfig,
  style: DesignStyle,
  archetype: LayoutArchetype
): PlacementCandidate | null {
  if (!isWithinRoom(product, candidate, room)) {
    return null;
  }

  const doorOpening = {
    wall: room.door.wall,
    offset: room.door.offset ?? (getWallSpan(room.door.wall, room) / 2 - (room.door.width ?? 2.5) / 2),
    width: room.door.width ?? 2.5
  };

  if (
    blocksOpening(product, candidate, room, doorOpening, 0.55) ||
    overlapsOpeningFootprint(product, candidate, room, doorOpening, room.door.width ?? 2.5)
  ) {
    return null;
  }

  if (
    room.window &&
    (
      blocksOpening(product, candidate, room, room.window, 0.25) ||
      overlapsOpeningFootprint(product, candidate, room, room.window, 0.9)
    )
  ) {
    return null;
  }

  if (isPointInDoorSwing(candidate.x, candidate.y, Math.max(product.width, product.depth) / 2, room)) {
    return null;
  }

  const candidateBox = {
    x: candidate.x,
    y: candidate.y,
    width: product.width,
    depth: product.depth,
    rotation: candidate.rotation
  };

  const overlap = placed.find((existing) => {
    if (existing.mountType === 'wall' || existing.mountType === 'countertop') {
      return false;
    }

    return doBoxesOverlap(candidateBox, {
      x: existing.x,
      y: existing.y,
      width: existing.width,
      depth: existing.depth,
      rotation: existing.rotation
    }, 0.35);
  });

  if (overlap) {
    return null;
  }

  const clear = Math.max(0, frontClearance(candidate, product, room));
  const requiredClearance = product.clearance?.front ?? 2.5;
  if (clear < Math.min(requiredClearance, 2.1)) {
    return null;
  }

  const plumbingDistance = nearestPlumbingDistance(product, candidate, room);
  const styleBonus = product.styles.includes(style) ? 15 : 6;
  const plumbingBonus = plumbingDistance === null ? 12 : Math.max(-22, 34 - plumbingDistance * 9);
  const clearanceBonus = Math.min(24, clear * 5);
  const openingPenalty = candidate.wall === 'none'
    ? 0
    : Math.max(0, 10 - wallOpeningDistance(candidate.wall, candidate.x, candidate.y, room.window) * 4);
  const doorWallPenalty = candidate.wall === room.door.wall ? 18 : 0;
  const centerFlowPenalty = product.category !== 'bathtub'
    ? Math.max(0, 8 - Math.abs(candidate.x - room.length / 2) - Math.abs(candidate.y - room.width / 2))
    : 0;

  const score = Math.round(
    62 +
    styleBonus +
    plumbingBonus +
    clearanceBonus +
    archetypeWallBonus(product, candidate.wall, room, archetype) -
    openingPenalty -
    doorWallPenalty -
    centerFlowPenalty
  );

  const plumbingReason = plumbingDistance === null
    ? 'balanced without explicit plumbing input'
    : `within ${plumbingDistance.toFixed(1)} ft of matching plumbing`;

  return {
    ...candidate,
    score,
    frontClearance: clear,
    plumbingDistance: plumbingDistance ?? undefined,
    reason: `${categoryName(product)} generated on ${candidate.wall} from room constraints, ${plumbingReason}, with ${clear.toFixed(1)} ft front clearance`
  };
}

function generateWallCandidates(
  product: Product,
  room: RoomConfig,
  placed: PlacedProduct[],
  style: DesignStyle,
  archetype: LayoutArchetype
): PlacementCandidate[] {
  const walls: WallName[] = ['north', 'south', 'west', 'east'];
  const candidates: PlacementCandidate[] = [];
  const step = 0.5;

  for (const wall of walls) {
    const span = getWallSpan(wall, room);
    const halfSpan = product.width / 2;
    const start = halfSpan + 0.2;
    const end = span - halfSpan - 0.2;

    if (end < start) {
      continue;
    }

    for (let offset = start; offset <= end + 0.001; offset += step) {
      const point = getCoordinatesOnWall(wall, Number(offset.toFixed(2)), product, room);
      const scored = scoreCandidate(product, {
        ...point,
        wall,
        score: 0,
        reason: '',
        frontClearance: 0
      }, placed, room, style, archetype);

      if (scored) {
        candidates.push(scored);
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function generateFreestandingCandidates(
  product: Product,
  room: RoomConfig,
  placed: PlacedProduct[],
  style: DesignStyle,
  archetype: LayoutArchetype
): PlacementCandidate[] {
  const candidates: PlacementCandidate[] = [];
  const rotations = room.length >= room.width ? [0, 180, 90, 270] : [90, 270, 0, 180];
  const step = 0.75;

  for (const rotation of rotations) {
    const box = getFixtureFootprint(product, room.length / 2, room.width / 2, rotation);
    const minX = box.width / 2 + 0.25;
    const maxX = room.length - box.width / 2 - 0.25;
    const minY = box.depth / 2 + 0.25;
    const maxY = room.width - box.depth / 2 - 0.25;

    if (maxX < minX || maxY < minY) {
      continue;
    }

    for (let x = minX; x <= maxX + 0.001; x += step) {
      for (let y = minY; y <= maxY + 0.001; y += step) {
        const scored = scoreCandidate(product, {
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
          rotation,
          wall: 'none',
          score: 0,
          reason: '',
          frontClearance: 0
        }, placed, room, style, archetype);

        if (scored) {
          candidates.push(scored);
        }
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function generateCandidates(
  product: Product,
  room: RoomConfig,
  placed: PlacedProduct[],
  style: DesignStyle,
  archetype: LayoutArchetype
): PlacementCandidate[] {
  const wallCandidates = generateWallCandidates(product, room, placed, style, archetype);

  if (product.category === 'bathtub') {
    return [
      ...generateFreestandingCandidates(product, room, placed, style, archetype),
      ...wallCandidates
    ].sort((a, b) => b.score - a.score);
  }

  return wallCandidates;
}

function placeProduct(
  product: Product,
  candidate: PlacementCandidate,
  room: RoomConfig,
  style: DesignStyle,
  instancePrefix: string,
  reasonPrefix?: string
): PlacedProduct {
  return {
    ...product,
    instanceId: `inst-${instancePrefix}-${product.id}`,
    mountType: product.mountType ?? (product.category === 'mirror' || product.category === 'accessory' ? 'wall' : 'floor'),
    x: candidate.x,
    y: candidate.y,
    rotation: candidate.rotation,
    wallAttached: candidate.wall,
    score: Math.max(70, Math.min(99, candidate.score)),
    reason: reasonPrefix ? `${reasonPrefix} ${candidate.reason}.` : `${candidate.reason}.`,
    explainability: buildProductExplainability(product, style, candidate.frontClearance)
  };
}

/**
 * Intelligent Architectural Layout Generator:
 * Strictly respects room dimensions, actual door wall & offset, window openings,
 * spatial clearance standards, and chosen archetype.
 */
export function generateArchitecturalLayout(
  room: RoomConfig,
  fixtures: LayoutFixtures,
  style: DesignStyle,
  archetype: LayoutArchetype = 'symmetrical_focal'
): PlacedProduct[] {
  const area = room.length * room.width;
  const effectiveArchetype: LayoutArchetype = area < 42 ? 'l_shaped' : archetype;
  const basePlan: FixturePlanItem[] = [
    { key: 'bathtub', product: fixtures.bathtub, required: false },
    { key: 'shower', product: area >= 28 ? fixtures.shower : undefined, required: false },
    { key: 'vanity', product: fixtures.vanity, required: true },
    { key: 'toilet', product: fixtures.toilet, required: true },
    { key: 'accessory', product: fixtures.accessory, required: false }
  ];

  const orderSets: FixturePlanItem[][] = [
    basePlan,
    ['vanity', 'toilet', 'shower', 'bathtub', 'accessory'].map((key) => basePlan.find((item) => item.key === key)!),
    ['shower', 'vanity', 'toilet', 'bathtub', 'accessory'].map((key) => basePlan.find((item) => item.key === key)!),
    ['toilet', 'vanity', 'shower', 'bathtub', 'accessory'].map((key) => basePlan.find((item) => item.key === key)!)
  ];

  let bestPlaced: PlacedProduct[] = [];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const order of orderSets) {
    const placed: PlacedProduct[] = [];
    let failedRequired = false;

    for (const item of order) {
      if (!item.product) {
        continue;
      }

      const candidates = generateCandidates(item.product, room, placed, style, effectiveArchetype);
      const best = candidates[0];

      if (!best) {
        if (item.required) {
          failedRequired = true;
          break;
        }
        continue;
      }

      const prefix = item.key === 'bathtub'
        ? 'tub'
        : item.key === 'shower'
          ? 'shw'
          : item.key === 'vanity'
            ? 'van'
            : item.key === 'toilet'
              ? 'toi'
              : 'acc';
      const placedProduct = placeProduct(
        item.product,
        best,
        room,
        style,
        prefix,
        `${effectiveArchetype.replace('_', ' ').toUpperCase()} solver:`
      );
      placed.push(placedProduct);
    }

    if (failedRequired) {
      continue;
    }

    const hasRequired = placed.some((product) => product.category === 'vanity') &&
      placed.some((product) => product.category === 'toilet' || product.category === 'smart_toilet');
    const layoutScore = placed.reduce((sum, product) => sum + product.score, 0) +
      (hasRequired ? 80 : -120) +
      placed.length * 8;

    if (layoutScore > bestScore) {
      bestScore = layoutScore;
      bestPlaced = placed;
    }
  }

  if (bestPlaced.length === 0) {
    const fallbackWall = getOppositeWall(room.door.wall);
    const vanityFallback = {
      ...getCoordinatesOnWall(fallbackWall, getWallSpan(fallbackWall, room) / 2, fixtures.vanity, room),
      wall: fallbackWall,
      score: 72,
      reason: 'fallback vanity placement after strict solver found no complete layout',
      frontClearance: 2.4
    };
    const toiletWall: WallName = fallbackWall === 'north' || fallbackWall === 'south' ? 'east' : 'south';
    const toiletFallback = {
      ...getCoordinatesOnWall(toiletWall, getWallSpan(toiletWall, room) / 2, fixtures.toilet, room),
      wall: toiletWall,
      score: 70,
      reason: 'fallback toilet placement after strict solver found no complete layout',
      frontClearance: 2.2
    };

    bestPlaced = [
      placeProduct(fixtures.vanity, vanityFallback, room, style, 'van'),
      placeProduct(fixtures.toilet, toiletFallback, room, style, 'toi')
    ];
  }

  const vanity = bestPlaced.find((product) => product.category === 'vanity');
  if (vanity && fixtures.faucet) {
    bestPlaced.push({
      ...fixtures.faucet,
      instanceId: `inst-fct-${fixtures.faucet.id}`,
      mountType: 'countertop',
      x: vanity.x,
      y: vanity.y,
      rotation: vanity.rotation,
      wallAttached: vanity.wallAttached,
      score: Math.min(99, vanity.score + 1),
      reason: `Mounted to ${vanity.name} at the generated vanity location.`,
      explainability: buildProductExplainability(fixtures.faucet, style, vanity.explainability?.spaceScore ? 2.8 : 2.4)
    });
  }

  if (vanity && fixtures.mirror) {
    bestPlaced.push({
      ...fixtures.mirror,
      instanceId: `inst-mir-${fixtures.mirror.id}`,
      mountType: 'wall',
      x: vanity.x,
      y: vanity.y,
      rotation: vanity.rotation,
      wallAttached: vanity.wallAttached,
      score: Math.min(99, vanity.score + 1),
      reason: `Aligned above ${vanity.name} so the 2D and 3D views share the same generated vanity wall.`,
      explainability: buildProductExplainability(fixtures.mirror, style, 2.8)
    });
  }

  return bestPlaced;
}
