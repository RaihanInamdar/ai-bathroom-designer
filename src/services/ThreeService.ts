import * as THREE from 'three';
import { RoomConfig } from '../models/Room';

export type CameraViewPreset = 'perspective' | 'top_down' | 'eye_level' | 'focal_fixture';

export interface CameraRigConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export type LightingPreset = 'daylight' | 'luxury_warm' | 'evening_mood';

export interface LightingRigConfig {
  ambientColor: string;
  ambientIntensity: number;
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  spotlights: Array<{
    position: [number, number, number];
    target: [number, number, number];
    color: string;
    intensity: number;
    angle: number;
    penumbra: number;
  }>;
}

/**
 * ThreeService: Pure helper utilities for 3D camera viewpoints, lighting rigs,
 * and 3D coordinate transformations for the bathroom visualization.
 */
export class ThreeService {
  /**
   * Calculates dynamic camera placement according to room dimensions and chosen viewpoint.
   */
  static getCameraConfig(room: RoomConfig, preset: CameraViewPreset): CameraRigConfig {
    const { length, width, height } = room;
    const maxDim = Math.max(length, width);

    switch (preset) {
      case 'top_down':
        return {
          position: [0, Math.max(height * 2.2, maxDim * 1.6), 0.001],
          target: [0, 0, 0],
          fov: 38
        };

      case 'eye_level':
        // Inside room viewpoint at standard eye level (1.55m)
        return {
          position: [0, 1.55, width * 0.35],
          target: [0, 1.2, -width * 0.35],
          fov: 65
        };

      case 'focal_fixture':
        // Angled close-up focusing on vanity / centerpiece
        return {
          position: [length * 0.25, 1.3, width * 0.3],
          target: [0, 0.9, -width * 0.1],
          fov: 50
        };

      case 'perspective':
      default:
        // Elevated isometric 3/4 perspective showing 3 walls and floor clearly
        return {
          position: [length * 0.85, height * 1.25, width * 0.95],
          target: [0, height * 0.35, 0],
          fov: 48
        };
    }
  }

  /**
   * Lighting presets optimized for architectural bathroom rendering.
   */
  static getLightingConfig(room: RoomConfig, preset: LightingPreset): LightingRigConfig {
    const { length, width, height } = room;

    switch (preset) {
      case 'luxury_warm':
        return {
          ambientColor: '#fff7ed',
          ambientIntensity: 0.6,
          sunPosition: [length * 0.6, height * 1.5, width * 0.6],
          sunColor: '#fef3c7',
          sunIntensity: 0.8,
          spotlights: [
            // Center ceiling downlight
            {
              position: [0, height * 0.95, 0],
              target: [0, 0, 0],
              color: '#fffbeb',
              intensity: 1.2,
              angle: Math.PI / 3.5,
              penumbra: 0.4
            },
            // Vanity zone spotlight
            {
              position: [0, height * 0.92, -width * 0.3],
              target: [0, 0.85, -width * 0.45],
              color: '#fef3c7',
              intensity: 1.5,
              angle: Math.PI / 4,
              penumbra: 0.5
            }
          ]
        };

      case 'evening_mood':
        return {
          ambientColor: '#1e1b4b',
          ambientIntensity: 0.3,
          sunPosition: [-length * 0.5, height * 1.2, -width * 0.5],
          sunColor: '#fed7aa',
          sunIntensity: 0.4,
          spotlights: [
            {
              position: [0, height * 0.8, -width * 0.35],
              target: [0, 0.8, -width * 0.48],
              color: '#fbbf24',
              intensity: 2.0,
              angle: Math.PI / 4,
              penumbra: 0.6
            }
          ]
        };

      case 'daylight':
      default:
        return {
          ambientColor: '#f8fafc',
          ambientIntensity: 0.85,
          sunPosition: [length * 1.2, height * 2.0, width * 0.8],
          sunColor: '#ffffff',
          sunIntensity: 1.2,
          spotlights: [
            {
              position: [0, height * 0.96, 0],
              target: [0, 0, 0],
              color: '#ffffff',
              intensity: 0.9,
              angle: Math.PI / 3,
              penumbra: 0.3
            }
          ]
        };
    }
  }

  /**
   * Converts 2D canvas coordinates (meters, origin at room center or top-left)
   * to Three.js 3D world coordinates.
   */
  static convert2DTo3D(
    x: number,
    y: number,
    elevation: number = 0
  ): [number, number, number] {
    // 2D X maps to 3D X
    // 2D Y maps to 3D Z
    // elevation maps to 3D Y
    return [x, elevation, y];
  }

  /**
   * Generates a checkerboard / tile procedural canvas texture for rapid preview
   * when 3D texture assets are loading or unavailable.
   */
  static createTileTexture(
    colorHex: string,
    groutHex: string = '#cbd5e1',
    tilesPerMeter: number = 2
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = groutHex;
      ctx.fillRect(0, 0, 256, 256);

      const tileSize = 256 / tilesPerMeter;
      const groutWidth = 3;

      ctx.fillStyle = colorHex;
      for (let i = 0; i < tilesPerMeter; i++) {
        for (let j = 0; j < tilesPerMeter; j++) {
          ctx.fillRect(
            i * tileSize + groutWidth,
            j * tileSize + groutWidth,
            tileSize - groutWidth * 2,
            tileSize - groutWidth * 2
          );
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}
