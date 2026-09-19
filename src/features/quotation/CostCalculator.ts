import { PlacedProduct } from '../../models/Product';
import { Measurements } from '../../models/Room';
import { TileFinish } from '../../models/Tile';
import { QuotationBreakdown } from '../../models/Bathroom';
import { calculateGST, GST_RATE_PCT } from './GST';

export interface CostCalculationInput {
  measurements: Measurements;
  products: PlacedProduct[];
  floorTile: TileFinish;
  wallTile: TileFinish;
  labourRatePerSqFt?: number;   // default ₹180/sq.ft for floor & wall tiling + plumbing
  transportFlatInr?: number;    // default ₹3500 flat transit & material handling
  customGstRate?: number;       // default 18%
}

export function calculateProjectCost(input: CostCalculationInput): QuotationBreakdown {
  const {
    measurements,
    products,
    floorTile,
    wallTile,
    labourRatePerSqFt = 180,
    transportFlatInr = 3500,
    customGstRate = GST_RATE_PCT
  } = input;

  // 1. Floor Tiles Cost: floorArea * 1.1 (10% cutting wastage) * tile rate
  const floorTilesCost = Math.round(measurements.floorArea * 1.1 * floorTile.ratePerSqFt);

  // 2. Wall Tiles Cost: netWallArea * 1.1 (10% cutting wastage) * tile rate
  const wallTilesCost = Math.round(measurements.netWallArea * 1.1 * wallTile.ratePerSqFt);

  // 3. Sanitary Products: toilet, vanity, faucet, shower, bathtub
  const sanitaryProductsCost = products
    .filter(p => p.category !== 'accessory')
    .reduce((sum, p) => sum + p.price, 0);

  // 4. Accessories: towel warmer, shelves, hooks, mirrors
  const accessoriesCost = products
    .filter(p => p.category === 'accessory')
    .reduce((sum, p) => sum + p.price, 0);

  // 5. Labour: tile laying + sanitary plumbing installation
  const totalSurfaceArea = measurements.floorArea + measurements.netWallArea;
  const labourCost = Math.round(totalSurfaceArea * labourRatePerSqFt + products.length * 1200);

  // 6. Transport & Logistics
  const transportCost = transportFlatInr;

  // 7. Subtotal before tax
  const subtotalBeforeTax = wallTilesCost + floorTilesCost + sanitaryProductsCost + accessoriesCost + labourCost + transportCost;

  // 8. GST (18%)
  const gstResult = calculateGST(subtotalBeforeTax, customGstRate);
  const gstAmount = gstResult.totalGst;

  // 9. Final Cost = Wall + Floor + Sanitary + Accessories + Labour + Transport + GST
  const finalCost = subtotalBeforeTax + gstAmount;

  return {
    wallTilesCost,
    floorTilesCost,
    sanitaryProductsCost,
    accessoriesCost,
    labourCost,
    transportCost,
    subtotalBeforeTax,
    gstRatePct: customGstRate,
    gstAmount,
    finalCost,
    // Aliases for compatibility
    fixtureSubtotal: sanitaryProductsCost + accessoriesCost,
    surfaceMaterialCost: wallTilesCost + floorTilesCost,
    installationCost: labourCost,
    grandTotal: finalCost
  };
}
