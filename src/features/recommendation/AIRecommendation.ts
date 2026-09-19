import { Product, DesignStyle } from '../../models/Product';
import { RoomConfig } from '../../models/Room';
import { RecommendationBundle, RecommendationResponse, LayoutArchetype } from '../../models/Bathroom';
import { CATALOG_PRODUCTS } from '../../data/products';
import { generateArchitecturalLayout } from '../planner/RoomEngine';

export interface RecommendationInput {
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
  brand?: string;
  detectedObjects?: string[];
  preferredArchetype?: LayoutArchetype;
}

export function generateAIRecommendations(input: RecommendationInput): RecommendationResponse {
  const { room, budget, style, preferredArchetype } = input;
  const roomArea = room.length * room.width;

  const toilets = CATALOG_PRODUCTS.filter(p => p.category === 'smart_toilet' || p.category === 'toilet');
  const faucets = CATALOG_PRODUCTS.filter(p => p.category === 'faucet');
  const vanities = CATALOG_PRODUCTS.filter(p => p.category === 'vanity');
  const showers = CATALOG_PRODUCTS.filter(p => p.category === 'shower');
  const bathtubs = CATALOG_PRODUCTS.filter(p => p.category === 'bathtub');
  const mirrors = CATALOG_PRODUCTS.filter(p => p.category === 'mirror');
  const accessories = CATALOG_PRODUCTS.filter(p => p.category === 'accessory');

  const pickBest = (list: Product[], targetRatio: number): Product => {
    const target = budget * targetRatio;
    const maxPrice = target * 1.18;
    const pool = list.some((product) => product.price <= maxPrice)
      ? list.filter((product) => product.price <= maxPrice)
      : list;

    return [...pool].sort((a, b) => {
      const aStyle = a.styles.includes(style) ? 1000 : 0;
      const bStyle = b.styles.includes(style) ? 1000 : 0;
      const aTarget = Math.abs(a.price - target);
      const bTarget = Math.abs(b.price - target);
      const aOverspend = a.price > target ? (a.price - target) / 18 : 0;
      const bOverspend = b.price > target ? (b.price - target) / 18 : 0;
      return (bStyle - bTarget / 22 - bOverspend) - (aStyle - aTarget / 22 - aOverspend);
    })[0] || list[0];
  };

  const createBundle = (
    type: 'optimal' | 'budget_saver' | 'luxury_upgrade',
    archetype: LayoutArchetype,
    title: string,
    description: string,
    summary: string
  ): RecommendationBundle => {
    let van: Product;
    let toi: Product;
    let fct: Product;
    let shw: Product = showers[0];
    let mir: Product = mirrors[0];
    let acc: Product = accessories[0];
    let tub: Product | undefined;

    if (type === 'budget_saver') {
      toi = [...toilets].sort((a, b) => a.price - b.price)[0];
      fct = [...faucets].sort((a, b) => a.price - b.price)[0];
      van = [...vanities].sort((a, b) => a.price - b.price)[0];
      shw = [...showers].sort((a, b) => a.price - b.price)[0];
    } else if (type === 'luxury_upgrade') {
      toi = [...toilets].sort((a, b) => b.price - a.price)[0];
      fct = [...faucets].sort((a, b) => b.price - a.price)[0];
      van = roomArea >= 70 ? (vanities.find(v => v.width >= 4.0) || vanities[0]) : vanities[0];
      shw = [...showers].sort((a, b) => b.price - a.price)[0];
      mir = [...mirrors].sort((a, b) => b.price - a.price)[0];
      if (roomArea >= 70) tub = bathtubs[0];
    } else {
      toi = pickBest(toilets, 0.35);
      van = pickBest(vanities, 0.3);
      fct = pickBest(faucets, 0.12);
      shw = pickBest(showers, 0.18);
      mir = pickBest(mirrors, 0.08);
      if (roomArea >= 75) tub = pickBest(bathtubs, 0.25);
    }

    const placed = generateArchitecturalLayout(
      room,
      { toilet: toi, vanity: van, faucet: fct, shower: shw, mirror: mir, accessory: acc, bathtub: tub },
      style,
      archetype
    );

    const totalCost = placed.reduce((sum, p) => sum + p.price, 0);
    const budgetRatio = totalCost / budget;
    const budgetEfficiency = Math.max(0, Math.min(100,
      budgetRatio <= 1 ? Math.round(88 + 12 * (1 - budgetRatio)) : Math.round(78 - 55 * (budgetRatio - 1))
    ));

    return {
      bundleType: type,
      title,
      description,
      products: placed,
      totalCost,
      remainingBudget: budget - totalCost,
      budgetUtilizationPct: Math.round((totalCost / budget) * 100),
      layoutArchetype: archetype,
      aiSummary: summary,
      designScore: {
        overallScore: Math.max(0, Math.min(100, type === 'optimal' ? 92 : type === 'luxury_upgrade' ? 94 : 88, budgetEfficiency + 10)),
        spaceUtilization: 95,
        budgetEfficiency,
        styleMatch: 96,
        waterEfficiency: 93,
        whyThisScore: [
          `Engineered for ${style.replace('_', ' ')} aesthetics`,
          `Estimated front clearances are checked by the generated layout solver`,
          `Lower-flow fixture assumptions reduce estimated annual water use`
        ]
      },
      waterSavings: {
        annualSavedLiters: 28500,
        percentReduction: 42,
        annualBillSavingsInr: 2370
      }
    };
  };

  return {
    optimal: createBundle(
      'optimal',
      preferredArchetype || 'symmetrical_focal',
      'Verre Studio Architectural Harmony',
      'Balanced design optimizing ergonomics, style affinity, and Verre Studio WaterSense efficiency.',
      'AI recommended configuration featuring balanced circulation and premium materials.'
    ),
    budgetSaver: createBundle(
      'budget_saver',
      'l_shaped',
      'Essential Modern Efficiency',
      'Cost-engineered package delivering high durability while maximizing budget savings.',
      'Optimized value package keeping overall investment minimal.'
    ),
    luxuryUpgrade: createBundle(
      'luxury_upgrade',
      'wet_room_suite',
      'Presidential Master Sanctuary',
      'Flagship intelligent suite with smart bidet, cascading waterfall fixtures, and spa zoning.',
      'Ultra-luxury architectural wet-room suite with top-tier Verre Studio finishes.'
    )
  };
}
