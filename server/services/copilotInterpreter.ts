import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DesignStyle, RoomConfig, Product } from '../../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 20000;

// Cached products for offline smart local responses
let cachedProducts: Product[] = [];
function getCatalogProducts(): Product[] {
  if (cachedProducts.length > 0) return cachedProducts;
  try {
    const productsPath = path.resolve(__dirname, '../data/products.json');
    if (fs.existsSync(productsPath)) {
      const raw = fs.readFileSync(productsPath, 'utf-8');
      cachedProducts = JSON.parse(raw);
    }
  } catch {
    cachedProducts = [];
  }
  return cachedProducts;
}

export type CopilotActionName =
  | 'set_style'
  | 'set_budget'
  | 'set_room_size'
  | 'toggle_bathtub'
  | 'swap_tile'
  | 'regenerate'
  | 'add_fixture'
  | 'remove_fixture'
  | 'toggle_feature'
  | 'explain'
  | 'unsupported';

export interface CopilotActionResult {
  action: CopilotActionName;
  params: Record<string, unknown>;
  assistantReply: string;
}

export interface CopilotInterpreterRequest {
  message: string;
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
  finishes: {
    floor: string;
    wall: string;
    ceiling?: string;
  };
  bundleSummary?: string;
}

const ALLOWED_ACTIONS: CopilotActionName[] = [
  'set_style',
  'set_budget',
  'set_room_size',
  'toggle_bathtub',
  'swap_tile',
  'regenerate',
  'add_fixture',
  'remove_fixture',
  'toggle_feature',
  'explain',
  'unsupported'
];

const ALLOWED_STYLES: DesignStyle[] = [
  'minimalist_modern',
  'classic_luxury',
  'japanese_zen',
  'contemporary',
  'premium',
  'modern'
];

const TILE_IDS = [
  'marble_carrara',
  'marble_calacatta_gold',
  'granite_black_galaxy',
  'granite_kashmir_white',
  'ceramic_artisan_glazed',
  'ceramic_terracotta',
  'wooden_hinoki',
  'wooden_smoked_walnut',
  'matte_graphite_slate',
  'matte_sand_beige',
  'glossy_pure_porcelain',
  'stone_himalayan_sandstone',
  'stone_roman_travertine',
  'mosaic_hexagonal_glass',
  'mosaic_marble_herringbone',
  'concrete_industrial_cast',
  'vintage_moroccan_zellige',
  'designer_terrazzo_venetian',
  'designer_fluted_3d'
];

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function fallbackResult(reply: string): CopilotActionResult {
  return {
    action: 'unsupported',
    params: {},
    assistantReply: reply
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(request: CopilotInterpreterRequest): string {
  return `You are a bathroom design command interpreter. Return ONLY valid JSON:
{
  "action": "set_style" | "set_budget" | "set_room_size" | "toggle_bathtub" | "swap_tile" | "regenerate" | "add_fixture" | "remove_fixture" | "toggle_feature" | "explain" | "unsupported",
  "params": {},
  "assistantReply": "short natural-language confirmation"
}

Allowed actions and params:
- set_style: { "style": one of ${ALLOWED_STYLES.join(', ')} }. Optional { "floor": tileId, "wall": tileId, "regenerate": boolean }.
- set_budget: { "budget": number, "regenerate": boolean }.
- set_room_size: { "length": number, "width": number, "height": optional number, "includeBathtub": optional boolean, "regenerate": boolean }.
- toggle_bathtub: { "enabled": boolean, "regenerate": boolean }.
- swap_tile: { "surface": "floor" | "wall", "tileId": one of ${TILE_IDS.join(', ')} }.
- add_fixture: { "category": "bathtub" | "vanity" | "shower" | "smart_toilet" | "toilet" | "mirror" | "faucet" | "accessory" }.
- remove_fixture: { "category": "bathtub" | "vanity" | "shower" | "smart_toilet" | "toilet" | "mirror" | "faucet" | "accessory" }.
- toggle_feature: { "feature": "water" | "clearance" | "dimensions" | "ceiling" | "cutaway", "enabled": boolean }.
- regenerate: { "reason": string }.
- explain: { "topic": string }.
- unsupported: {}.

If the user asks for multiple compatible changes, choose the highest-impact action and include extra compatible params when allowed. For example "make this fit a 7 by 5 room and skip the bathtub" should use set_room_size with length 7, width 5, includeBathtub false, regenerate true.

Current state:
room=${JSON.stringify(request.room)}
budget=${request.budget}
style=${request.style}
finishes=${JSON.stringify(request.finishes)}
bundleSummary=${request.bundleSummary || 'none'}

User message: ${request.message}`;
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Number(Math.max(min, Math.min(max, numberValue)).toFixed(2));
}

function validateCopilotAction(raw: any): CopilotActionResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Model returned a non-object response');
  }

  const action = raw.action;
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error(`Unsupported action: ${String(action)}`);
  }

  const params = raw.params && typeof raw.params === 'object' ? raw.params : {};
  const assistantReply = typeof raw.assistantReply === 'string'
    ? raw.assistantReply
    : 'I understood the request, but I need a little more detail before changing the design.';

  if (action === 'set_style') {
    if (!ALLOWED_STYLES.includes(params.style)) throw new Error('Invalid style');
    return {
      action,
      assistantReply,
      params: {
        style: params.style,
        floor: typeof params.floor === 'string' && TILE_IDS.includes(params.floor) ? params.floor : undefined,
        wall: typeof params.wall === 'string' && TILE_IDS.includes(params.wall) ? params.wall : undefined,
        regenerate: params.regenerate !== false
      }
    };
  }

  if (action === 'set_budget') {
    return {
      action,
      assistantReply,
      params: {
        budget: cleanNumber(params.budget, 100000, 30000, 500000),
        regenerate: params.regenerate !== false
      }
    };
  }

  if (action === 'set_room_size') {
    return {
      action,
      assistantReply,
      params: {
        length: cleanNumber(params.length, 8, 5, 18),
        width: cleanNumber(params.width, 6, 4, 14),
        height: params.height === undefined ? undefined : cleanNumber(params.height, 9, 8, 12),
        includeBathtub: typeof params.includeBathtub === 'boolean' ? params.includeBathtub : undefined,
        regenerate: params.regenerate !== false
      }
    };
  }

  if (action === 'toggle_bathtub') {
    return {
      action,
      assistantReply,
      params: {
        enabled: params.enabled === true,
        regenerate: params.regenerate !== false
      }
    };
  }

  if (action === 'swap_tile') {
    if ((params.surface !== 'floor' && params.surface !== 'wall') || !TILE_IDS.includes(params.tileId)) {
      throw new Error('Invalid tile swap params');
    }

    return {
      action,
      assistantReply,
      params: {
        surface: params.surface,
        tileId: params.tileId
      }
    };
  }

  if (action === 'add_fixture') {
    return {
      action,
      assistantReply,
      params: {
        category: typeof params.category === 'string' ? params.category : 'bathtub'
      }
    };
  }

  if (action === 'remove_fixture') {
    return {
      action,
      assistantReply,
      params: {
        category: typeof params.category === 'string' ? params.category : 'bathtub'
      }
    };
  }

  if (action === 'toggle_feature') {
    const validFeatures = ['water', 'clearance', 'dimensions', 'ceiling', 'cutaway'];
    const feature = typeof params.feature === 'string' && validFeatures.includes(params.feature)
      ? params.feature
      : 'water';
    return {
      action,
      assistantReply,
      params: {
        feature,
        enabled: typeof params.enabled === 'boolean' ? params.enabled : undefined
      }
    };
  }

  return {
    action,
    assistantReply,
    params
  };
}

/**
 * Intelligent Free Local NLP & Catalog Knowledge Engine.
 * Runs 100% offline with zero external API dependencies and zero cost.
 */
function interpretWithLocalEngine(request: CopilotInterpreterRequest): CopilotActionResult {
  const msg = request.message.toLowerCase().trim();
  const catalog = getCatalogProducts();

  // 1. REMOVE FIXTURE OPERATIONS
  const isRemove = /\b(remove|delete|take out|eliminate|drop|clear|discard|trash)\b/i.test(msg);
  if (isRemove) {
    if (/\b(toilet|smart toilet|commode|wc|pot)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'toilet' },
        assistantReply: 'Removed the toilet fixture from your layout. Recalibrating plumbing clearances and traffic paths.'
      };
    }
    if (/\b(bathtub|tub|soaker)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'bathtub' },
        assistantReply: 'Removed the bathtub from your bathroom. Expanding walk-in rain shower space.'
      };
    }
    if (/\b(shower|rainhead|showerhead)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'shower' },
        assistantReply: 'Removed the shower fixture from the wet zone.'
      };
    }
    if (/\b(vanity|sink|basin|countertop|cabinet)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'vanity' },
        assistantReply: 'Removed the vanity unit, basin, and countertop mirror from the layout.'
      };
    }
    if (/\b(mirror|led mirror)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'mirror' },
        assistantReply: 'Removed the mirror fixture from the wall.'
      };
    }
    if (/\b(faucet|tap|mixer)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'faucet' },
        assistantReply: 'Removed the basin faucet fixture.'
      };
    }
    if (/\b(accessory|accessories|towel bar|robe hook)\b/i.test(msg)) {
      return {
        action: 'remove_fixture',
        params: { category: 'accessory' },
        assistantReply: 'Removed wall accessory fittings from the bathroom.'
      };
    }
  }

  // 2. FEATURE TOGGLES (ON / OFF / TOGGLE)
  const isToggleWord = /\b(toggle|flip|invert|switch)\b/i.test(msg);
  const hasOn = /\b(turn on|switch on|enable|activate|start|show)\b/i.test(msg) || (msg.endsWith('on') && !msg.includes('onsen'));
  const hasOff = /\b(turn off|switch off|disable|deactivate|stop|hide)\b/i.test(msg) || msg.endsWith('off');

  if (hasOn || hasOff || isToggleWord) {
    const enabled = isToggleWord && !hasOn && !hasOff ? undefined : (hasOn && !hasOff);

    if (/\b(water|running water|stream|fountain|flow)\b/i.test(msg)) {
      return {
        action: 'toggle_feature',
        params: { feature: 'water', enabled },
        assistantReply: enabled
          ? 'Turned ON interactive running water animation for faucets, showers, and soaking tubs.'
          : 'Turned OFF running water animation.'
      };
    }

    if (/\b(clearance|clearances|boundary|spacing zone)\b/i.test(msg)) {
      return {
        action: 'toggle_feature',
        params: { feature: 'clearance', enabled },
        assistantReply: enabled
          ? 'Enabled architectural clearance guide zones.'
          : 'Disabled architectural clearance guide zones.'
      };
    }

    if (/\b(dimension|dimensions|ruler|rulers|measurement|tape)\b/i.test(msg)) {
      return {
        action: 'toggle_feature',
        params: { feature: 'dimensions', enabled },
        assistantReply: enabled
          ? 'Enabled 3D architectural dimension rulers along the walls and floor.'
          : 'Hidden 3D architectural dimension rulers.'
      };
    }

    if (/\b(ceiling|soffit|roof)\b/i.test(msg)) {
      return {
        action: 'toggle_feature',
        params: { feature: 'ceiling', enabled },
        assistantReply: enabled
          ? 'Turned ON the ceiling soffit and fixture illumination.'
          : 'Turned OFF the ceiling soffit for open-top architectural inspection.'
      };
    }

    if (/\b(cutaway|cut-away|front wall|open wall)\b/i.test(msg)) {
      return {
        action: 'toggle_feature',
        params: { feature: 'cutaway', enabled },
        assistantReply: enabled
          ? 'Switched to cutaway view (front walls opened for interior inspection).'
          : 'Switched to fully enclosed architectural room view.'
      };
    }
  }

  // 3. ADD FIXTURE OPERATIONS
  const isAdd = /\b(add|insert|install|place|put|include|with)\b/i.test(msg) && !isRemove;
  if (isAdd) {
    if (/\b(bathtub|tub|soaker)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'bathtub' },
        assistantReply: 'Added a luxury Verre Studio freestanding soaking bathtub to the spatial layout. Aligning with wet zone plumbing.'
      };
    }
    if (/\b(smart toilet|veil|numi|innate)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'smart_toilet' },
        assistantReply: 'Added a Verre Studio Intelligent Smart Toilet with bidet and heated seat along the primary soil stack wall.'
      };
    }
    if (/\b(toilet|commode|wc|closet)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'toilet' },
        assistantReply: 'Added an ergonomic Verre Studio water-saving toilet to the layout.'
      };
    }
    if (/\b(vanity|basin|sink|countertop|cabinet)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'vanity' },
        assistantReply: 'Added a designer Verre Studio vanity unit with integrated vessel basin.'
      };
    }
    if (/\b(shower|rainhead|showerhead)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'shower' },
        assistantReply: 'Added a Verre Studio thermostatic rainfall shower system with body sprays.'
      };
    }
    if (/\b(mirror|led mirror)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'mirror' },
        assistantReply: 'Added a Verre Studio backlit LED vanity mirror above the basin.'
      };
    }
    if (/\b(faucet|tap|mixer)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'faucet' },
        assistantReply: 'Added a Verre Studio brassware basin mixer faucet.'
      };
    }
    if (/\b(accessory|accessories|towel bar|robe hook)\b/i.test(msg)) {
      return {
        action: 'add_fixture',
        params: { category: 'accessory' },
        assistantReply: 'Added Verre Studio polished chrome bathroom accessory fittings.'
      };
    }
  }

  // 4. PRODUCT SUGGESTIONS (Toilets, Smart Toilets, Faucets, Vanities, Bathtubs, Showers, Mirrors)
  const isToiletQuery = /\b(toilet|toilets|smart toilet|commode|wc|bidet|closet|pot)\b/i.test(msg);
  const isFaucetQuery = /\b(faucet|faucets|tap|taps|mixer|spout)\b/i.test(msg);
  const isBathtubQuery = !/\b(remove|delete|without|no)\b/i.test(msg) && /\b(bathtub|bathtubs|tub|tubs|soaking tub|whirlpool)\b/i.test(msg) && /\b(suggest|recommend|show|best|list|options|which)\b/i.test(msg);
  const isVanityQuery = /\b(vanity|vanities|sink|basin|countertop|cabinet)\b/i.test(msg);
  const isShowerQuery = /\b(shower|showers|rainhead|showerhead|handshower)\b/i.test(msg);
  const isMirrorQuery = /\b(mirror|mirrors|cabinet mirror|led mirror)\b/i.test(msg);

  if (isToiletQuery || isFaucetQuery || isBathtubQuery || isVanityQuery || isShowerQuery || isMirrorQuery) {
    let targetCategory = 'toilet';
    let label = 'Toilets & Smart Bidets';
    if (isToiletQuery) {
      targetCategory = 'toilet';
      label = 'Toilets & Smart Bidets';
    } else if (isFaucetQuery) {
      targetCategory = 'faucet';
      label = 'Basin Faucets & Mixers';
    } else if (isBathtubQuery) {
      targetCategory = 'bathtub';
      label = 'Soaking Bathtubs';
    } else if (isVanityQuery) {
      targetCategory = 'vanity';
      label = 'Vanities & Basin Units';
    } else if (isShowerQuery) {
      targetCategory = 'shower_system';
      label = 'Shower Columns & Rainheads';
    } else if (isMirrorQuery) {
      targetCategory = 'mirror';
      label = 'Smart Mirrors & Cabinets';
    }

    // Filter catalog products
    const matchingProducts = catalog.filter(p => {
      if (targetCategory === 'toilet') {
        return p.category === 'toilet' || p.category === 'smart_toilet';
      }
      return p.category === targetCategory;
    });

    const topSuggestions = (matchingProducts.length > 0 ? matchingProducts : catalog.slice(0, 4)).slice(0, 4);

    const productLines = topSuggestions.map((p, idx) => {
      const priceFormatted = `₹${Number(p.price).toLocaleString('en-IN')}`;
      const highlights = (p.tags || []).slice(0, 3).map(t => `#${t.replace('_', '-')}`).join(' ');
      return `${idx + 1}. **${p.name}** — **${priceFormatted}**\n   • Dimensions: ${p.width}ft(W) × ${p.depth}ft(D) × ${p.height}ft(H)\n   • Material: ${p.material || 'Vitreous China'} | Finish: ${p.finish || 'Gloss White'}\n   • Highlights: ${highlights}\n   • *${p.description || ''}*`;
    }).join('\n\n');

    const reply = `Here are the top-rated Verre Studio **${label}** matching your bathroom spatial profile:\n\n${productLines}\n\n💡 *Tip: You can ask me to adjust theme, budget, room size, or fixtures anytime!*`;

    return {
      action: 'explain',
      params: {
        topic: 'products',
        category: targetCategory,
        suggestedProducts: topSuggestions
      },
      assistantReply: reply
    };
  }

  // 2. DESIGN STYLE CHANGE
  if (/\b(zen|japanese|hinoki|bamboo|onsen)\b/i.test(msg)) {
    return {
      action: 'set_style',
      params: {
        style: 'japanese_zen',
        floor: 'wooden_hinoki',
        wall: 'designer_fluted_3d',
        regenerate: true
      },
      assistantReply: `Transformed aesthetic to **Japanese Zen** with Hinoki natural wood slat floor and fluted 3D feature walls. Regenerating spatial layout...`
    };
  }

  if (/\b(luxury|classic|marble|heritage|victorian|calacatta|carrara|gold)\b/i.test(msg)) {
    return {
      action: 'set_style',
      params: {
        style: 'classic_luxury',
        floor: 'marble_carrara',
        wall: 'marble_calacatta_gold',
        regenerate: true
      },
      assistantReply: `Upgraded design to **Classic Luxury** featuring Carrara & Calacatta Gold bookmatched marble. Updating fixtures...`
    };
  }

  if (/\b(minimal|minimalist|clean|sleek)\b/i.test(msg)) {
    return {
      action: 'set_style',
      params: {
        style: 'minimalist_modern',
        floor: 'designer_terrazzo_venetian',
        wall: 'ceramic_artisan_glazed',
        regenerate: true
      },
      assistantReply: `Applied **Minimalist Modern** theme with Venetian Terrazzo floors and artisan ceramic glaze walls.`
    };
  }

  if (/\b(contemporary|industrial|concrete|slate|graphite)\b/i.test(msg)) {
    return {
      action: 'set_style',
      params: {
        style: 'contemporary',
        floor: 'matte_graphite_slate',
        wall: 'concrete_industrial_cast',
        regenerate: true
      },
      assistantReply: `Applied **Contemporary** urban theme with matte graphite slate flooring and cast industrial concrete surfaces.`
    };
  }

  // 3. BUDGET ADJUSTMENT
  const budgetMatch = msg.match(/(?:budget|cost|price|under|to)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)(?:\s*(k|lakh|l))?/i)
    || msg.match(/([0-9]+(?:,[0-9]+)*)\s*(k|lakh|l)\s*(?:budget)?/i);

  if (budgetMatch) {
    let rawNum = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const unit = (budgetMatch[2] || '').toLowerCase();
    if (unit === 'k') rawNum *= 1000;
    else if (unit === 'lakh' || unit === 'l') rawNum *= 100000;

    if (rawNum >= 25000 && rawNum <= 600000) {
      const budgetVal = Math.round(rawNum);
      return {
        action: 'set_budget',
        params: {
          budget: budgetVal,
          regenerate: true
        },
        assistantReply: `Updated total project budget to **₹${budgetVal.toLocaleString('en-IN')}**. Recalibrating fixture allocation and BOM cost breakdown.`
      };
    }
  }

  // 4. ROOM SIZE RESIZING (e.g., "10x8", "10 by 8", "length 9 width 7")
  const dimMatch = msg.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:x|by|\*|×)\s*([0-9]+(?:\.[0-9]+)?)/i)
    || msg.match(/length\s*([0-9]+(?:\.[0-9]+)?).*width\s*([0-9]+(?:\.[0-9]+)?)/i);

  if (dimMatch) {
    const l = cleanNumber(dimMatch[1], 8, 5, 18);
    const w = cleanNumber(dimMatch[2], 6, 4, 14);
    return {
      action: 'set_room_size',
      params: {
        length: l,
        width: w,
        regenerate: true
      },
      assistantReply: `Resized room footprint to **${l} ft × ${w} ft** (${(l * w).toFixed(1)} sq ft). Re-verifying architectural clearances and traffic paths.`
    };
  }

  // 5. BATHTUB TOGGLE
  if (/\b(add|put|place|include|with)\b/i.test(msg) && /\b(bathtub|tub|soaker)\b/i.test(msg)) {
    return {
      action: 'toggle_bathtub',
      params: { enabled: true, regenerate: true },
      assistantReply: `Added deep freestanding soaking tub requirement. Adjusting wet zone zoning and plumbing layout.`
    };
  }

  if (/\b(remove|delete|without|drop|no)\b/i.test(msg) && /\b(bathtub|tub)\b/i.test(msg)) {
    return {
      action: 'toggle_bathtub',
      params: { enabled: false, regenerate: true },
      assistantReply: `Removed bathtub preference. Maximizing walk-in rain shower clearance and vanity counter space.`
    };
  }

  // 6. SURFACE FINISHES / TILE SWAP
  const isFloor = /\b(floor|flooring)\b/i.test(msg);
  const isWall = /\b(wall|walls)\b/i.test(msg);
  const matchedTile = TILE_IDS.find(id => {
    const words = id.split('_');
    return words.every(w => msg.includes(w));
  });

  if (matchedTile && (isFloor || isWall)) {
    const surface = isFloor ? 'floor' : 'wall';
    return {
      action: 'swap_tile',
      params: { surface, tileId: matchedTile },
      assistantReply: `Applied **${matchedTile.replace(/_/g, ' ')}** to ${surface} surfaces.`
    };
  }

  // 7. REGENERATE
  if (/\b(regenerate|redraw|new layout|recalculate|fresh design)\b/i.test(msg)) {
    return {
      action: 'regenerate',
      params: { reason: 'User requested regeneration' },
      assistantReply: `Regenerating optimized architectural layout based on your current constraints and Verre Studio design rules.`
    };
  }

  // 8. PLUMBING / SPEC EXPLANATIONS
  if (/\b(clearance|code|plumbing|vent|drain|pipe|rough-in|trap|slope|pressure)\b/i.test(msg)) {
    return {
      action: 'explain',
      params: { topic: 'plumbing' },
      assistantReply: `### Planning Reference Notes\n• Toilet clearance: many residential layouts use at least 21" front clearance and 15" from centerline to nearby obstructions as a minimum planning reference.\n• Basin rough-in: supply stubs are commonly around 21"–24" above finished floor; confirm with the selected fixture spec sheet.\n• Shower wet zone: slope and waterproofing must be checked by a licensed contractor for the site conditions.\n• Venting and drain runs depend on local code and existing stack locations; treat this as design guidance, not a compliance certificate.`
    };
  }

  // 9. GREETINGS & DEFAULT HELP
  if (/\b(hi|hello|hey|help|who are you|what can you do)\b/i.test(msg)) {
    return {
      action: 'explain',
      params: { topic: 'greeting' },
      assistantReply: `👋 Hello! I am your **Verre Studio Spatial Copilot**.\n\nHere is how I can assist you:\n• **Toilets & Fixtures:** Ask *"Suggest toilets"* or *"Recommend smart bidets"*\n• **Change Themes:** *"Switch to Japanese Zen"* or *"Classic Luxury with marble"*\n• **Budget Tuning:** *"Set budget to ₹75,000"* or *"Budget under 1.5 Lakh"*\n• **Room Resizing:** *"Make room 10x8"* or *"Expand room to 12 by 9"*\n• **Bathtubs:** *"Add soaking tub"* or *"Remove bathtub"*\n• **Plumbing Specs:** *"Explain drain slope and clearances"*`
    };
  }

  // Generic fallback with helpful catalog overview
  return {
    action: 'explain',
    params: { topic: 'general' },
    assistantReply: `I understood your inquiry: *"${request.message}"*.\n\nI can help you adjust room dimensions, change design themes (Zen, Modern, Luxury), update budgets, or recommend fixtures like **smart toilets, waterfall faucets, soaking tubs, and vanities**.\n\nTry asking: **"Suggest toilets"** or **"Switch to Japanese Zen"**!`
  };
}

/**
 * Interprets a natural language copilot request.
 * Priority:
 * 1. Google Gemini API (Free tier: gemini-1.5-flash) via @google/generative-ai
 * 2. Anthropic API if configured
 * 3. Intelligent Free Local Catalog & NLP Rule Engine (100% offline, zero config, zero errors)
 */
export async function interpretCopilotRequest(
  request: CopilotInterpreterRequest
): Promise<CopilotActionResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  // 1. Try Google Gemini (Free Generative AI Library)
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const prompt = buildPrompt(request);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (responseText) {
        const parsed = JSON.parse(stripJsonFences(responseText));
        return validateCopilotAction(parsed);
      }
    } catch (geminiError: any) {
      console.warn('Gemini API request failed, using intelligent local engine:', geminiError?.message || geminiError);
    }
  }

  // 2. Try Anthropic if provided
  if (anthropicApiKey) {
    try {
      const response = await fetchWithTimeout(
        ANTHROPIC_MESSAGES_URL,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': ANTHROPIC_VERSION
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
            max_tokens: 700,
            temperature: 0,
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: buildPrompt(request) }]
              }
            ]
          })
        },
        REQUEST_TIMEOUT_MS
      );

      if (response.ok) {
        const payload: any = await response.json();
        const text = payload?.content
          ?.filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
          ?.map((part: any) => part.text)
          ?.join('\n');

        if (text) {
          return validateCopilotAction(JSON.parse(stripJsonFences(text)));
        }
      }
    } catch (anthropicError: any) {
      console.warn('Anthropic API request failed, using intelligent local engine:', anthropicError?.message || anthropicError);
    }
  }

  // 3. Robust Zero-Config Free Local Engine
  // Ensures the chatbot ALWAYS works and never displays configuration errors!
  return interpretWithLocalEngine(request);
}
