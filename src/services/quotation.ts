import { RecommendationBundle, RoomConfig } from '../types';
import { SurfaceFinishes } from '../components/planner3d/MaterialFactory';
import { FLOOR_FINISHES, WALL_FINISHES } from '../components/finishes/TileStudio';

const DEFAULT_FINISHES: SurfaceFinishes = {
  floor: 'hinoki_wood',
  wall: 'fluted_hinoki'
};

export interface QuotationBreakdown {
  fixtureSubtotal: number;
  floorArea: number;
  wallArea: number;
  floorMaterialCost: number;
  wallMaterialCost: number;
  surfaceMaterialCost: number;
  installationCost: number;
  plumbingElectricalCost: number;
  subtotalBeforeTax: number;
  gstAmount: number;
  grandTotal: number;
  floorFinishName: string;
  wallFinishName: string;
  floorRatePerSqFt: number;
  wallRatePerSqFt: number;
}

export function calculateQuotation(
  bundle: RecommendationBundle,
  room: RoomConfig,
  finishes: SurfaceFinishes = DEFAULT_FINISHES
): QuotationBreakdown {
  const fixtureSubtotal = bundle.products.reduce((sum, product) => sum + product.price, 0);
  const floorArea = Number((room.length * room.width).toFixed(1));
  const grossWallArea = 2 * (room.length + room.width) * room.height;
  const doorArea = (room.door?.width || 2.5) * 7;
  const windowArea = room.window ? room.window.width * 3 : 0;
  const wallArea = Number(Math.max(0, grossWallArea - doorArea - windowArea).toFixed(1));

  const floorFinish = FLOOR_FINISHES.find((finish) => finish.id === finishes.floor) || FLOOR_FINISHES[0];
  const wallFinish = WALL_FINISHES.find((finish) => finish.id === finishes.wall) || WALL_FINISHES[0];

  const floorMaterialCost = Math.round(floorArea * 1.1 * floorFinish.ratePerSqFt);
  const wallMaterialCost = Math.round(wallArea * 1.1 * wallFinish.ratePerSqFt);
  const surfaceMaterialCost = floorMaterialCost + wallMaterialCost;

  const installationCost = Math.round(floorArea * 180 + wallArea * 160);
  const plumbingElectricalCost = Math.round(fixtureSubtotal * 0.12);
  const subtotalBeforeTax = fixtureSubtotal + surfaceMaterialCost + installationCost + plumbingElectricalCost;
  const gstAmount = Math.round(subtotalBeforeTax * 0.18);
  const grandTotal = subtotalBeforeTax + gstAmount;

  return {
    fixtureSubtotal,
    floorArea,
    wallArea,
    floorMaterialCost,
    wallMaterialCost,
    surfaceMaterialCost,
    installationCost,
    plumbingElectricalCost,
    subtotalBeforeTax,
    gstAmount,
    grandTotal,
    floorFinishName: floorFinish.name,
    wallFinishName: wallFinish.name,
    floorRatePerSqFt: floorFinish.ratePerSqFt,
    wallRatePerSqFt: wallFinish.ratePerSqFt
  };
}
