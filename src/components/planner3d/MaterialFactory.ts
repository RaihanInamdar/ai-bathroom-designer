import * as THREE from 'three';
import { DesignStyle } from '../../types';
import { getTileById } from '../../data/tiles';
import { TileFinish, TileType } from '../../models/Tile';

export type FloorFinish = 
  | 'carrara_marble' 
  | 'herringbone_oak' 
  | 'charcoal_slate' 
  | 'terrazzo_mosaic' 
  | 'hinoki_wood' 
  | 'travertine_stone'
  | string;

export type WallFinish = 
  | 'calacatta_gold' 
  | 'emerald_zellige' 
  | 'fluted_hinoki' 
  | 'concrete_plaster' 
  | 'subway_ceramic' 
  | 'soft_sandstone'
  | string;

export interface SurfaceFinishes {
  floor: FloorFinish;
  wall: WallFinish;
  ceiling?: string;
}

/**
 * Creates high-fidelity procedural PBR diffuse and bump maps
 * for all 11 architectural tile categories.
 */
function createPBRTileMaps(tile: TileFinish): { diffuseMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Default neutral base
  ctx.fillStyle = tile.color || '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  const tileType: TileType = tile.type || 'ceramic';

  switch (tileType) {
    case 'marble': {
      // Base polished marble
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);

      const isGold = tile.id.includes('calacatta') || tile.id.includes('gold');
      const veinColor = isGold ? 'rgba(202, 138, 4, 0.45)' : 'rgba(100, 116, 139, 0.35)';

      // Organic bezier veins
      for (let v = 0; v < 3; v++) {
        ctx.strokeStyle = veinColor;
        ctx.lineWidth = 3 + v;
        ctx.beginPath();
        const startX = (v * 160) % 512;
        ctx.moveTo(startX, 0);
        ctx.bezierCurveTo(startX + 120, 160, startX - 80, 320, startX + 180, 512);
        ctx.stroke();

        // Subtle tributary veins
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX + 60, 200);
        ctx.lineTo(startX + 140, 260);
        ctx.moveTo(startX - 20, 300);
        ctx.lineTo(startX + 40, 380);
        ctx.stroke();
      }

      // Large format tile grout line (e.g. 24x48 in)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 512, 512);

      bCtx.strokeStyle = '#202020';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(0, 0, 512, 512);
      break;
    }

    case 'granite': {
      // Obsidian or stone ground
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);

      // Crystalline mineral specks
      const fleckColors = ['#f59e0b', '#38bdf8', '#e2e8f0', '#000000'];
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const rad = 1 + Math.random() * 3.5;
        ctx.fillStyle = fleckColors[i % fleckColors.length];
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();

        bCtx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
        bCtx.fillRect(x, y, rad, rad);
      }
      ctx.globalAlpha = 1.0;

      // Grout
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.strokeRect(256, 0, 256, 256);
      ctx.strokeRect(0, 256, 256, 256);
      ctx.strokeRect(256, 256, 256, 256);

      bCtx.strokeStyle = '#000000';
      bCtx.lineWidth = 4;
      bCtx.strokeRect(0, 0, 256, 256);
      bCtx.strokeRect(256, 0, 256, 256);
      bCtx.strokeRect(0, 256, 256, 256);
      bCtx.strokeRect(256, 256, 256, 256);
      break;
    }

    case 'wooden': {
      // Natural wood grain base
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);

      const plankHeight = 64;
      for (let y = 0; y < 512; y += plankHeight) {
        // Plank joint line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();

        bCtx.strokeStyle = '#000000';
        bCtx.lineWidth = 3;
        bCtx.beginPath();
        bCtx.moveTo(0, y);
        bCtx.lineTo(512, y);
        bCtx.stroke();

        // Longitudinal wood grain fibers
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        for (let g = 4; g < plankHeight; g += 6) {
          ctx.beginPath();
          ctx.moveTo(0, y + g);
          ctx.bezierCurveTo(150, y + g + 2, 350, y + g - 2, 512, y + g);
          ctx.stroke();
        }
      }
      break;
    }

    case 'designer': {
      if (tile.id.includes('fluted')) {
        // Architectural 3D Fluted vertical ribbon ridges
        ctx.fillStyle = tile.color;
        ctx.fillRect(0, 0, 512, 512);

        const fluteW = 24;
        for (let x = 0; x < 512; x += fluteW) {
          const grad = ctx.createLinearGradient(x, 0, x + fluteW, 0);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
          grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, 0, fluteW, 512);

          // Deep normal bump groove
          const bGrad = bCtx.createLinearGradient(x, 0, x + fluteW, 0);
          bGrad.addColorStop(0, '#ffffff');
          bGrad.addColorStop(0.5, '#808080');
          bGrad.addColorStop(1, '#000000');
          bCtx.fillStyle = bGrad;
          bCtx.fillRect(x, 0, fluteW, 512);
        }
      } else {
        // Venetian Terrazzo aggregate chips
        ctx.fillStyle = tile.color;
        ctx.fillRect(0, 0, 512, 512);
        const chips = ['#1e293b', '#b45309', '#047857', '#94a3b8', '#d4af37', '#e11d48'];
        for (let i = 0; i < 180; i++) {
          const cx = Math.random() * 512;
          const cy = Math.random() * 512;
          const r = 2.5 + Math.random() * 9;
          ctx.fillStyle = chips[i % chips.length];
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          bCtx.fillStyle = '#a0a0a0';
          bCtx.beginPath();
          bCtx.arc(cx, cy, r, 0, Math.PI * 2);
          bCtx.fill();
        }
      }
      break;
    }

    case 'mosaic': {
      // Hexagonal or Subway mosaic grid
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;

      bCtx.strokeStyle = '#000000';
      bCtx.lineWidth = 4;

      const hexSize = 32;
      for (let y = 0; y < 512; y += hexSize) {
        for (let x = 0; x < 512; x += hexSize) {
          ctx.strokeRect(x, y, hexSize - 2, hexSize - 2);
          bCtx.strokeRect(x, y, hexSize - 2, hexSize - 2);

          ctx.fillStyle = (x + y) % (hexSize * 2) === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
          ctx.fillRect(x + 2, y + 2, hexSize - 6, hexSize - 6);
        }
      }
      break;
    }

    case 'concrete': {
      // Microcement industrial float trowel markings
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const w = 4 + Math.random() * 20;
        const h = 2 + Math.random() * 8;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(x, y, w, h);

        bCtx.fillStyle = Math.random() > 0.5 ? '#909090' : '#707070';
        bCtx.fillRect(x, y, w, h);
      }
      break;
    }

    case 'vintage': {
      // Moroccan Zellige handmade uneven glaze
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);
      const tileSize = 64;
      for (let y = 0; y < 512; y += tileSize) {
        for (let x = 0; x < 512; x += tileSize) {
          const varAlpha = (Math.sin(x) + Math.cos(y)) * 0.12;
          ctx.fillStyle = varAlpha > 0 ? `rgba(255, 255, 255, ${varAlpha})` : `rgba(0, 0, 0, ${-varAlpha})`;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x, y, tileSize, tileSize);

          bCtx.strokeStyle = '#000000';
          bCtx.lineWidth = 3;
          bCtx.strokeRect(x, y, tileSize, tileSize);
        }
      }
      break;
    }

    case 'stone': {
      // Travertine / Sandstone vein-cut pores
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);

      for (let y = 0; y < 512; y += 12) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
        ctx.fillRect(0, y, 512, 3);
        bCtx.fillStyle = '#505050';
        bCtx.fillRect(0, y, 512, 3);
      }

      // Large tile seams
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 512, 256);
      ctx.strokeRect(0, 256, 512, 256);

      bCtx.strokeStyle = '#000000';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(0, 0, 512, 256);
      bCtx.strokeRect(0, 256, 512, 256);
      break;
    }

    case 'matte':
    case 'glossy':
    case 'ceramic':
    default: {
      // Clean modern ceramic grid with grout
      ctx.fillStyle = tile.color;
      ctx.fillRect(0, 0, 512, 512);

      const gridW = 128;
      const gridH = 64; // Running bond subway format
      let row = 0;
      for (let y = 0; y < 512; y += gridH) {
        const offset = (row % 2 === 0) ? 0 : gridW / 2;
        for (let x = -gridW; x < 512 + gridW; x += gridW) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + offset, y, gridW, gridH);

          bCtx.strokeStyle = '#000000';
          bCtx.lineWidth = 3.5;
          bCtx.strokeRect(x + offset, y, gridW, gridH);
        }
        row++;
      }
      break;
    }
  }

  const diffuseMap = new THREE.CanvasTexture(canvas);
  diffuseMap.wrapS = THREE.RepeatWrapping;
  diffuseMap.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { diffuseMap, bumpMap };
}

export class MaterialFactory {
  static getStyleMaterials(style: DesignStyle, customFinishes?: SurfaceFinishes) {
    const floorId = customFinishes?.floor || (
      style === 'japanese_zen' ? 'wooden_hinoki' :
      style === 'classic_luxury' ? 'marble_carrara' :
      style === 'minimalist_modern' ? 'designer_terrazzo_venetian' :
      'matte_graphite_slate'
    );

    const wallId = customFinishes?.wall || (
      style === 'japanese_zen' ? 'designer_fluted_3d' :
      style === 'classic_luxury' ? 'marble_calacatta_gold' :
      style === 'minimalist_modern' ? 'ceramic_artisan_glazed' :
      'concrete_microcement_industrial'
    );

    const floorTile = getTileById(floorId);
    const wallTile = getTileById(wallId);

    const floorMaps = createPBRTileMaps(floorTile);
    floorMaps.diffuseMap.repeat.set(4, 4);
    floorMaps.bumpMap.repeat.set(4, 4);

    const wallMaps = createPBRTileMaps(wallTile);
    wallMaps.diffuseMap.repeat.set(4, 2);
    wallMaps.bumpMap.repeat.set(4, 2);

    // Dynamic accent color
    let accentColor = 0xb45309;
    if (style === 'classic_luxury') accentColor = 0xd4af37;
    if (style === 'minimalist_modern') accentColor = 0x18181b;
    if (style === 'contemporary') accentColor = 0xca8a04;

    // Floor PBR
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorMaps.diffuseMap,
      bumpMap: floorMaps.bumpMap,
      bumpScale: 0.035,
      roughness: floorTile.roughness,
      metalness: floorTile.metalness,
    });

    // Wall PBR
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallMaps.diffuseMap,
      bumpMap: wallMaps.bumpMap,
      bumpScale: wallTile.type === 'designer' ? 0.08 : 0.03,
      roughness: wallTile.roughness,
      metalness: wallTile.metalness,
      side: THREE.DoubleSide,
    });

    // Realistic Physical Architectural Glass (Tempered 10mm Shower Screens)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.03,
      metalness: 0.05,
      transmission: 0.96,
      ior: 1.52, // Glass index of refraction
      reflectivity: 0.85,
    });

    // Mirror Surface
    const mirrorGlass = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      roughness: 0.02,
      metalness: 0.98,
    });

    // Polished Chrome
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.96,
      roughness: 0.08,
    });

    // Brushed Gold / Brass
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.22,
    });

    // Matte Obsidian Black
    const matteBlackMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.55,
      metalness: 0.25,
    });

    // Glazed Vitreous China Ceramic White
    const ceramicWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.04,
    });

    // Translucent Spa Water Mesh
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      roughness: 0.06,
      metalness: 0.02,
      transmission: 0.75,
      ior: 1.333, // Water refractive index
    });

    // Warm Ambient LED Glow for Backlit Mirrors & Coves
    const ledGlowWarm = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      toneMapped: false,
    });

    const ledGlowCyan = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      toneMapped: false,
    });

    return {
      floorMaterial,
      wallMaterial,
      glassMaterial,
      mirrorGlass,
      chromeMaterial,
      goldMaterial,
      matteBlackMaterial,
      ceramicWhite,
      waterMaterial,
      ledGlowWarm,
      ledGlowCyan,
      accentColor,
      floorTile,
      wallTile
    };
  }
}
