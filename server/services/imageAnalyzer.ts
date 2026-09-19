import { ImageAnalysisResult, DetectedElement, DesignStyle } from '../../src/types/index.js';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const REQUEST_TIMEOUT_MS = 30000;

type WallName = 'north' | 'south' | 'east' | 'west';

interface PreparedImage {
  base64: string;
  mediaType: string;
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function fallbackAnalysis(reason: string, userGivenWidth?: number): ImageAnalysisResult {
  const width = Number((userGivenWidth || 6).toFixed(1));
  const length = Number((width * 1.25).toFixed(1));

  return {
    detectedElements: [],
    estimatedDimensions: {
      length,
      width,
      height: 9,
      confidence: 0.1,
      notes: `Low confidence: could not analyze uploaded photo. ${reason}`
    },
    detectedLayout: {
      doorWall: 'south',
      windowWall: undefined,
      plumbingLocations: []
    },
    identifiedBottlenecks: [
      `Low confidence: vision analysis unavailable. ${reason}`
    ],
    aiRecommendations: [
      {
        existingIssue: 'Unable to inspect the uploaded bathroom photo reliably.',
        recommendedKohlerFixture: 'Manual review recommended before final fixture selection.',
        spaceOrWaterBenefit: 'No automated spatial or water-saving claim was made.'
      }
    ],
    aestheticAnalysis: {
      primaryColorPalette: ['#f8fafc', '#94a3b8', '#334155'],
      materialTone: 'Unknown - low confidence',
      lightingQuality: 'Unknown - low confidence',
      recommendedStyle: 'minimalist_modern',
      styleMatchConfidence: 0.1
    },
    imageMetrics: {
      dominantBrightness: 0,
      colorTemperature: 'neutral',
      contrastRatio: 0,
      detectedSurfaces: []
    },
    summary: `Low confidence: could not analyze uploaded bathroom photo. ${reason}`
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

function inferMediaTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/i);
  return match?.[1] || 'image/jpeg';
}

async function prepareImage(imageBase64OrUrl: string): Promise<PreparedImage> {
  if (/^https?:\/\//i.test(imageBase64OrUrl)) {
    const response = await fetchWithTimeout(imageBase64OrUrl, {}, REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`Image URL fetch failed with HTTP ${response.status}`);
    }

    const mediaType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    return {
      base64: Buffer.from(arrayBuffer).toString('base64'),
      mediaType
    };
  }

  if (imageBase64OrUrl.startsWith('data:')) {
    return {
      base64: imageBase64OrUrl.split(',')[1] || '',
      mediaType: inferMediaTypeFromDataUrl(imageBase64OrUrl)
    };
  }

  return {
    base64: imageBase64OrUrl,
    mediaType: 'image/jpeg'
  };
}

function isWall(value: unknown): value is WallName {
  return value === 'north' || value === 'south' || value === 'east' || value === 'west';
}

function isDesignStyle(value: unknown): value is DesignStyle {
  return value === 'minimalist_modern' ||
    value === 'classic_luxury' ||
    value === 'japanese_zen' ||
    value === 'contemporary' ||
    value === 'premium' ||
    value === 'modern';
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number): number {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Number(Math.max(min, Math.min(max, next)).toFixed(2));
}

function validateDetectedElements(value: unknown): DetectedElement[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((element) => element && typeof element === 'object')
    .slice(0, 12)
    .map((raw: any, index): DetectedElement | null => {
      const category = raw.category;
      if (!['toilet', 'vanity', 'shower', 'door', 'window', 'tile', 'lighting'].includes(category)) {
        return null;
      }

      const box = raw.boundingBox || {};
      return {
        id: typeof raw.id === 'string' ? raw.id : `detected-${index + 1}`,
        label: typeof raw.label === 'string' ? raw.label : category,
        confidence: cleanNumber(raw.confidence, 0.5, 0, 1),
        category,
        boundingBox: {
          x: cleanNumber(box.x, 0, 0, 100),
          y: cleanNumber(box.y, 0, 0, 100),
          width: cleanNumber(box.width, 10, 1, 100),
          height: cleanNumber(box.height, 10, 1, 100)
        },
        attributes: raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : {}
      };
    })
    .filter((element): element is DetectedElement => Boolean(element));
}

function validateAnalysisShape(raw: any, userGivenWidth?: number): ImageAnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Model returned a non-object response');
  }

  const dimensions = raw.estimatedDimensions;
  const layout = raw.detectedLayout;
  const aesthetics = raw.aestheticAnalysis;

  if (!dimensions || typeof dimensions !== 'object') throw new Error('Missing estimatedDimensions');
  if (!layout || typeof layout !== 'object') throw new Error('Missing detectedLayout');
  if (!aesthetics || typeof aesthetics !== 'object') throw new Error('Missing aestheticAnalysis');

  const width = cleanNumber(dimensions.width, userGivenWidth || 6, 3, 20);
  const length = cleanNumber(dimensions.length, Math.max(width, width * 1.25), 4, 30);
  const doorWall = isWall(layout.doorWall) ? layout.doorWall : 'south';
  const windowWall = isWall(layout.windowWall) ? layout.windowWall : undefined;
  const recommendedStyle = isDesignStyle(aesthetics.recommendedStyle)
    ? aesthetics.recommendedStyle
    : 'minimalist_modern';

  return {
    detectedElements: validateDetectedElements(raw.detectedElements),
    estimatedDimensions: {
      length,
      width,
      height: cleanNumber(dimensions.height, 9, 7, 14),
      confidence: cleanNumber(dimensions.confidence, 0.5, 0, 1),
      notes: typeof dimensions.notes === 'string' ? dimensions.notes : 'Estimated from uploaded photo.'
    },
    detectedLayout: {
      doorWall,
      windowWall,
      plumbingLocations: Array.isArray(layout.plumbingLocations)
        ? layout.plumbingLocations.filter((item: unknown) => typeof item === 'string').slice(0, 8)
        : []
    },
    identifiedBottlenecks: Array.isArray(raw.identifiedBottlenecks)
      ? raw.identifiedBottlenecks.filter((item: unknown) => typeof item === 'string').slice(0, 8)
      : [],
    aiRecommendations: Array.isArray(raw.aiRecommendations)
      ? raw.aiRecommendations
          .filter((item: unknown) => item && typeof item === 'object')
          .slice(0, 6)
          .map((item: any) => ({
            existingIssue: typeof item.existingIssue === 'string' ? item.existingIssue : 'Observed bathroom issue',
            recommendedKohlerFixture: typeof item.recommendedKohlerFixture === 'string' ? item.recommendedKohlerFixture : 'Kohler fixture recommendation',
            spaceOrWaterBenefit: typeof item.spaceOrWaterBenefit === 'string' ? item.spaceOrWaterBenefit : 'Improves space planning or water efficiency.'
          }))
      : [],
    aestheticAnalysis: {
      primaryColorPalette: Array.isArray(aesthetics.primaryColorPalette)
        ? aesthetics.primaryColorPalette.filter((item: unknown) => typeof item === 'string').slice(0, 6)
        : ['#f8fafc', '#94a3b8', '#334155'],
      materialTone: typeof aesthetics.materialTone === 'string' ? aesthetics.materialTone : 'Unknown material tone',
      lightingQuality: typeof aesthetics.lightingQuality === 'string' ? aesthetics.lightingQuality : 'Unknown lighting',
      recommendedStyle,
      styleMatchConfidence: cleanNumber(aesthetics.styleMatchConfidence, 0.5, 0, 1)
    },
    imageMetrics: raw.imageMetrics && typeof raw.imageMetrics === 'object'
      ? {
          dominantBrightness: cleanNumber(raw.imageMetrics.dominantBrightness, 128, 0, 255),
          colorTemperature: ['warm', 'neutral', 'cool'].includes(raw.imageMetrics.colorTemperature)
            ? raw.imageMetrics.colorTemperature
            : 'neutral',
          contrastRatio: cleanNumber(raw.imageMetrics.contrastRatio, 1, 0, 10),
          detectedSurfaces: Array.isArray(raw.imageMetrics.detectedSurfaces)
            ? raw.imageMetrics.detectedSurfaces.filter((item: unknown) => typeof item === 'string').slice(0, 8)
            : []
        }
      : undefined,
    summary: typeof raw.summary === 'string'
      ? raw.summary
      : 'Analyzed uploaded bathroom photo.'
  };
}

function buildVisionPrompt(userGivenWidth?: number): string {
  return `Analyze this bathroom/washroom photo and return ONLY valid JSON matching this TypeScript shape:
{
  "detectedElements": [
    {
      "id": "string",
      "label": "string",
      "confidence": 0.0,
      "category": "toilet" | "vanity" | "shower" | "door" | "window" | "tile" | "lighting",
      "boundingBox": { "x": 0, "y": 0, "width": 0, "height": 0 },
      "attributes": {}
    }
  ],
  "estimatedDimensions": {
    "length": 8,
    "width": 6,
    "height": 9,
    "confidence": 0.0,
    "notes": "string"
  },
  "detectedLayout": {
    "doorWall": "north" | "south" | "east" | "west",
    "windowWall": "north" | "south" | "east" | "west",
    "plumbingLocations": ["string"]
  },
  "identifiedBottlenecks": ["string"],
  "aiRecommendations": [
    {
      "existingIssue": "string",
      "recommendedKohlerFixture": "string",
      "spaceOrWaterBenefit": "string"
    }
  ],
  "aestheticAnalysis": {
    "primaryColorPalette": ["#ffffff"],
    "materialTone": "string",
    "lightingQuality": "string",
    "recommendedStyle": "minimalist_modern" | "classic_luxury" | "japanese_zen" | "contemporary" | "premium" | "modern",
    "styleMatchConfidence": 0.0
  },
  "imageMetrics": {
    "dominantBrightness": 0,
    "colorTemperature": "warm" | "neutral" | "cool",
    "contrastRatio": 1,
    "detectedSurfaces": ["string"]
  },
  "summary": "string"
}

Bounding boxes must be percentages from 0 to 100. Infer doorWall/windowWall from the viewer-facing plan orientation as best as possible. Use the provided known width if useful: ${userGivenWidth ?? 'none'} ft. Do not include markdown fences or explanatory prose.`;
}

async function callAnthropicVision(image: PreparedImage, userGivenWidth?: number): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetchWithTimeout(
    ANTHROPIC_MESSAGES_URL,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 1800,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.mediaType,
                  data: image.base64
                }
              },
              {
                type: 'text',
                text: buildVisionPrompt(userGivenWidth)
              }
            ]
          }
        ]
      })
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Anthropic vision request failed with HTTP ${response.status}: ${errorText.slice(0, 180)}`);
  }

  const payload: any = await response.json();
  const text = payload?.content
    ?.filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
    ?.map((part: any) => part.text)
    ?.join('\n');

  if (!text) {
    throw new Error('Anthropic response did not include text content');
  }

  return JSON.parse(stripJsonFences(text));
}

export async function analyzeBathroomImage(
  imageBase64OrUrl: string,
  userGivenWidth?: number
): Promise<ImageAnalysisResult> {
  try {
    const image = await prepareImage(imageBase64OrUrl);
    if (!image.base64) {
      throw new Error('Image payload was empty');
    }

    const rawAnalysis = await callAnthropicVision(image, userGivenWidth);
    return validateAnalysisShape(rawAnalysis, userGivenWidth);
  } catch (error: any) {
    console.warn('[KOHLER AI Vision] Falling back to low-confidence result:', error?.message || error);
    return fallbackAnalysis(error?.message || 'Unknown vision analysis failure', userGivenWidth);
  }
}
