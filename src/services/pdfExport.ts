import jsPDF from 'jspdf';
import { RecommendationBundle, RoomConfig } from '../types';
import { SurfaceFinishes } from '../components/planner3d/MaterialFactory';
import { calculateQuotation } from './quotation';

export function generateQuotationPDF(
  bundle: RecommendationBundle,
  room: RoomConfig,
  clientName: string = 'Valued Customer',
  finishes?: SurfaceFinishes,
  quotationRef?: string
) {
  const quotation = calculateQuotation(bundle, room, finishes);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Brand Name & Title
  doc.setTextColor(212, 175, 55); // Gold
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('VERRE STUDIO AI', 20, 18);

  doc.setTextColor(240, 240, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const ref = quotationRef || `VS-${String(Math.abs(`${room.length}x${room.width}-${bundle.bundleType}`.split('').reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7)) % 900000 + 100000).slice(0, 6)}`;
  doc.text('Concept Bathroom Specification & Estimate', 20, 26);
  doc.text(`Ref: #${ref} | Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 32);

  y = 52;

  // Project / Room Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, pageWidth - 40, 30, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT OVERVIEW', 25, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Client Name: ${clientName}`, 25, y + 15);
  doc.text(`Bathroom Dimensions: ${room.length} ft (L) × ${room.width} ft (W) × ${room.height} ft (H)`, 25, y + 21);
  doc.text(`Total Floor Area: ${room.length * room.width} sq.ft`, 25, y + 26);

  doc.text(`Package Tier: ${bundle.title}`, 110, y + 15);
  doc.text(`Total Investment: Rs. ${quotation.grandTotal.toLocaleString('en-IN')}`, 110, y + 21);
  doc.text(`Design Style: ${bundle.products[0]?.styles[0]?.replace('_', ' ').toUpperCase() || 'MODERN'}`, 110, y + 26);

  y += 38;

  // Product Table Header
  doc.setFillColor(92, 134, 117); // Brand green
  doc.rect(20, y, pageWidth - 40, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM / MODEL', 24, y + 5.5);
  doc.text('CATEGORY', 80, y + 5.5);
  doc.text('DIMENSIONS (W×D)', 115, y + 5.5);
  doc.text('FINISH', 150, y + 5.5);
  doc.text('PRICE (INR)', 175, y + 5.5);

  y += 9;

  // Product Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  bundle.products.forEach((p, idx) => {
    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 1, pageWidth - 40, 10, 'F');
    }

    doc.setTextColor(15, 23, 42);
    // Truncate long name if necessary
    const displayName = p.name.length > 28 ? p.name.substring(0, 26) + '...' : p.name;
    doc.text(displayName, 24, y + 5);

    doc.setTextColor(71, 85, 105);
    doc.text(p.category.replace('_', ' ').toUpperCase(), 80, y + 5);
    doc.text(`${p.width}' × ${p.depth}'`, 115, y + 5);

    const finishText = p.finish.length > 12 ? p.finish.substring(0, 10) + '..' : p.finish;
    doc.text(finishText, 150, y + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${p.price.toLocaleString('en-IN')}`, 175, y + 5);
    doc.setFont('helvetica', 'normal');

    y += 10;
  });

  y += 5;

  // Project Cost Breakdown
  const breakdownRows = [
    ['Fixture subtotal', `${bundle.products.length} selected products`, quotation.fixtureSubtotal],
    [`Floor: ${quotation.floorFinishName}`, `${quotation.floorArea} sq.ft + 10% @ Rs. ${quotation.floorRatePerSqFt}/sq.ft`, quotation.floorMaterialCost],
    [`Walls: ${quotation.wallFinishName}`, `${quotation.wallArea} sq.ft + 10% @ Rs. ${quotation.wallRatePerSqFt}/sq.ft`, quotation.wallMaterialCost],
    ['Installation labour', 'Tile laying, cladding and fixture placement', quotation.installationCost],
    ['Plumbing & electrical', '12% of fixture value for rough-ins and controls', quotation.plumbingElectricalCost],
    ['GST', '18% on project subtotal', quotation.gstAmount],
  ];

  if (y > 205) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT COST BREAKDOWN', 20, y);
  y += 6;

  doc.setFillColor(15, 23, 42);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('COMPONENT', 24, y + 5.5);
  doc.text('BASIS', 82, y + 5.5);
  doc.text('AMOUNT (INR)', 165, y + 5.5);
  y += 9;

  breakdownRows.forEach(([label, basis, amount], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 1, pageWidth - 40, 9, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(String(label).substring(0, 30), 24, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(String(basis).substring(0, 44), 82, y + 5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(amount).toLocaleString('en-IN')}`, 165, y + 5);
    y += 9;
  });

  y += 5;

  // Total Summary Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(120, y, pageWidth - 140, 32, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal before GST:', 125, y + 8);
  doc.text(`Rs. ${quotation.subtotalBeforeTax.toLocaleString('en-IN')}`, 175, y + 8);

  doc.text('GST / Tax (18%):', 125, y + 15);
  doc.text(`Rs. ${quotation.gstAmount.toLocaleString('en-IN')}`, 175, y + 15);

  doc.setDrawColor(203, 213, 225);
  doc.line(125, y + 19, pageWidth - 25, y + 19);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(92, 134, 117);
  doc.text('GRAND TOTAL:', 125, y + 26);
  doc.text(`Rs. ${quotation.grandTotal.toLocaleString('en-IN')}`, 165, y + 26);

  y += 42;

  // Architectural Notes & Warranty
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ARCHITECTURAL NOTES', 20, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  y += 6;
  doc.text('• Unofficial concept project estimate; confirm product availability and warranty with the retailer.', 20, y);
  y += 5;
  doc.text('• Prices are illustrative and may not match current Verre Studio or dealer pricing.', 20, y);
  y += 5;
  doc.text('• Plumbing rough-ins and clearances are planning estimates, not code-compliance certification.', 20, y);
  y += 5;
  doc.text('• Contractor review is required before procurement or construction.', 20, y);

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 285, pageWidth, 12, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(7.5);
  doc.text('VERRE STUDIO — ARCHITECTURAL BATHROOM DESIGN | Generated with AI Bathroom Studio', pageWidth / 2, 292, { align: 'center' });

  // Save PDF
  doc.save(`Verre_Studio_Quotation_${room.length}x${room.width}_${Date.now()}.pdf`);
}
