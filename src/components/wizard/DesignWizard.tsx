import React, { useState } from 'react';
import { RoomConfig, DesignStyle, ImageAnalysisResult } from '../../types';
import { PRESET_ROOMS, PresetRoomOption } from '../../data/presetRooms';
import { analyzeImageAPI } from '../../services/api';
import { 
  Sparkles, 
  Ruler, 
  Palette, 
  UploadCloud, 
  Check, 
  ArrowRight, 
  Scan, 
  CheckCircle2, 
  Sliders, 
  Wand2, 
  Image as ImageIcon
} from 'lucide-react';

interface DesignWizardProps {
  room: RoomConfig;
  budget: number;
  style: DesignStyle;
  onUpdateRoom: (room: RoomConfig) => void;
  onUpdateBudget: (budget: number) => void;
  onUpdateStyle: (style: DesignStyle) => void;
  onImageAnalyzed?: (result: ImageAnalysisResult) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SAMPLE_BATHROOM_PHOTOS = [
  {
    id: 'sample-zen',
    title: 'Japanese Zen Spa Suite',
    subtitle: 'Hinoki wood & stone rough-in',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
    style: 'japanese_zen' as DesignStyle,
    length: 10.0,
    width: 8.0,
    budget: 180000
  },
  {
    id: 'sample-modern',
    title: 'Minimalist Matte Black Ensuite',
    subtitle: 'Floating vanity & rain shower',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    style: 'minimalist_modern' as DesignStyle,
    length: 8.0,
    width: 6.0,
    budget: 100000
  },
  {
    id: 'sample-luxury',
    title: 'Calacatta Gold Master Bath',
    subtitle: 'Freestanding soaking tub & brass',
    url: 'https://images.unsplash.com/photo-1584622781867-1c5e6270034a?auto=format&fit=crop&w=800&q=80',
    style: 'classic_luxury' as DesignStyle,
    length: 12.0,
    width: 10.0,
    budget: 280000
  },
  {
    id: 'sample-compact',
    title: 'Compact City Powder Room',
    subtitle: 'Space-saving 2-piece layout',
    url: 'https://images.unsplash.com/photo-1564540574859-0dfb63985953?auto=format&fit=crop&w=800&q=80',
    style: 'contemporary' as DesignStyle,
    length: 6.0,
    width: 5.0,
    budget: 65000
  }
];

export const DesignWizard: React.FC<DesignWizardProps> = ({
  room,
  budget,
  style,
  onUpdateRoom,
  onUpdateBudget,
  onUpdateStyle,
  onImageAnalyzed,
  onGenerate,
  isGenerating
}) => {
  const [activeTab, setActiveTab] = useState<'dimensions' | 'budget_style' | 'image_scan'>('dimensions');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-standard');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ImageAnalysisResult | null>(null);

  const handleSelectPreset = (preset: PresetRoomOption) => {
    setSelectedPresetId(preset.id);
    onUpdateRoom(preset.config);
    onUpdateBudget(preset.defaultBudget);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      setIsScanning(true);
      try {
        const result = await analyzeImageAPI(base64, room.width);
        setScanResult(result);
        onImageAnalyzed?.(result);
      } catch (err) {
        console.error('Vision analysis error:', err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSamplePhoto = async (sample: typeof SAMPLE_BATHROOM_PHOTOS[0]) => {
    setUploadedImage(sample.url);
    setIsScanning(true);
    try {
      const result = await analyzeImageAPI(sample.url, sample.width);
      setScanResult(result);
      onUpdateRoom({
        ...room,
        length: sample.length,
        width: sample.width
      });
      onUpdateBudget(sample.budget);
      onUpdateStyle(sample.style);
      onImageAnalyzed?.(result);
    } catch (err) {
      console.error('Sample photo scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyScanResult = () => {
    if (!scanResult) return;
    onUpdateRoom({
      ...room,
      length: scanResult.estimatedDimensions.length,
      width: scanResult.estimatedDimensions.width,
      door: {
        wall: scanResult.detectedLayout.doorWall,
        offset: 2.0,
        width: 2.5
      }
    });
    onUpdateStyle(scanResult.aestheticAnalysis.recommendedStyle);
    onImageAnalyzed?.(scanResult);
  };

  const STYLES_LIST: { id: DesignStyle; title: string; subtitle: string; desc: string; colors: string[]; badge: string }[] = [
    {
      id: 'japanese_zen',
      title: 'Japanese Zen',
      subtitle: 'Natural Tranquility & Onsen Flow',
      desc: 'Vertical Hinoki wood slats, natural river stone, soft 2700K ambient illumination, and deep soaking tubs.',
      colors: ['#b45309', '#f5f2eb', '#78350f', '#334155'],
      badge: 'Bestseller'
    },
    {
      id: 'minimalist_modern',
      title: 'Minimalist Modern',
      subtitle: 'Pure Architectural Precision',
      desc: 'Matte black brassware, frameless glass enclosures, floating vanities, and clean monolithic silhouettes.',
      colors: ['#18181b', '#f8fafc', '#94a3b8', '#38bdf8'],
      badge: 'Popular'
    },
    {
      id: 'classic_luxury',
      title: 'Classic Luxury',
      subtitle: 'Victorian Heritage & Calacatta Gold',
      desc: 'Artisanal polished brass fixtures, Italian Carrara marble, fluted console legs, and beveled gilded mirrors.',
      colors: ['#d4af37', '#fcfbf7', '#713f12', '#cbd5e1'],
      badge: 'Heritage'
    },
    {
      id: 'contemporary',
      title: 'Contemporary Urban',
      subtitle: 'Sculptural Geometry & Smart Tech',
      desc: 'Brushed titanium finishes, smart digital shower presets, integrated backlit mirrors, and slate charcoal tiles.',
      colors: ['#334155', '#e2e8f0', '#ca8a04', '#0f172a'],
      badge: 'Smart'
    },
    {
      id: 'premium',
      title: 'Presidential Suite',
      subtitle: 'Ultimate Intelligent Wellness',
      desc: 'Kohler Numi 2.0 intelligent bidet, hydrotherapy multi-zone shower columns, and cast resin stone baths.',
      colors: ['#ca8a04', '#0f172a', '#38bdf8', '#d4af37'],
      badge: 'Top Tier'
    }
  ];

  return (
    <div className="glass-panel-luxury rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-6">
      {/* Wizard Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 text-xs font-bold font-mono border border-gold-500/30">
              STEP 1 OF 3
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">AI Design Specification</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-1">
            Configure Your Bathroom Space
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'dimensions'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            1. Dimensions
          </button>
          <button
            onClick={() => setActiveTab('budget_style')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'budget_style'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            2. Budget & Style
          </button>
          <button
            onClick={() => setActiveTab('image_scan')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'image_scan'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            3. AI Photo Scan
          </button>
        </div>
      </div>

      {/* Tab 1: Dimensions & Presets */}
      {activeTab === 'dimensions' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
              Choose an Architectural Preset or Enter Custom Size
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_ROOMS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPresetId === preset.id && room.length === preset.config.length
                      ? 'bg-white dark:bg-slate-900/90 border-gold-500 shadow-glow-gold'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gold-600 dark:text-gold-400">{preset.dimensions}</span>
                    {selectedPresetId === preset.id && <Check className="w-4 h-4 text-gold-500" />}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 mt-1">{preset.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{preset.idealFor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Dimension Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Room Length (ft)</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{room.length} ft</span>
              </div>
              <input
                type="range"
                min="5"
                max="18"
                step="0.5"
                value={room.length}
                onChange={(e) => onUpdateRoom({ ...room, length: parseFloat(e.target.value) })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Room Width (ft)</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{room.width} ft</span>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={room.width}
                onChange={(e) => onUpdateRoom({ ...room, width: parseFloat(e.target.value) })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ceiling Height (ft)</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{room.height} ft</span>
              </div>
              <input
                type="range"
                min="8"
                max="12"
                step="0.5"
                value={room.height}
                onChange={(e) => onUpdateRoom({ ...room, height: parseFloat(e.target.value) })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Door & Window Positions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                🚪 Entry Door Wall Location
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['south', 'north', 'west', 'east'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateRoom({ ...room, door: { ...room.door, wall: w } })}
                    className={`py-2 text-xs rounded-xl font-semibold capitalize transition-colors ${
                      room.door.wall === w
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {w} Wall
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Usable Footprint</span>
                <span className="text-lg font-bold font-mono text-gold-600 dark:text-gold-400">
                  {room.length * room.width} sq.ft
                </span>
              </div>
              <button
                onClick={() => setActiveTab('budget_style')}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                Next: Budget & Style <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Budget & Style */}
      {activeTab === 'budget_style' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Target Project Budget (INR ₹)
                </label>
                <p className="text-xs text-slate-500">The recommendation engine targets this budget and flags any overage.</p>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-4 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60">
                ₹{budget.toLocaleString('en-IN')}
              </div>
            </div>

            <input
              type="range"
              min="40000"
              max="300000"
              step="5000"
              value={budget}
              onChange={(e) => onUpdateBudget(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer mb-3"
            />

            <div className="flex flex-wrap gap-2">
              {[60000, 100000, 150000, 225000, 300000].map((b) => (
                <button
                  key={b}
                  onClick={() => onUpdateBudget(b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    budget === b
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ₹{(b / 100000).toFixed(1)} Lakh
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
              Select Signature Design Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STYLES_LIST.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onUpdateStyle(item.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    style === item.id
                      ? 'bg-white dark:bg-slate-900/90 border-gold-500 shadow-glow-gold'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                        {item.badge}
                      </span>
                      {style === item.id && <Check className="w-4 h-4 text-gold-500" />}
                    </div>
                    <h4 className="text-base font-bold font-serif text-slate-900 dark:text-slate-100">{item.title}</h4>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium block mt-0.5">{item.subtitle}</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {item.colors.map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shadow-inner" style={{ backgroundColor: c }} />
                    ))}
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">PBR Shaders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Photo Scan with Sample Gallery */}
      {activeTab === 'image_scan' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Sample Real Bathroom Gallery */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 block">
              Try a Sample Bathroom Photo to Test Instant 3D Reconstruction:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_BATHROOM_PHOTOS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSamplePhoto(sample)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    uploadedImage === sample.url
                      ? 'bg-white dark:bg-slate-900 border-gold-500 shadow-glow-gold'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="h-24 rounded-xl overflow-hidden bg-slate-950">
                    <img src={sample.url} alt={sample.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{sample.title}</h5>
                    <span className="text-[10px] text-slate-500 block">{sample.length}' × {sample.width}' • ₹{(sample.budget/100000).toFixed(1)}L</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Box */}
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-gold-500/50 rounded-3xl bg-slate-50 dark:bg-slate-900/40 text-center transition-colors relative overflow-hidden group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />

              {uploadedImage ? (
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={uploadedImage} alt="Uploaded Bathroom" className="w-full h-full object-cover" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Scan className="w-10 h-10 text-gold-400 animate-bounce" />
                      <span className="text-sm font-bold text-slate-200 animate-pulse">
                        Scanning Rough-ins & Spatial Ratios...
                      </span>
                    </div>
                  )}
                  {!isScanning && scanResult && scanResult.detectedElements.map((det) => (
                    <div
                      key={det.id}
                      className="absolute border-2 border-gold-400 bg-gold-400/20 rounded pointer-events-none"
                      style={{
                        left: `${det.boundingBox.x}%`,
                        top: `${det.boundingBox.y}%`,
                        width: `${det.boundingBox.width}%`,
                        height: `${det.boundingBox.height}%`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 text-[10px] font-bold bg-slate-900 text-gold-300 px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        {det.label} ({Math.round(det.confidence * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-gold-500 transition-colors">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Upload Your Own Bathroom Photo</h4>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, HEIC up to 15MB</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    Browse Files
                  </span>
                </div>
              )}
            </div>

            {/* AI Vision Insights Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-5 h-5 text-gold-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Computer Vision Insights</h3>
                </div>

                {scanResult ? (
                  <div className="flex flex-col gap-4 text-xs">
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                      {scanResult.summary}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl">
                        <span className="text-slate-500 block">Estimated Size ({Math.round(scanResult.estimatedDimensions.confidence * 100)}% confidence)</span>
                        <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">
                          {scanResult.estimatedDimensions.length} × {scanResult.estimatedDimensions.width} ft
                        </span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl">
                        <span className="text-slate-500 block">Recommended Theme</span>
                        <span className="text-gold-600 dark:text-gold-400 font-bold capitalize">
                          {scanResult.aestheticAnalysis.recommendedStyle.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-slate-500 block mb-1">Detected Plumbing Rough-ins:</span>
                      <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5">
                        {scanResult.detectedLayout.plumbingLocations.length > 0
                          ? scanResult.detectedLayout.plumbingLocations.map((loc, i) => (
                              <li key={i}>{loc}</li>
                            ))
                          : <li>No rough-ins detected. Manual review required.</li>}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload a real photo or select a sample. If the configured vision service is available, the app will estimate visible fixtures, dimensions, and possible rough-in locations; otherwise it will show a low-confidence manual-review result.
                  </p>
                )}
              </div>

              {scanResult && (
                <button
                  onClick={handleApplyScanResult}
                  className="w-full mt-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply AI Vision Layout & Theme to 3D
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span>Size: </span>
            <strong className="text-slate-900 dark:text-slate-200 font-mono">{room.length}' × {room.width}'</strong>
          </div>
          <div>•</div>
          <div>
            <span>Budget: </span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{budget.toLocaleString('en-IN')}</strong>
          </div>
          <div>•</div>
          <div>
            <span>Style: </span>
            <strong className="text-gold-600 dark:text-gold-400 capitalize">{style.replace('_', ' ')}</strong>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-champagne-400 via-champagne-500 to-amber-600 hover:from-champagne-300 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-glow-champagne hover:scale-105 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Optimizing Spatial Layout & 3D Products...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Generate AI Architectural Suite</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
