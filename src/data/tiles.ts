import { TileFinish } from '../models/Tile';

export const TILES_CATALOG: TileFinish[] = [
  // 1. MARBLE
  {
    id: 'marble_carrara',
    name: 'Italian Carrara White Marble',
    type: 'marble',
    category: 'both',
    ratePerSqFt: 380,
    color: '#f8fafc',
    description: 'Polished Italian Carrara with soft grey feather veining and cool crystalline depth.',
    roughness: 0.15,
    metalness: 0.05,
    tileSizeInches: { width: 24, height: 48 },
    origin: 'Carrara, Italy'
  },
  {
    id: 'marble_calacatta_gold',
    name: 'Calacatta Gold Royal Marble',
    type: 'marble',
    category: 'both',
    ratePerSqFt: 460,
    color: '#fefce8',
    description: 'Warm cream base with bold golden-amber veining for grand master suites.',
    roughness: 0.12,
    metalness: 0.08,
    tileSizeInches: { width: 32, height: 64 },
    origin: 'Tuscany, Italy'
  },

  // 2. GRANITE
  {
    id: 'granite_black_galaxy',
    name: 'Black Galaxy Mirror Granite',
    type: 'granite',
    category: 'floor',
    ratePerSqFt: 290,
    color: '#0f172a',
    description: 'Deep obsidian black stone embedded with golden-copper bronzite crystal flakes.',
    roughness: 0.18,
    metalness: 0.25,
    tileSizeInches: { width: 24, height: 24 },
    origin: 'Andhra Pradesh, India'
  },
  {
    id: 'granite_kashmir_white',
    name: 'Kashmir White Granite',
    type: 'granite',
    category: 'both',
    ratePerSqFt: 240,
    color: '#e2e8f0',
    description: 'Light grey crystalline granite patterned with subtle garnet flecks.',
    roughness: 0.22,
    metalness: 0.05,
    tileSizeInches: { width: 24, height: 24 },
    origin: 'Tamil Nadu, India'
  },

  // 3. CERAMIC
  {
    id: 'ceramic_artisan_glazed',
    name: 'Artisan Glazed Pearl Ceramic',
    type: 'ceramic',
    category: 'wall',
    ratePerSqFt: 140,
    color: '#f1f5f9',
    description: 'Hand-pressed ondulato surface reflecting ambient light softly.',
    roughness: 0.25,
    metalness: 0.02,
    tileSizeInches: { width: 12, height: 24 },
    origin: 'Castellón, Spain'
  },
  {
    id: 'ceramic_terracotta',
    name: 'Warm Terracotta Sun-Baked Tile',
    type: 'ceramic',
    category: 'both',
    ratePerSqFt: 165,
    color: '#c2410c',
    description: 'Rustic Mediterranean terracotta bringing organic warmth to dry zones.',
    roughness: 0.65,
    metalness: 0.0,
    tileSizeInches: { width: 12, height: 12 },
    origin: 'Impruneta, Italy'
  },

  // 4. WOODEN
  {
    id: 'wooden_hinoki',
    name: 'Japanese Hinoki Cypress Plank',
    type: 'wooden',
    category: 'both',
    ratePerSqFt: 320,
    color: '#d97706',
    description: 'Aromatic waterproof Japanese Hinoki wood creating a serene Onsen sanctuary atmosphere.',
    roughness: 0.45,
    metalness: 0.0,
    tileSizeInches: { width: 8, height: 48 },
    origin: 'Kiso Valley, Japan'
  },
  {
    id: 'wooden_smoked_walnut',
    name: 'Smoked Nordic Walnut Porcelain',
    type: 'wooden',
    category: 'floor',
    ratePerSqFt: 260,
    color: '#451a03',
    description: 'Rich dark espresso grain pattern combining natural timber aesthetics with porcelain durability.',
    roughness: 0.5,
    metalness: 0.02,
    tileSizeInches: { width: 8, height: 48 },
    origin: 'Bologna, Italy'
  },

  // 5. MATTE
  {
    id: 'matte_graphite_slate',
    name: 'Nordic Graphite Matte Slab',
    type: 'matte',
    category: 'both',
    ratePerSqFt: 210,
    color: '#334155',
    description: 'Non-reflective deep charcoal slate offering anti-slip tactile comfort in wet areas.',
    roughness: 0.75,
    metalness: 0.05,
    tileSizeInches: { width: 24, height: 48 },
    origin: 'Sweden'
  },
  {
    id: 'matte_sand_beige',
    name: 'Velvet Dune Sand Matte',
    type: 'matte',
    category: 'both',
    ratePerSqFt: 185,
    color: '#e7e5e4',
    description: 'Micro-textured creamy sand matte finish that resists water spots and fingerprint residue.',
    roughness: 0.7,
    metalness: 0.0,
    tileSizeInches: { width: 24, height: 24 },
    origin: 'Portugal'
  },

  // 6. GLOSSY
  {
    id: 'glossy_pure_porcelain',
    name: 'Mirror White Glazed Porcelain',
    type: 'glossy',
    category: 'wall',
    ratePerSqFt: 190,
    color: '#ffffff',
    description: 'High-reflectance pure white gloss amplifying illumination in compact powder rooms.',
    roughness: 0.05,
    metalness: 0.1,
    tileSizeInches: { width: 12, height: 36 },
    origin: 'Modena, Italy'
  },

  // 7. STONE
  {
    id: 'stone_himalayan_sandstone',
    name: 'Himalayan Chiseled Sandstone',
    type: 'stone',
    category: 'wall',
    ratePerSqFt: 275,
    color: '#d6d3d1',
    description: 'Natural split-face sandstone with organic mineral banding and architectural shadow lines.',
    roughness: 0.85,
    metalness: 0.0,
    tileSizeInches: { width: 12, height: 24 },
    origin: 'Rajasthan, India'
  },
  {
    id: 'stone_roman_travertine',
    name: 'Navona Roman Vein-Cut Travertine',
    type: 'stone',
    category: 'both',
    ratePerSqFt: 395,
    color: '#f5f5f4',
    description: 'Porous linear limestone filled and honed to silky architectural elegance.',
    roughness: 0.35,
    metalness: 0.02,
    tileSizeInches: { width: 24, height: 48 },
    origin: 'Tivoli, Italy'
  },

  // 8. MOSAIC
  {
    id: 'mosaic_hexagonal_glass',
    name: 'Aquamarine Hexagonal Glass Mosaic',
    type: 'mosaic',
    category: 'wall',
    ratePerSqFt: 310,
    color: '#38bdf8',
    description: 'Translucent 1-inch hexagonal glass tesserae capturing light inside shower niches.',
    roughness: 0.1,
    metalness: 0.2,
    tileSizeInches: { width: 12, height: 12 },
    origin: 'Murano, Italy'
  },
  {
    id: 'mosaic_marble_herringbone',
    name: 'Carrara Marble Micro-Herringbone',
    type: 'mosaic',
    category: 'both',
    ratePerSqFt: 340,
    color: '#f8fafc',
    description: 'Precision interlocked marble tiles arranged in classic Parisian herringbone motif.',
    roughness: 0.3,
    metalness: 0.05,
    tileSizeInches: { width: 12, height: 12 },
    origin: 'Italy'
  },

  // 9. CONCRETE
  {
    id: 'concrete_industrial_cast',
    name: 'Brutalist Raw Cast Concrete',
    type: 'concrete',
    category: 'both',
    ratePerSqFt: 220,
    color: '#64748b',
    description: 'Architectural cast cement with subtle air-pocket voids and industrial loft character.',
    roughness: 0.8,
    metalness: 0.0,
    tileSizeInches: { width: 36, height: 36 },
    origin: 'Germany'
  },

  // 10. VINTAGE
  {
    id: 'vintage_moroccan_zellige',
    name: 'Emerald Moroccan Handcrafted Zellige',
    type: 'vintage',
    category: 'wall',
    ratePerSqFt: 360,
    color: '#065f46',
    description: 'Handmade enameled clay tiles with unique irregular edges and jewel-toned glaze variations.',
    roughness: 0.28,
    metalness: 0.15,
    tileSizeInches: { width: 4, height: 4 },
    origin: 'Fes, Morocco'
  },

  // 11. DESIGNER
  {
    id: 'designer_terrazzo_venetian',
    name: 'Venetian Multi-Chip Terrazzo Slab',
    type: 'designer',
    category: 'both',
    ratePerSqFt: 350,
    color: '#fafaf9',
    description: 'Hand-poured white aggregate composite studded with jade, amber, and nero marble chips.',
    roughness: 0.2,
    metalness: 0.05,
    tileSizeInches: { width: 30, height: 30 },
    origin: 'Venice, Italy'
  },
  {
    id: 'designer_fluted_3d',
    name: 'Architectural Fluted Ribbon Ceramic',
    type: 'designer',
    category: 'wall',
    ratePerSqFt: 330,
    color: '#e2e8f0',
    description: 'Three-dimensional scalloped vertical ridges creating striking rhythmic accent walls.',
    roughness: 0.4,
    metalness: 0.0,
    tileSizeInches: { width: 12, height: 36 },
    origin: 'Japan'
  }
];

export function getTileById(id: string): TileFinish {
  return TILES_CATALOG.find(t => t.id === id) || TILES_CATALOG[0];
}
