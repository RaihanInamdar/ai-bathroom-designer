import assert from 'node:assert/strict';
import test from 'node:test';
import { PlacedProduct, RecommendationRequest, RoomConfig } from '../../../src/types/index.js';
import { generateRecommendations } from '../recommendationEngine.js';

type WallName = RoomConfig['door']['wall'];

const baseRequest: Omit<RecommendationRequest, 'room'> = {
  budget: 160000,
  style: 'minimalist_modern',
  optimizationPriority: 'balanced',
  layoutArchetype: 'split_parallel'
};

function makeRoom(doorWall: WallName): RoomConfig {
  return {
    length: 9,
    width: 7,
    height: 9,
    door: {
      wall: doorWall,
      offset: 2,
      width: 2.6,
      swing: 'inward'
    },
    window: {
      wall: doorWall === 'north' ? 'south' : 'north',
      offset: 3,
      width: 2.5
    },
    plumbingPoints: [
      { id: 'toilet-drain', type: 'waste_drain', wall: 'north', x: 6.8, y: 1.3 },
      { id: 'vanity-supply', type: 'water_inlet', wall: 'east', x: 8.1, y: 3.6 },
      { id: 'shower-drain', type: 'shower_drain', wall: 'south', x: 7.3, y: 5.6 }
    ]
  };
}

function fixtureBox(product: PlacedProduct) {
  const rotated = product.rotation === 90 || product.rotation === 270;
  const width = rotated ? product.depth : product.width;
  const depth = rotated ? product.width : product.depth;

  return {
    minX: product.x - width / 2,
    maxX: product.x + width / 2,
    minY: product.y - depth / 2,
    maxY: product.y + depth / 2
  };
}

function openingZone(
  wall: WallName,
  offset: number,
  width: number,
  room: RoomConfig,
  depth = 1.2
) {
  if (wall === 'north') return { minX: offset, maxX: offset + width, minY: 0, maxY: depth };
  if (wall === 'south') return { minX: offset, maxX: offset + width, minY: room.width - depth, maxY: room.width };
  if (wall === 'west') return { minX: 0, maxX: depth, minY: offset, maxY: offset + width };
  return { minX: room.length - depth, maxX: room.length, minY: offset, maxY: offset + width };
}

function boxesOverlap(
  a: ReturnType<typeof fixtureBox>,
  b: ReturnType<typeof openingZone>
) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

for (const doorWall of ['north', 'south', 'east', 'west'] as WallName[]) {
  test(`generateRecommendations keeps required fixtures clear when door is on ${doorWall}`, () => {
    const room = makeRoom(doorWall);
    const result = generateRecommendations({ ...baseRequest, room });
    const products = result.optimal.products;
    const doorZone = openingZone(room.door.wall, room.door.offset, room.door.width, room, room.door.width);
    const window = room.window!;
    const windowZone = openingZone(window.wall, window.offset, window.width, room, 0.9);

    assert.equal(result.roomValidation.isValid, true);
    assert.ok(products.some((product) => product.category === 'vanity'));
    assert.ok(products.some((product) => product.category === 'smart_toilet' || product.category === 'toilet'));

    for (const product of products) {
      if (product.mountType === 'wall' || product.mountType === 'countertop') continue;
      assert.equal(
        boxesOverlap(fixtureBox(product), doorZone),
        false,
        `${product.name} overlaps ${doorWall} door exclusion zone`
      );
      assert.equal(
        boxesOverlap(fixtureBox(product), windowZone),
        false,
        `${product.name} overlaps ${window.wall} window exclusion zone`
      );
    }
  });
}
