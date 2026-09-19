import React, { useState } from 'react';
import { RecommendationBundle, RoomConfig } from '../../types';
import { generateQuotationPDF } from '../../services/pdfExport';
import { SurfaceFinishes } from '../planner3d/MaterialFactory';
import { calculateQuotation } from '../../services/quotation';
import { generateBlueprintSVG, generateBOQCSV, downloadFile } from '../../services/blueprintExport';
import { 
  X, 
  Download, 
  ShieldCheck, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuotationModalProps {
  bundle: RecommendationBundle;
  room: RoomConfig;
  finishes: SurfaceFinishes;
  onClose: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  bundle,
  room,
  finishes,
  onClose
}) => {
  const [clientName, setClientName] = useState('Valued Customer');
  const [copied, setCopied] = useState(false);
  const quotation = calculateQuotation(bundle, room, finishes);
  const [quotationRef] = useState(() => {
    const source = `${room.length}x${room.width}-${bundle.bundleType}-${bundle.products.map((p) => p.id).join('|')}`;
    let hash = 0;
    for (let index = 0; index < source.length; index++) {
      hash = (hash * 31 + source.charCodeAt(index)) % 900000;
    }
    return `KAS-${String(100000 + hash).slice(0, 6)}`;
  });

  const handleDownloadPDF = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    generateQuotationPDF(bundle, room, clientName, finishes, quotationRef);
  };

  const handleDownloadBlueprintSVG = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    const svg = generateBlueprintSVG(room, bundle.products, clientName);
    downloadFile(svg, `Kohler_CAD_Blueprint_${room.length}x${room.width}_${Date.now()}.svg`, 'image/svg+xml');
  };

  const handleDownloadBOQCSV = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    const csv = generateBOQCSV(room, bundle.products, finishes, quotation);
    downloadFile(csv, `Kohler_Contractor_BOQ_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleCopySummary = () => {
    const text = `KOHLER AI BATHROOM DESIGN SPECIFICATION\nRoom: ${room.length}x${room.width} ft\nTotal Investment: ₹${quotation.grandTotal.toLocaleString('en-IN')}\nFixtures:\n` +
      bundle.products.map(p => `- ${p.name} (₹${p.price.toLocaleString('en-IN')})`).join('\n') +
      `\nSurface Finishes:\n- Floor: ${quotation.floorFinishName} (₹${quotation.floorMaterialCost.toLocaleString('en-IN')})\n- Walls: ${quotation.wallFinishName} (₹${quotation.wallMaterialCost.toLocaleString('en-IN')})\nLabour & Services: ₹${(quotation.installationCost + quotation.plumbingElectricalCost).toLocaleString('en-IN')}\nGST: ₹${quotation.gstAmount.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-luxury max-w-3xl w-full rounded-3xl p-6 lg:p-8 border border-gold-500/30 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold-400 font-mono tracking-wider uppercase">
                Concept Specification
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Ref #{quotationRef}</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-100 mt-1">
              Architectural Quotation & Bill of Materials
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
          {/* Client & Room Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Client / Project Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-gold-500"
                placeholder="Enter client or project name"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Room Size</span>
                <strong className="text-slate-100 font-mono">{room.length}' × {room.width}' ({quotation.floorArea} sq.ft)</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Package Tier</span>
                <strong className="text-gold-400">{bundle.title.split(' ')[0]}</strong>
              </div>
            </div>
          </div>

          {/* Table of Fixtures */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item & Description</th>
                  <th className="py-3 px-3">Dimensions</th>
                  <th className="py-3 px-3">Finish</th>
                  <th className="py-3 px-4 text-right">Price (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {bundle.products.map((p) => (
                  <tr key={p.instanceId} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4">
                      <strong className="text-slate-200 block">{p.name}</strong>
                      <span className="text-[11px] text-slate-400 capitalize">{p.category.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{p.width}' × {p.depth}'</td>
                    <td className="py-3 px-3 text-slate-400">{p.finish}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                      ₹{p.price.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Project Cost Component</th>
                  <th className="py-3 px-3">Basis</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                <tr>
                  <td className="py-3 px-4 text-slate-200 font-semibold">Fixture Subtotal</td>
                  <td className="py-3 px-3 text-slate-400">{bundle.products.length} selected products</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">₹{quotation.fixtureSubtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-200 font-semibold">Floor Finish: {quotation.floorFinishName}</td>
                  <td className="py-3 px-3 text-slate-400">{quotation.floorArea} sq.ft + 10% wastage @ ₹{quotation.floorRatePerSqFt}/sq.ft</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">₹{quotation.floorMaterialCost.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-200 font-semibold">Wall Finish: {quotation.wallFinishName}</td>
                  <td className="py-3 px-3 text-slate-400">{quotation.wallArea} sq.ft + 10% wastage @ ₹{quotation.wallRatePerSqFt}/sq.ft</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">₹{quotation.wallMaterialCost.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-200 font-semibold">Installation Labour</td>
                  <td className="py-3 px-3 text-slate-400">Tile laying, cladding, fixture placement</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">₹{quotation.installationCost.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-200 font-semibold">Plumbing & Electrical</td>
                  <td className="py-3 px-3 text-slate-400">12% of fixture value for rough-in and smart controls</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">₹{quotation.plumbingElectricalCost.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-200 font-semibold">GST</td>
                  <td className="py-3 px-3 text-slate-400">18% on project subtotal</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">₹{quotation.gstAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total Breakdown */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Unofficial concept project estimate</span>
                <span className="text-[11px] text-slate-400">Uses Kohler-style names/pricing for design demonstration only</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Grand Total (Incl. 18% GST):</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ₹{quotation.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-800 flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleDownloadBlueprintSVG}
              title="Download 2D CAD SVG with plumbing rough-in dimensions"
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1.5 transition-colors border border-sky-500/30 shadow-sm"
            >
              <Compass className="w-4 h-4" />
              CAD Blueprint (SVG)
            </button>

            <button
              onClick={handleDownloadBOQCSV}
              title="Export contractor Bill of Quantities with 10% wastage buffer"
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/30 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Contractor BOQ (CSV)
            </button>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-glow-gold transition-all"
          >
            <Download className="w-4 h-4" />
            PDF Estimate
          </button>
        </div>
      </div>
    </div>
  );
};
