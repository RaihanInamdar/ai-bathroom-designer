import { create } from 'zustand';
import {
  Project,
  AIDetectionResult,
  RecommendationResponse,
  RecommendationBundle,
  LayoutArchetype,
  RoomConfig,
  calculateMeasurements,
  PlacedProduct,
  Product,
  DesignStyle,
  SurfaceFinishes
} from '../types';
import { calculateWallSegments } from '../features/planner/WallEngine';
import { calculateProjectCost } from '../features/quotation/CostCalculator';
import { getTileById } from '../data/tiles';
import { PRESET_ROOMS } from '../data/presetRooms';
import { generateArchitecturalLayout, pickLayoutFixtures } from '../services/layoutEngine';
import { CATALOG_PRODUCTS } from '../data/products';
import { calculateWaterSavings } from '../services/waterSavings';

const MAX_HISTORY = 25;

function createInitialProducts(room: RoomConfig, style: DesignStyle, archetype: LayoutArchetype): PlacedProduct[] {
  return generateArchitecturalLayout(
    room,
    pickLayoutFixtures([], CATALOG_PRODUCTS),
    style,
    archetype
  );
}

function withUpdatedBundleTotals(
  bundle: RecommendationBundle,
  products: PlacedProduct[],
  budget: number
): RecommendationBundle {
  const totalCost = products.reduce((sum, product) => sum + product.price, 0);
  return {
    ...bundle,
    products,
    totalCost,
    remainingBudget: budget - totalCost,
    budgetUtilizationPct: budget > 0 ? Math.round((totalCost / budget) * 100) : 0,
    waterSavings: calculateWaterSavings(products)
  };
}

function computeProjectDerivedState(
  base: Omit<Project, 'measurements' | 'walls' | 'floor' | 'ceiling' | 'quotation'>
): Project {
  const measurements = calculateMeasurements(base.room);
  const walls = calculateWallSegments(base.room, base.finishes.wall);
  const floor = {
    finishId: base.finishes.floor,
    area: measurements.floorArea
  };
  const ceiling = {
    finishId: base.finishes.ceiling || 'ceiling_white',
    area: measurements.ceilingArea,
    height: base.room.height
  };

  const floorTile = getTileById(base.finishes.floor);
  const wallTile = getTileById(base.finishes.wall);

  const quotation = calculateProjectCost({
    measurements,
    products: base.products,
    floorTile,
    wallTile
  });

  return {
    ...base,
    measurements,
    walls,
    floor,
    ceiling,
    quotation,
    updatedAt: new Date().toISOString()
  };
}

function createDefaultProject(): Project {
  const defaultRoom: RoomConfig = {
    ...PRESET_ROOMS[0].config,
    name: 'Master Bathroom Suite'
  };

  const defaultFinishes: SurfaceFinishes = {
    floor: 'wooden_hinoki',
    wall: 'designer_fluted_3d'
  };

  const defaultStyle: DesignStyle = 'minimalist_modern';
  const defaultArchetype: LayoutArchetype = 'symmetrical_focal';
  const defaultProducts = createInitialProducts(defaultRoom, defaultStyle, defaultArchetype);

  return computeProjectDerivedState({
    id: `project-${Date.now()}`,
    name: 'My AI Bathroom Design',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    room: defaultRoom,
    products: defaultProducts,
    finishes: defaultFinishes,
    style: defaultStyle,
    budget: 100000,
    activeArchetype: defaultArchetype,
    aiDetection: null,
    recommendations: null
  });
}

export interface ProjectStoreState {
  project: Project;
  past: Project[];
  future: Project[];

  // Mutators
  setRoom: (room: Partial<RoomConfig>) => void;
  setProducts: (products: PlacedProduct[]) => void;
  addProduct: (product: PlacedProduct) => void;
  updateProductPosition: (instanceId: string, x: number, y: number) => void;
  rotateProduct: (instanceId: string, angleDelta?: number) => void;
  removeProduct: (instanceId: string) => void;
  swapProduct: (instanceId: string, newProduct: Product) => void;
  setFinishes: (finishes: SurfaceFinishes) => void;
  setStyle: (style: DesignStyle) => void;
  setBudget: (budget: number) => void;
  setActiveArchetype: (archetype: LayoutArchetype, options?: { rearrange?: boolean }) => void;
  setAIDetection: (aiDetection: AIDetectionResult) => void;
  setRecommendations: (recommendations: RecommendationResponse) => void;
  applyRecommendationBundle: (bundleType: 'optimal' | 'budget_saver' | 'luxury_upgrade') => void;
  patchActiveBundleProducts: (
    bundleType: 'optimal' | 'budget_saver' | 'luxury_upgrade',
    products: PlacedProduct[]
  ) => void;
  applyPresetRoom: (presetId: string) => void;
  recalculateQuotation: () => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetProject: () => void;
  loadProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: createDefaultProject(),
  past: [],
  future: [],

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setRoom: (roomPartial) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const newRoom: RoomConfig = { ...current.room, ...roomPartial };
    const updated = computeProjectDerivedState({
      ...current,
      room: newRoom
    });

    set({ project: updated, past, future: [] });
  },

  setProducts: (products) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const updated = computeProjectDerivedState({
      ...current,
      products
    });

    set({ project: updated, past, future: [] });
  },

  addProduct: (product) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const updated = computeProjectDerivedState({
      ...current,
      products: [...current.products, product]
    });

    set({ project: updated, past, future: [] });
  },

  updateProductPosition: (instanceId, x, y) => {
    const current = get().project;
    const updatedProducts = current.products.map(p => {
      if (p.instanceId === instanceId) {
        return { ...p, x, y };
      }
      return p;
    });

    // Don't push to history on every drag tick; just update product coordinates
    set({
      project: {
        ...current,
        products: updatedProducts,
        updatedAt: new Date().toISOString()
      }
    });
  },

  rotateProduct: (instanceId, angleDelta = 90) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const updatedProducts = current.products.map(p => {
      if (p.instanceId === instanceId) {
        const nextRotation = (p.rotation + angleDelta) % 360;
        return { ...p, rotation: nextRotation };
      }
      return p;
    });

    set({
      project: {
        ...current,
        products: updatedProducts,
        updatedAt: new Date().toISOString()
      },
      past,
      future: []
    });
  },

  removeProduct: (instanceId) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const updatedProducts = current.products.filter(p => p.instanceId !== instanceId);
    const updated = computeProjectDerivedState({
      ...current,
      products: updatedProducts
    });

    set({ project: updated, past, future: [] });
  },

  swapProduct: (instanceId, newProduct) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const updatedProducts = current.products.map(p => {
      if (p.instanceId === instanceId) {
        return {
          ...newProduct,
          instanceId: p.instanceId,
          x: p.x,
          y: p.y,
          rotation: p.rotation,
          wallAttached: p.wallAttached,
          mountType: p.mountType,
          score: Math.min(99, Math.round((p.score || 80) * 0.9 + 10)),
          reason: `Custom selected fixture model.`
        };
      }
      return p;
    });

    const updated = computeProjectDerivedState({
      ...current,
      products: updatedProducts
    });

    set({ project: updated, past, future: [] });
  },

  setFinishes: (finishes) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const updated = computeProjectDerivedState({
      ...current,
      finishes
    });

    set({ project: updated, past, future: [] });
  },

  setStyle: (style) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    set({
      project: { ...current, style, updatedAt: new Date().toISOString() },
      past,
      future: []
    });
  },

  setBudget: (budget) => {
    const current = get().project;
    set({
      project: { ...current, budget, updatedAt: new Date().toISOString() }
    });
  },

  setActiveArchetype: (archetype, options) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];
    const rearrange = options?.rearrange !== false;

    const newPlaced = rearrange
      ? generateArchitecturalLayout(
          current.room,
          pickLayoutFixtures(current.products, CATALOG_PRODUCTS),
          current.style,
          archetype
        )
      : current.products;

    const updated = computeProjectDerivedState({
      ...current,
      activeArchetype: archetype,
      products: newPlaced
    });

    set({ project: updated, past, future: [] });
  },

  setAIDetection: (aiDetection) => {
    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];

    // Optionally update room dimensions if AI estimated them with confidence
    let updatedRoom = { ...current.room };
    if (aiDetection.estimatedDimensions && aiDetection.estimatedDimensions.confidence >= 0.6) {
      updatedRoom.length = Math.max(5, Math.min(25, aiDetection.estimatedDimensions.length));
      updatedRoom.width = Math.max(4, Math.min(20, aiDetection.estimatedDimensions.width));
      updatedRoom.height = Math.max(7, Math.min(14, aiDetection.estimatedDimensions.height));
    }

    if (aiDetection.detectedLayout?.doorWall) {
      updatedRoom.door = {
        ...updatedRoom.door,
        wall: aiDetection.detectedLayout.doorWall
      };
    }

    const updated = computeProjectDerivedState({
      ...current,
      room: updatedRoom,
      aiDetection
    });

    set({ project: updated, past, future: [] });
  },

  setRecommendations: (recommendations) => {
    const current = get().project;
    set({
      project: { ...current, recommendations, updatedAt: new Date().toISOString() }
    });
  },

  applyRecommendationBundle: (bundleType) => {
    const current = get().project;
    if (!current.recommendations) return;

    const bundle = bundleType === 'optimal'
      ? current.recommendations.optimal
      : bundleType === 'budget_saver'
        ? current.recommendations.budgetSaver
        : current.recommendations.luxuryUpgrade;

    if (!bundle) return;

    const past = [...get().past.slice(-MAX_HISTORY), current];
    const nextArchetype = bundle.layoutArchetype || current.activeArchetype;

    const updated = computeProjectDerivedState({
      ...current,
      products: bundle.products,
      activeArchetype: nextArchetype
    });

    set({ project: updated, past, future: [] });
  },

  patchActiveBundleProducts: (bundleType, products) => {
    const current = get().project;
    if (!current.recommendations) {
      get().setProducts(products);
      return;
    }

    const past = [...get().past.slice(-MAX_HISTORY), current];
    const nextRecommendations = { ...current.recommendations };
    if (bundleType === 'optimal') {
      nextRecommendations.optimal = withUpdatedBundleTotals(current.recommendations.optimal, products, current.budget);
    } else if (bundleType === 'budget_saver') {
      nextRecommendations.budgetSaver = withUpdatedBundleTotals(current.recommendations.budgetSaver, products, current.budget);
    } else {
      nextRecommendations.luxuryUpgrade = withUpdatedBundleTotals(current.recommendations.luxuryUpgrade, products, current.budget);
    }

    const updated = computeProjectDerivedState({
      ...current,
      products,
      recommendations: nextRecommendations
    });

    set({ project: updated, past, future: [] });
  },

  applyPresetRoom: (presetId) => {
    const preset = PRESET_ROOMS.find(p => p.id === presetId);
    if (!preset) return;

    const current = get().project;
    const past = [...get().past.slice(-MAX_HISTORY), current];

    const newRoom = { ...preset.config };
    const newProducts = createInitialProducts(newRoom, current.style, current.activeArchetype);

    const updated = computeProjectDerivedState({
      ...current,
      room: newRoom,
      products: newProducts,
      budget: preset.defaultBudget || current.budget
    });

    set({ project: updated, past, future: [] });
  },

  recalculateQuotation: () => {
    const current = get().project;
    const updated = computeProjectDerivedState(current);
    set({ project: updated });
  },

  undo: () => {
    const { past, project, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      project: previous,
      past: newPast,
      future: [project, ...future.slice(0, MAX_HISTORY)]
    });
  },

  redo: () => {
    const { past, project, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      project: next,
      past: [...past.slice(-MAX_HISTORY), project],
      future: newFuture
    });
  },

  resetProject: () => {
    set({
      project: createDefaultProject(),
      past: [],
      future: []
    });
  },

  loadProject: (project) => {
    const updated = computeProjectDerivedState(project);
    set({
      project: updated,
      past: [],
      future: []
    });
  }
}));
