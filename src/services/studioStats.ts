import { PlacedProduct, RecommendationBundle, RoomConfig } from '../types';

export function buildStudioStats(
  bundle: RecommendationBundle,
  products: PlacedProduct[],
  room: RoomConfig,
  budget: number
) {
  const totalCost = products.reduce((sum, product) => sum + product.price, 0);
  const score = bundle.designScore?.overallScore;
  const savedLiters = bundle.waterSavings?.annualSavedLiters;
  const spaceCheck = bundle.feasibility?.spaceCheck;

  return [
    {
      label: 'AI Score',
      value: score === undefined ? '—' : `${score}/100`,
      note: 'Space, budget, style, water'
    },
    {
      label: 'Water Saved',
      value: savedLiters === undefined ? '—' : `${(savedLiters / 1000).toFixed(1)}k L`,
      note: 'Annual estimate from selected fixtures'
    },
    {
      label: 'Investment',
      value: `₹${totalCost.toLocaleString('en-IN')}`,
      note: budget > 0 ? `${Math.round((totalCost / budget) * 100)}% of budget` : `${room.length}×${room.width} ft room`
    },
    {
      label: 'Clearance',
      value: spaceCheck ?? '—',
      note: spaceCheck === 'PASS' ? 'Estimated clearances pass' : 'Needs review'
    }
  ];
}
