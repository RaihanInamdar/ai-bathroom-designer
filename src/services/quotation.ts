import { RecommendationBundle, RoomConfig, SurfaceFinishes, calculateMeasurements } from '../types';
import { getTileById } from '../data/tiles';
import { calculateProjectCost } from '../features/quotation/CostCalculator';

const DEFAULT_FINISHES: SurfaceFinishes = {
  floor: 'wooden_hinoki',
  wall: 'designer_fluted_3d'
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
  const measurements = calculateMeasurements(room);
  const floorFinish = getTileById(finishes.floor);
  const wallFinish = getTileById(finishes.wall);
  const projectCost = calculateProjectCost({
    measurements,
    products: bundle.products,
    floorTile: floorFinish,
    wallTile: wallFinish
  });

  return {
    fixtureSubtotal: projectCost.fixtureSubtotal ?? 0,
    floorArea: measurements.floorArea,
    wallArea: measurements.netWallArea,
    floorMaterialCost: projectCost.floorTilesCost,
    wallMaterialCost: projectCost.wallTilesCost,
    surfaceMaterialCost: projectCost.surfaceMaterialCost ?? projectCost.floorTilesCost + projectCost.wallTilesCost,
    installationCost: projectCost.labourCost,
    plumbingElectricalCost: projectCost.transportCost,
    subtotalBeforeTax: projectCost.subtotalBeforeTax,
    gstAmount: projectCost.gstAmount,
    grandTotal: projectCost.grandTotal ?? projectCost.finalCost,
    floorFinishName: floorFinish.name,
    wallFinishName: wallFinish.name,
    floorRatePerSqFt: floorFinish.ratePerSqFt,
    wallRatePerSqFt: wallFinish.ratePerSqFt
  };
}
