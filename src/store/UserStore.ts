import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DesignStyle } from '../models/Product';

export type MeasurementUnit = 'm' | 'ft' | 'cm';

export interface UserPreferences {
  preferredStyle: DesignStyle;
  budgetRange: {
    min: number;
    max: number;
  };
  measurementUnit: MeasurementUnit;
  theme: 'light' | 'dark' | 'system';
  showDimensions: boolean;
  snapToGrid: boolean;
  gridSize: number; // in meters (default 0.1m)
}

export interface UserStoreState extends UserPreferences {
  setPreferredStyle: (style: DesignStyle) => void;
  setBudgetRange: (budget: { min: number; max: number }) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setShowDimensions: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredStyle: 'minimalist_modern',
  budgetRange: {
    min: 40000,
    max: 200000
  },
  measurementUnit: 'm',
  theme: 'dark',
  showDimensions: true,
  snapToGrid: true,
  gridSize: 0.1
};

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setPreferredStyle: (preferredStyle) => set({ preferredStyle }),
      setBudgetRange: (budgetRange) => set({ budgetRange }),
      setMeasurementUnit: (measurementUnit) => set({ measurementUnit }),
      setTheme: (theme) => set({ theme }),
      setShowDimensions: (showDimensions) => set({ showDimensions }),
      setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
      setGridSize: (gridSize) => set({ gridSize }),
      resetPreferences: () => set({ ...DEFAULT_PREFERENCES })
    }),
    {
      name: 'ai-bathroom-user-preferences'
    }
  )
);
