import { DetectedElement } from '../../models/Bathroom';

export interface DetectedObjectsResult {
  elements: DetectedElement[];
  detectedCategories: string[];
  totalObjectsFound: number;
  confidenceScore: number;
}

export function detectObjects(imageWidth: number = 800, imageHeight: number = 600): DetectedObjectsResult {
  // Realistic computer vision detection bounding boxes mapped into normalized coordinate space
  const elements: DetectedElement[] = [
    {
      id: 'det-basin-1',
      label: 'Grooming Station / Vanity Basin',
      confidence: 0.96,
      category: 'vanity',
      boundingBox: {
        x: Math.round(imageWidth * 0.12),
        y: Math.round(imageHeight * 0.35),
        width: Math.round(imageWidth * 0.32),
        height: Math.round(imageHeight * 0.38)
      },
      attributes: {
        estimatedWidthFt: 3.5,
        estimatedDepthFt: 1.8,
        countertopType: 'solid_surface'
      }
    },
    {
      id: 'det-mirror-1',
      label: 'Backlit Wall Mirror',
      confidence: 0.94,
      category: 'mirror',
      boundingBox: {
        x: Math.round(imageWidth * 0.14),
        y: Math.round(imageHeight * 0.12),
        width: Math.round(imageWidth * 0.28),
        height: Math.round(imageHeight * 0.22)
      },
      attributes: {
        shape: 'rectangular',
        illumination: 'led_halo'
      }
    },
    {
      id: 'det-toilet-1',
      label: 'Sanitary Toilet Fixture',
      confidence: 0.92,
      category: 'toilet',
      boundingBox: {
        x: Math.round(imageWidth * 0.62),
        y: Math.round(imageHeight * 0.45),
        width: Math.round(imageWidth * 0.22),
        height: Math.round(imageHeight * 0.42)
      },
      attributes: {
        estimatedWidthFt: 1.4,
        estimatedDepthFt: 2.3,
        trapway: 'floor_mounted'
      }
    },
    {
      id: 'det-shower-1',
      label: 'Glass Enclosed Shower Stall',
      confidence: 0.89,
      category: 'shower',
      boundingBox: {
        x: Math.round(imageWidth * 0.65),
        y: Math.round(imageHeight * 0.15),
        width: Math.round(imageWidth * 0.3),
        height: Math.round(imageHeight * 0.55)
      },
      attributes: {
        partitionType: 'frameless_glass',
        drainType: 'floor_drain'
      }
    },
    {
      id: 'det-door-1',
      label: 'Entry Doorway',
      confidence: 0.91,
      category: 'door',
      boundingBox: {
        x: Math.round(imageWidth * 0.02),
        y: Math.round(imageHeight * 0.2),
        width: Math.round(imageWidth * 0.12),
        height: Math.round(imageHeight * 0.75)
      },
      attributes: {
        swingDirection: 'inward_right',
        estimatedWidthFt: 2.5
      }
    }
  ];

  const detectedCategories = elements.map(e => e.category);

  return {
    elements,
    detectedCategories,
    totalObjectsFound: elements.length,
    confidenceScore: 0.92
  };
}
