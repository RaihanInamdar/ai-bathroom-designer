import { ImageAnalysisResult, LayoutArchetype, PlumbingPoint } from '../types';

export function derivePhotoArchetype(scan: ImageAnalysisResult, area: number): LayoutArchetype {
  const categories = new Set(scan.detectedElements.map((element) => element.category));
  const summary = `${scan.summary} ${scan.identifiedBottlenecks.join(' ')}`.toLowerCase();

  if (area >= 75 || summary.includes('tub') || summary.includes('spa')) {
    return 'wet_room_suite';
  }

  if (categories.has('shower') && categories.has('toilet') && categories.has('vanity')) {
    return 'split_parallel';
  }

  if (summary.includes('entry') || summary.includes('clearance') || summary.includes('compact')) {
    return 'l_shaped';
  }

  return 'symmetrical_focal';
}

export function derivePhotoFinishes(scan: ImageAnalysisResult) {
  const style = scan.aestheticAnalysis.recommendedStyle;
  const tone = `${scan.aestheticAnalysis.materialTone} ${scan.aestheticAnalysis.lightingQuality}`.toLowerCase();
  const colorTemp = scan.imageMetrics?.colorTemperature;

  if (style === 'japanese_zen' || tone.includes('wood') || tone.includes('hinoki') || colorTemp === 'warm') {
    return { floor: 'wooden_hinoki', wall: 'designer_fluted_3d' };
  }

  if (style === 'classic_luxury' || tone.includes('brass') || tone.includes('carrara') || tone.includes('gold')) {
    return { floor: 'marble_calacatta_gold', wall: 'marble_carrara' };
  }

  if (style === 'contemporary' || tone.includes('charcoal') || tone.includes('slate') || colorTemp === 'cool') {
    return { floor: 'matte_graphite_slate', wall: 'concrete_industrial_cast' };
  }

  return { floor: 'designer_terrazzo_venetian', wall: 'ceramic_artisan_glazed' };
}

export function derivePlumbingPoints(scan: ImageAnalysisResult, roomLength: number, roomWidth: number): PlumbingPoint[] {
  const midpoint = (box: ImageAnalysisResult['detectedElements'][number]['boundingBox']) => ({
    x: Number(Math.max(0.4, Math.min(roomLength - 0.4, ((box.x + box.width / 2) / 100) * roomLength)).toFixed(2)),
    y: Number(Math.max(0.4, Math.min(roomWidth - 0.4, ((box.y + box.height / 2) / 100) * roomWidth)).toFixed(2))
  });

  return scan.detectedElements
    .filter((element) => ['toilet', 'vanity', 'shower'].includes(element.category))
    .map((element, index) => {
      const center = midpoint(element.boundingBox);
      const type: PlumbingPoint['type'] = element.category === 'shower'
        ? 'shower_drain'
        : element.category === 'toilet'
          ? 'waste_drain'
          : 'water_inlet';

      return {
        id: `photo-${element.category}-${index}`,
        type,
        wall: scan.detectedLayout.windowWall || 'north',
        x: center.x,
        y: center.y
      };
    });
}
