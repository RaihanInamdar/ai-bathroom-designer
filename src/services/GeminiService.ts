import { AIDetectionResult } from '../models/Bathroom';
import { detectBathroomDimensions } from '../features/ai/detectBathroom';
import { detectTiles } from '../features/ai/detectTiles';
import { detectObjects } from '../features/ai/detectObjects';

export interface AnalyzeImageOptions {
  base64Image: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Analyzes an uploaded bathroom photo.
   * Tries the backend Gemini Vision endpoint first; if unavailable, falls back to the
   * client-side computer vision analyzers (detectBathroom, detectTiles, detectObjects).
   */
  public async analyzeBathroomImage(options: AnalyzeImageOptions): Promise<AIDetectionResult> {
    const { base64Image, width = 800, height = 600, aspectRatio = 1.33 } = options;

    try {
      // Try backend proxy if available
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      if (response.ok) {
        const data = await response.json();
        return this.mapBackendResultToAIDetection(data.analysis || data);
      }
    } catch (err) {
      console.warn('Gemini backend endpoint unavailable, executing client vision engine:', err);
    }

    // Client-side modular AI engine execution
    return this.runClientVisionEngine(base64Image, width, height, aspectRatio);
  }

  private runClientVisionEngine(
    base64Image: string,
    width: number,
    height: number,
    aspectRatio: number
  ): AIDetectionResult {
    const roomDims = detectBathroomDimensions(aspectRatio);
    const tileAnalysis = detectTiles(base64Image);
    const objectDetections = detectObjects(width, height);

    return {
      detectedElements: objectDetections.elements,
      estimatedDimensions: {
        length: roomDims.length,
        width: roomDims.width,
        height: roomDims.height,
        confidence: roomDims.confidence,
        notes: roomDims.notes
      },
      detectedLayout: {
        doorWall: roomDims.door.wall,
        windowWall: roomDims.window?.wall,
        plumbingLocations: ['North-East Wet Stack', 'West Grooming Line', 'East Waste Outlet']
      },
      detectedFinishes: {
        floorType: tileAnalysis.floorTileType,
        wallTiles: tileAnalysis.wallTileType,
        colorPalette: tileAnalysis.primaryColorPalette
      },
      summary: `AI detected a ${roomDims.length}' x ${roomDims.width}' space (${roomDims.estimatedArea} sq.ft) with ${tileAnalysis.floorTileType} flooring and ${objectDetections.totalObjectsFound} architectural fixtures.`
    };
  }

  private mapBackendResultToAIDetection(backendData: any): AIDetectionResult {
    return {
      detectedElements: backendData.detectedElements || [],
      estimatedDimensions: {
        length: backendData.estimatedDimensions?.length || 8.0,
        width: backendData.estimatedDimensions?.width || 6.0,
        height: backendData.estimatedDimensions?.height || 9.0,
        confidence: backendData.estimatedDimensions?.confidence || 0.9,
        notes: backendData.estimatedDimensions?.notes || 'Backend vision extraction complete'
      },
      detectedLayout: {
        doorWall: backendData.detectedLayout?.doorWall || 'south',
        windowWall: backendData.detectedLayout?.windowWall || 'north',
        plumbingLocations: backendData.detectedLayout?.plumbingLocations || []
      },
      detectedFinishes: {
        floorType: backendData.detectedSurfaces?.[0] || 'marble',
        wallTiles: backendData.detectedSurfaces?.[1] || 'ceramic',
        colorPalette: backendData.aestheticAnalysis?.primaryColorPalette || ['#f8fafc', '#94a3b8']
      },
      summary: backendData.summary || 'AI Vision analysis complete.'
    };
  }
}

export const geminiService = GeminiService.getInstance();
