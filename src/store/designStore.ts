import { useProjectStore } from './ProjectStore';
import { LayoutArchetype, PlacedProduct, RoomConfig } from '../types';
import { SurfaceFinishes } from '../components/planner3d/MaterialFactory';

export interface DesignState {
  room: RoomConfig;
  products: PlacedProduct[];
  finishes: SurfaceFinishes;
  layoutArchetype: LayoutArchetype;
  setRoom: (room: RoomConfig) => void;
  setProducts: (products: PlacedProduct[]) => void;
  setFinishes: (finishes: SurfaceFinishes) => void;
  setLayoutArchetype: (layoutArchetype: LayoutArchetype) => void;
}

/**
 * useDesignStore: Backward-compatible adapter directly backed by the unified ProjectStore.
 */
export function useDesignStore<T>(selector: (state: DesignState) => T): T {
  const project = useProjectStore((s) => s.project);
  const setRoom = useProjectStore((s) => s.setRoom);
  const setProducts = useProjectStore((s) => s.setProducts);
  const setFinishes = useProjectStore((s) => s.setFinishes);
  const setActiveArchetype = useProjectStore((s) => s.setActiveArchetype);

  const state: DesignState = {
    room: project.room,
    products: project.products,
    finishes: project.finishes as SurfaceFinishes,
    layoutArchetype: project.activeArchetype,
    setRoom: (r) => setRoom(r),
    setProducts: (p) => setProducts(p),
    setFinishes: (f) => setFinishes(f as any),
    setLayoutArchetype: (a) => setActiveArchetype(a)
  };

  return selector(state);
}
