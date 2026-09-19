import { RoomConfig, calculateMeasurements } from '../models/Room';
import { PlacedProduct } from '../models/Product';
import { SurfaceFinishes } from '../models/Tile';
import { getTileById } from '../data/tiles';

/**
 * Generates an architectural 2D CAD-style SVG blueprint
 * with dimension tick strings, centerline rough-ins, door clearance arcs,
 * and title block for contractors and plumbers.
 */
export function generateBlueprintSVG(
  room: RoomConfig,
  products: PlacedProduct[],
  projectName: string = 'Master Bathroom Architecture'
): string {
  const scale = 50; // 50px per foot
  const margin = 80;
  const widthPx = room.length * scale + margin * 2;
  const heightPx = room.width * scale + margin * 2;

  const roomX = margin;
  const roomY = margin;
  const roomWPx = room.length * scale;
  const roomHPx = room.width * scale;

  let svg = `<?xml version="1.0" standalone="no"?>
<svg width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}" xmlns="http://www.w3.org/2000/svg" style="background: #ffffff; font-family: 'Courier New', monospace;">
  <defs>
    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" stroke-width="0.8"/>
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a"/>
    </marker>
  </defs>

  <!-- Background Grid -->
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Outer Structural Wall Envelope (Double Line Construction) -->
  <rect x="${roomX - 6}" y="${roomY - 6}" width="${roomWPx + 12}" height="${roomHPx + 12}" fill="none" stroke="#0f172a" stroke-width="4" />
  <rect x="${roomX}" y="${roomY}" width="${roomWPx}" height="${roomHPx}" fill="#fafafa" stroke="#334155" stroke-width="2" />

  <!-- Dimension Strings: North Wall (X-Axis) -->
  <line x1="${roomX}" y1="${margin - 28}" x2="${roomX + roomWPx}" y2="${margin - 28}" stroke="#0f172a" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)" />
  <line x1="${roomX}" y1="${margin - 38}" x2="${roomX}" y2="${margin - 10}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
  <line x1="${roomX + roomWPx}" y1="${margin - 38}" x2="${roomX + roomWPx}" y2="${margin - 10}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
  <text x="${roomX + roomWPx / 2}" y="${margin - 34}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">${room.length.toFixed(1)}' - 0"</text>

  <!-- Dimension Strings: West Wall (Y-Axis) -->
  <line x1="${margin - 28}" y1="${roomY}" x2="${margin - 28}" y2="${roomY + roomHPx}" stroke="#0f172a" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)" />
  <line x1="${margin - 38}" y1="${roomY}" x2="${margin - 10}" y2="${roomY}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
  <line x1="${margin - 38}" y1="${roomY + roomHPx}" x2="${margin - 10}" y2="${roomY + roomHPx}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
  <text x="${margin - 34}" y="${roomY + roomHPx / 2}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a" transform="rotate(-90 ${margin - 34} ${roomY + roomHPx / 2})">${room.width.toFixed(1)}' - 0"</text>

  <!-- Door Opening & Clearance Swing Arc -->
`;

  // Draw Door on any wall with swing direction
  if (room.door) {
    const door = room.door;
    const dOffsetPx = (door.offset || 2.0) * scale;
    const dWidthPx = (door.width || 2.5) * scale;
    const isOutward = door.swing === 'outward';

    if (door.wall === 'south') {
      const doorStart = roomX + dOffsetPx;
      const doorY = roomY + roomHPx;
      const swingY = isOutward ? doorY + dWidthPx : doorY - dWidthPx;
      svg += `
    <!-- South Door Opening -->
    <rect x="${doorStart}" y="${doorY - 4}" width="${dWidthPx}" height="8" fill="#ffffff" stroke="none" />
    <line x1="${doorStart}" y1="${doorY}" x2="${doorStart}" y2="${swingY}" stroke="#0284c7" stroke-width="2" />
    <path d="M ${doorStart} ${swingY} A ${dWidthPx} ${dWidthPx} 0 0 ${isOutward ? 0 : 1} ${doorStart + dWidthPx} ${doorY}" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="${doorStart + dWidthPx / 2}" y="${doorY + (isOutward ? 24 : -12)}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">DOOR ${door.width || 2.5}' (${door.swing || 'inward'})</text>
`;
    } else if (door.wall === 'north') {
      const doorStart = roomX + dOffsetPx;
      const doorY = roomY;
      const swingY = isOutward ? doorY - dWidthPx : doorY + dWidthPx;
      svg += `
    <!-- North Door Opening -->
    <rect x="${doorStart}" y="${doorY - 4}" width="${dWidthPx}" height="8" fill="#ffffff" stroke="none" />
    <line x1="${doorStart}" y1="${doorY}" x2="${doorStart}" y2="${swingY}" stroke="#0284c7" stroke-width="2" />
    <path d="M ${doorStart} ${swingY} A ${dWidthPx} ${dWidthPx} 0 0 ${isOutward ? 1 : 0} ${doorStart + dWidthPx} ${doorY}" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="${doorStart + dWidthPx / 2}" y="${doorY + (isOutward ? -12 : 20)}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">DOOR ${door.width || 2.5}' (${door.swing || 'inward'})</text>
`;
    } else if (door.wall === 'west') {
      const doorX = roomX;
      const doorStart = roomY + dOffsetPx;
      const swingX = isOutward ? doorX - dWidthPx : doorX + dWidthPx;
      svg += `
    <!-- West Door Opening -->
    <rect x="${doorX - 4}" y="${doorStart}" width="8" height="${dWidthPx}" fill="#ffffff" stroke="none" />
    <line x1="${doorX}" y1="${doorStart}" x2="${swingX}" y2="${doorStart}" stroke="#0284c7" stroke-width="2" />
    <path d="M ${swingX} ${doorStart} A ${dWidthPx} ${dWidthPx} 0 0 ${isOutward ? 1 : 0} ${doorX} ${doorStart + dWidthPx}" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="${doorX + (isOutward ? -12 : 20)}" y="${doorStart + dWidthPx / 2}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">DOOR ${door.width || 2.5}'</text>
`;
    } else if (door.wall === 'east') {
      const doorX = roomX + roomWPx;
      const doorStart = roomY + dOffsetPx;
      const swingX = isOutward ? doorX + dWidthPx : doorX - dWidthPx;
      svg += `
    <!-- East Door Opening -->
    <rect x="${doorX - 4}" y="${doorStart}" width="8" height="${dWidthPx}" fill="#ffffff" stroke="none" />
    <line x1="${doorX}" y1="${doorStart}" x2="${swingX}" y2="${doorStart}" stroke="#0284c7" stroke-width="2" />
    <path d="M ${swingX} ${doorStart} A ${dWidthPx} ${dWidthPx} 0 0 ${isOutward ? 0 : 1} ${doorX} ${doorStart + dWidthPx}" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="${doorX + (isOutward ? 20 : -12)}" y="${doorStart + dWidthPx / 2}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">DOOR ${door.width || 2.5}'</text>
`;
    }
  }

  // Draw Window on any wall
  if (room.window) {
    const win = room.window;
    const wOffsetPx = (win.offset || 2.0) * scale;
    const wWidthPx = (win.width || 3.0) * scale;
    if (win.wall === 'north') {
      const winStart = roomX + wOffsetPx;
      svg += `
    <!-- North Window -->
    <rect x="${winStart}" y="${roomY - 4}" width="${wWidthPx}" height="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
    <text x="${winStart + wWidthPx / 2}" y="${roomY - 8}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">WINDOW ${win.width || 3}'</text>
`;
    } else if (win.wall === 'south') {
      const winStart = roomX + wOffsetPx;
      svg += `
    <!-- South Window -->
    <rect x="${winStart}" y="${roomY + roomHPx - 4}" width="${wWidthPx}" height="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
    <text x="${winStart + wWidthPx / 2}" y="${roomY + roomHPx + 16}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">WINDOW ${win.width || 3}'</text>
`;
    } else if (win.wall === 'west') {
      const winStart = roomY + wOffsetPx;
      svg += `
    <!-- West Window -->
    <rect x="${roomX - 4}" y="${winStart}" width="8" height="${wWidthPx}" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
    <text x="${roomX - 12}" y="${winStart + wWidthPx / 2}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">WINDOW ${win.width || 3}'</text>
`;
    } else if (win.wall === 'east') {
      const winStart = roomY + wOffsetPx;
      svg += `
    <!-- East Window -->
    <rect x="${roomX + roomWPx - 4}" y="${winStart}" width="8" height="${wWidthPx}" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
    <text x="${roomX + roomWPx + 16}" y="${winStart + wWidthPx / 2}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">WINDOW ${win.width || 3}'</text>
`;
    }
  }

  // Draw Fixtures with Architectural Symbols & Rough-In Centerlines
  products.forEach((p, idx) => {
    const px = roomX + p.x * scale;
    const py = roomY + p.y * scale;
    const pw = (p.width || 2) * scale;
    const pd = (p.depth || 2) * scale;

    svg += `
    <!-- Fixture #${idx + 1}: ${p.name} -->
    <g transform="translate(${px}, ${py}) rotate(${p.rotation || 0})">
      <rect x="${-pw / 2}" y="${-pd / 2}" width="${pw}" height="${pd}" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="1.8" />
      <!-- Centerline crosshair for plumbers -->
      <line x1="-8" y1="0" x2="8" y2="0" stroke="#ef4444" stroke-width="1" />
      <line x1="0" y1="-8" x2="0" y2="8" stroke="#ef4444" stroke-width="1" />
      <circle cx="0" cy="0" r="3" fill="none" stroke="#ef4444" stroke-width="1" />
      <text x="0" y="${pd / 2 + 12}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">${p.category.toUpperCase()}</text>
    </g>
`;
  });

  // Architectural Title Block
  const titleY = heightPx - 30;
  svg += `
  <!-- Title Block -->
  <line x1="${margin}" y1="${titleY - 15}" x2="${widthPx - margin}" y2="${titleY - 15}" stroke="#cbd5e1" stroke-width="1" />
  <text x="${margin}" y="${titleY}" font-size="11" font-weight="bold" fill="#0f172a">PROJECT: ${projectName.toUpperCase()}</text>
  <text x="${margin}" y="${titleY + 14}" font-size="9" fill="#64748b">SCALE: 1/2" = 1'-0" | ROOM: ${room.length}' × ${room.width}' × ${room.height}' (${(room.length * room.width).toFixed(0)} SQ.FT)</text>
  <text x="${widthPx - margin}" y="${titleY}" text-anchor="end" font-size="10" font-weight="bold" fill="#0f172a">VERRE STUDIO ARCHITECTURAL BIM</text>
  <text x="${widthPx - margin}" y="${titleY + 14}" text-anchor="end" font-size="9" fill="#64748b">PLUMBING ROUGH-IN BLUEPRINT</text>
</svg>`;

  return svg;
}

/**
 * Generates an installer Bill of Quantities (BOQ) in CSV format
 * including tile count, 10% wastage buffer, grout, adhesive, and fixtures.
 */
export function generateBOQCSV(
  room: RoomConfig,
  products: PlacedProduct[],
  finishes: SurfaceFinishes,
  quotation: any
): string {
  const measurements = calculateMeasurements(room);
  const floorTile = getTileById(finishes.floor) || { name: 'Porcelain Floor Tile', type: 'ceramic', tileSizeInches: { width: 24, height: 24 }, ratePerSqFt: 180 };
  const wallTile = getTileById(finishes.wall) || { name: 'Full Height Wall Cladding', type: 'marble', tileSizeInches: { width: 24, height: 48 }, ratePerSqFt: 220 };

  // Material estimations
  const floorSqFtWithWastage = Math.round(measurements.floorArea * 1.1);
  const wallSqFtWithWastage = Math.round(measurements.netWallArea * 1.1);
  const totalGroutKg = Math.round((measurements.floorArea + measurements.netWallArea) * 0.12);
  const totalAdhesiveBags = Math.round((measurements.floorArea + measurements.netWallArea) / 45); // ~45 sq.ft per 20kg bag
  const waterproofingRolls = Math.ceil(measurements.floorArea / 100);

  const floorCost = quotation.floorTilesCost ?? quotation.floorMaterialCost ?? (floorSqFtWithWastage * floorTile.ratePerSqFt);
  const wallCost = quotation.wallTilesCost ?? quotation.wallMaterialCost ?? (wallSqFtWithWastage * wallTile.ratePerSqFt);
  const labourCost = quotation.labourCost ?? quotation.installationCost ?? (measurements.floorArea * 180 + measurements.netWallArea * 160);
  const plumbingCost = quotation.transportCost ?? quotation.plumbingElectricalCost ?? 18000;
  const subtotal = quotation.subtotalBeforeTax ?? (floorCost + wallCost + labourCost + plumbingCost);
  const gstRate = quotation.gstRatePct ?? 18;
  const gstAmount = quotation.gstAmount ?? Math.round(subtotal * 0.18);
  const grandTotal = quotation.finalCost ?? quotation.grandTotal ?? (subtotal + gstAmount);

  const lines = [
    'ITEM NO,CATEGORY,DESCRIPTION,SPECIFICATION / FINISH,QUANTITY,UNIT,UNIT RATE (INR),TOTAL (INR)',
    // 1. Surfaces
    `1,FLOOR TILING,"${floorTile.name} (includes 10% cutting wastage)","${floorTile.type.toUpperCase()} | ${floorTile.tileSizeInches.width}x${floorTile.tileSizeInches.height} in",${floorSqFtWithWastage},SQ.FT,Rs.${floorTile.ratePerSqFt},Rs.${floorCost}`,
    `2,WALL TILING,"${wallTile.name} (includes 10% cutting wastage)","${wallTile.type.toUpperCase()} | Net Area: ${measurements.netWallArea} sq.ft",${wallSqFtWithWastage},SQ.FT,Rs.${wallTile.ratePerSqFt},Rs.${wallCost}`,
    // 2. Civil Materials
    `3,CONSUMABLES,"Epoxy Tile Joint Grout (Waterproof Anti-Fungal)","High-traffic polymer grout",${totalGroutKg},KG,Rs.140,Rs.${totalGroutKg * 140}`,
    `4,CONSUMABLES,"Polymer-Modified Tile Adhesive (Type 2)","20kg Heavy Duty Adhesive Bag",${totalAdhesiveBags},BAGS,Rs.520,Rs.${totalAdhesiveBags * 520}`,
    `5,WATERPROOFING,"Dual-Layer Elastomeric Waterproofing Membrane","Dry zone & wet shower envelope",${waterproofingRolls},ROLLS,Rs.3200,Rs.${waterproofingRolls * 3200}`,
    // 3. Fixtures
    ...products.map((p, idx) => {
      return `${idx + 6},SANITARY / FIXTURE,"${p.name}","Brand: ${p.brand || 'Verre Studio'} | Finish: ${p.finish} | ${p.width}'x${p.depth}'",1,NOS,Rs.${p.price},Rs.${p.price}`;
    }),
    // 4. Labor & Services
    `${products.length + 6},INSTALLATION & LABOUR,"Tile Laying, Sanitary Plumbing & Fixture Mounting","Qualified plumber and master mason team",1,JOB,Rs.${labourCost},Rs.${labourCost}`,
    `${products.length + 7},PLUMBING & ELECTRICAL,"Rough-in concealed piping & electrical conduits","12% rough-in standard",1,JOB,Rs.${plumbingCost},Rs.${plumbingCost}`,
    // Totals
    ',,,,,,,',
    `,,,,SUBTOTAL BEFORE TAX,,,Rs.${subtotal}`,
    `,,,,GST (${gstRate}%),,,Rs.${gstAmount}`,
    `,,,,GRAND TOTAL INVESTMENT,,,Rs.${grandTotal}`
  ];

  return lines.join('\n');
}

/**
 * Triggers instant browser download of a file buffer.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
