import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ImageAnalysisResult, DetectedElement, DesignStyle } from '../../src/types/index.js';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
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
      notes: `Low confidence: photo analysis unavailable (${reason}). Please adjust room dimensions and layout manually.`
    },
    detectedLayout: {
      doorWall: 'south',
      windowWall: undefined,
      plumbingLocations: []
    },
    identifiedBottlenecks: [
      `Vision analysis unavailable: ${reason}. Please customize room dimensions manually in the Dimensions tab.`
    ],
    aiRecommendations: [
      {
        existingIssue: 'Automatic visual inspection unavailable or API key not configured.',
        recommendedKohlerFixture: 'Select preferred Verre Studio fixtures manually from the catalog.',
        spaceOrWaterBenefit: 'Use the 2D CAD and 3D Studio tabs to configure your spatial clearances.'
      }
    ],
    aestheticAnalysis: {
      primaryColorPalette: ['#f8fafc', '#94a3b8', '#334155'],
      materialTone: 'Neutral Contemporary',
      lightingQuality: 'Standard Ambient',
      recommendedStyle: 'minimalist_modern',
      styleMatchConfidence: 0.2
    },
    imageMetrics: {
      dominantBrightness: 128,
      colorTemperature: 'neutral',
      contrastRatio: 1.2,
      detectedSurfaces: ['floor', 'wall']
    },
    summary: `Photo analysis unavailable (${reason}). You can manually customize dimensions, fixtures, and style.`
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
      notes: typeof dimensions.notes === 'string'
        ? dimensions.notes
        : 'Visually estimated planning approximations. Confirm dimensions with on-site tape measurement before construction.'
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
            recommendedKohlerFixture: typeof item.recommendedKohlerFixture === 'string' ? item.recommendedKohlerFixture : 'Verre Studio fixture recommendation',
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
  return `You are an expert architectural vision engine analyzing this bathroom/washroom photo for Verre Studio AI Designer.
Examine the image carefully:
1. Detect all visible bathroom fixtures (toilet, vanity, sink, shower, bathtub, mirror, faucet), door/window openings, tiles, and lighting.
2. Provide bounding box percentages (0 to 100) for each detected element.
3. Estimate room dimensions in feet (length, width, height) based on standard fixture scales (e.g. standard toilets are ~1.5x2.2 ft, vanities ~2x3 ft). If user supplied known width (${userGivenWidth ? userGivenWidth + ' ft' : 'none'}), calibrate with it.
   Emphasize in notes that these are visual planning estimates, not on-site laser measurements.
4. Infer likely plumbing rough-in zones (e.g. "south wall toilet soil stack", "west wall wet-zone drain").
5. Assess aesthetic color palette (hex colors), material finishes, and recommend the best matching design style: minimalist_modern, classic_luxury, japanese_zen, contemporary, premium, or modern.
6. Identify practical bottlenecks and suggest Verre Studio design improvements.

Return strictly structured JSON conforming to the schema.`;
}

const GEMINI_IMAGE_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  description: 'Structured architectural analysis of uploaded bathroom photo',
  properties: {
    detectedElements: {
      type: SchemaType.ARRAY,
      description: 'Detected fixtures, openings, and surfaces with bounding boxes',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          label: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          category: {
            type: SchemaType.STRING,
            enum: ['toilet', 'vanity', 'shower', 'door', 'window', 'tile', 'lighting']
          },
          boundingBox: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.NUMBER, description: 'Percentage from left 0 to 100' },
              y: { type: SchemaType.NUMBER, description: 'Percentage from top 0 to 100' },
              width: { type: SchemaType.NUMBER, description: 'Width percentage 0 to 100' },
              height: { type: SchemaType.NUMBER, description: 'Height percentage 0 to 100' }
            },
            required: ['x', 'y', 'width', 'height']
          }
        },
        required: ['id', 'label', 'confidence', 'category', 'boundingBox']
      }
    },
    estimatedDimensions: {
      type: SchemaType.OBJECT,
      description: 'Estimated room dimensions in feet (visual inferences)',
      properties: {
        length: { type: SchemaType.NUMBER, description: 'Estimated length in feet' },
        width: { type: SchemaType.NUMBER, description: 'Estimated width in feet' },
        height: { type: SchemaType.NUMBER, description: 'Estimated ceiling height in feet' },
        confidence: { type: SchemaType.NUMBER, description: 'Confidence between 0 and 1' },
        notes: { type: SchemaType.STRING, description: 'Planning disclaimer notes' }
      },
      required: ['length', 'width', 'height', 'confidence', 'notes']
    },
    detectedLayout: {
      type: SchemaType.OBJECT,
      description: 'Estimated layout orientation and rough-in zones',
      properties: {
        doorWall: {
          type: SchemaType.STRING,
          enum: ['north', 'south', 'east', 'west']
        },
        windowWall: {
          type: SchemaType.STRING,
          enum: ['north', 'south', 'east', 'west']
        },
        plumbingLocations: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Inferred rough-in wall zones'
        }
      },
      required: ['doorWall', 'plumbingLocations']
    },
    identifiedBottlenecks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Spatial and ventilation bottlenecks observed'
    },
    aiRecommendations: {
      type: SchemaType.ARRAY,
      description: 'Fixtures and layout recommendations',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          existingIssue: { type: SchemaType.STRING },
          recommendedKohlerFixture: { type: SchemaType.STRING, description: 'Verre Studio fixture suggestion' },
          spaceOrWaterBenefit: { type: SchemaType.STRING }
        },
        required: ['existingIssue', 'recommendedKohlerFixture', 'spaceOrWaterBenefit']
      }
    },
    aestheticAnalysis: {
      type: SchemaType.OBJECT,
      description: 'Aesthetic palette and style evaluation',
      properties: {
        primaryColorPalette: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        },
        materialTone: { type: SchemaType.STRING },
        lightingQuality: { type: SchemaType.STRING },
        recommendedStyle: {
          type: SchemaType.STRING,
          enum: ['minimalist_modern', 'classic_luxury', 'japanese_zen', 'contemporary', 'premium', 'modern']
        },
        styleMatchConfidence: { type: SchemaType.NUMBER }
      },
      required: ['primaryColorPalette', 'materialTone', 'lightingQuality', 'recommendedStyle', 'styleMatchConfidence']
    },
    imageMetrics: {
      type: SchemaType.OBJECT,
      properties: {
        dominantBrightness: { type: SchemaType.NUMBER },
        colorTemperature: {
          type: SchemaType.STRING,
          enum: ['warm', 'neutral', 'cool']
        },
        contrastRatio: { type: SchemaType.NUMBER },
        detectedSurfaces: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      }
    },
    summary: { type: SchemaType.STRING, description: 'Visual analysis summary' }
  },
  required: [
    'detectedElements',
    'estimatedDimensions',
    'detectedLayout',
    'identifiedBottlenecks',
    'aiRecommendations',
    'aestheticAnalysis',
    'summary'
  ]
};

async function callGeminiVision(image: PreparedImage, userGivenWidth?: number): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_IMAGE_ANALYSIS_SCHEMA as any
    }
  });

  const prompt = buildVisionPrompt(userGivenWidth);
  const imagePart = {
    inlineData: {
      data: image.base64,
      mimeType: image.mediaType
    }
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Gemini Vision request timed out after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS);
  });

  const result = await Promise.race([
    model.generateContent([prompt, imagePart]),
    timeoutPromise
  ]);

  const text = result.response.text();
  if (!text) {
    throw new Error('Gemini Vision response returned empty text');
  }

  return JSON.parse(stripJsonFences(text));
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
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
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

    // 1. Primary: Google Gemini Vision with responseSchema
    if (process.env.GEMINI_API_KEY) {
      try {
        const rawAnalysis = await callGeminiVision(image, userGivenWidth);
        return validateAnalysisShape(rawAnalysis, userGivenWidth);
      } catch (geminiErr: any) {
        console.warn('[Verre Studio Vision] Gemini API error, checking fallback:', geminiErr?.message || geminiErr);
        if (process.env.ANTHROPIC_API_KEY) {
          const rawAnalysis = await callAnthropicVision(image, userGivenWidth);
          return validateAnalysisShape(rawAnalysis, userGivenWidth);
        }
        throw geminiErr;
      }
    }

    // 2. Secondary fallback: Anthropic Vision if configured
    if (process.env.ANTHROPIC_API_KEY) {
      const rawAnalysis = await callAnthropicVision(image, userGivenWidth);
      return validateAnalysisShape(rawAnalysis, userGivenWidth);
    }

    throw new Error('GEMINI_API_KEY is not configured in .env. Enter room dimensions manually.');
  } catch (error: any) {
    console.warn('[Verre Studio AI Vision] Falling back to graceful estimation:', error?.message || error);
    return fallbackAnalysis(error?.message || 'Vision service unavailable', userGivenWidth);
  }
}
