import { Product, WaterSavingsReport } from '../types';

const WATER_TARIFF_INR_PER_LITER = 0.02;
const HEATED_WATER_ENERGY_INR_PER_LITER = 0.08;

function pickFixture(
  products: Pick<Product, 'category' | 'flushVolumeLiters' | 'flowRateGpm'>[],
  categories: Product['category'][]
) {
  return products.find((product) => categories.includes(product.category));
}

export function calculateWaterSavings(
  products: Pick<Product, 'category' | 'flushVolumeLiters' | 'flowRateGpm'>[],
  householdMembers = 4
): WaterSavingsReport {
  const people = Math.max(1, householdMembers);
  const toilet = pickFixture(products, ['smart_toilet', 'toilet']);
  const faucet = pickFixture(products, ['faucet']);
  const shower = pickFixture(products, ['shower', 'bathtub']);

  const toiletBaseline = toilet ? people * 4 * 13 * 365 : 0;
  const faucetBaseline = faucet ? people * 12 * 2.2 * 365 : 0;
  const showerBaseline = shower ? people * 15 * 2.5 * 365 : 0;
  const annualBaselineLiters = Math.round(toiletBaseline + faucetBaseline + showerBaseline);

  const toiletDesign = toilet ? people * 4 * (toilet.flushVolumeLiters || 4.2) * 365 : 0;
  const faucetDesign = faucet ? people * 12 * (faucet.flowRateGpm || 1.2) * 365 : 0;
  const showerDesign = shower ? people * 15 * (shower.flowRateGpm || 1.75) * 365 : 0;
  const annualDesignLiters = Math.round(toiletDesign + faucetDesign + showerDesign);

  const toiletSavedLiters = Math.max(0, toiletBaseline - toiletDesign);
  const heatedFixtureSavedLiters = Math.max(0, faucetBaseline - faucetDesign) + Math.max(0, showerBaseline - showerDesign);
  const annualSavedLiters = Math.round(toiletSavedLiters + heatedFixtureSavedLiters);
  const percentReduction = annualBaselineLiters > 0
    ? Math.round((annualSavedLiters / annualBaselineLiters) * 100)
    : 0;
  const annualBillSavingsInr = Math.round(
    toiletSavedLiters * WATER_TARIFF_INR_PER_LITER +
    heatedFixtureSavedLiters * (WATER_TARIFF_INR_PER_LITER + HEATED_WATER_ENERGY_INR_PER_LITER)
  );

  return {
    annualBaselineLiters,
    annualDesignLiters,
    annualSavedLiters,
    percentReduction,
    annualBillSavingsInr,
    tenYearBillSavingsInr: annualBillSavingsInr * 10,
    co2OffsetKg: Math.round(annualSavedLiters * 0.003),
    assumptions: [
      `Assumes a ${people}-person household (4 flushes/person/day, 8 min average shower).`,
      'Baseline uses a 13 L single-flush toilet, 2.2 gpm faucet, and 2.5 gpm shower where those fixtures exist in the bundle.',
      'Design liters use each selected fixture’s flush volume or flow rate when present.',
      `Bill estimate uses ₹${WATER_TARIFF_INR_PER_LITER.toFixed(2)}/L water plus ₹${HEATED_WATER_ENERGY_INR_PER_LITER.toFixed(2)}/L heating energy for faucet and shower savings.`
    ]
  };
}
