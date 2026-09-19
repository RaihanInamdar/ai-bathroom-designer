import React, { useState, useRef } from 'react';
import { Upload, Camera, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { processUploadedImage, ProcessedImage } from './UploadAPI';

interface UploadImageProps {
  onImageSelected: (processed: ProcessedImage) => void;
  isAnalyzing?: boolean;
}

const SAMPLE_BATHROOMS = [
  {
    name: 'Compact 8x6 Powder Room',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    dimensions: '8ft x 6ft'
  },
  {
    name: 'Modern Walk-in Suite',
    url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
    dimensions: '10ft x 7ft'
  },
  {
    name: 'Master Spa Wet Room',
    url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
    dimensions: '12ft x 8ft'
  }
];

export const UploadImage: React.FC<UploadImageProps> = ({
  onImageSelected,
  isAnalyzing = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image (JPEG, PNG, WEBP).');
      return;
    }
    setError(null);
    setFileName(file.name);
    try {
      const processed = await processUploadedImage(file);
      setSelectedPreview(processed.base64);
      onImageSelected(processed);
    } catch (err: any) {
      setError(err.message || 'Error processing image');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = async (url: string, name: string) => {
    setError(null);
    setSelectedPreview(url);
    setFileName(name);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      const processed = await processUploadedImage(file);
      onImageSelected(processed);
    } catch (err) {
      // Fallback with synthetic base64 image
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '24px sans-serif';
        ctx.fillText(name, 50, 300);
      }
      const syntheticBase64 = canvas.toDataURL('image/jpeg');
      setSelectedPreview(syntheticBase64);
      onImageSelected({
        file: new File([], name),
        base64: syntheticBase64,
        width: 800,
        height: 600,
        aspectRatio: 1.33
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px] ${
          dragOver 
            ? 'border-gold-500 bg-gold-500/10 scale-[1.01]' 
            : selectedPreview 
              ? 'border-emerald-500/50 bg-slate-900/40' 
              : 'border-slate-300 dark:border-slate-700 hover:border-gold-500/60 bg-white/40 dark:bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {selectedPreview ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-40 h-28 rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
              <img src={selectedPreview} alt="Bathroom preview" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 p-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{fileName || 'Photo Uploaded'}</p>
              <p className="text-[11px] text-slate-500">Click or drag a new image to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500 shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Upload Existing Bathroom Photo
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                AI will scan room dimensions, detect wall & floor tiles, and locate doors, windows, and existing fixtures.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full">
              <Camera className="w-3.5 h-3.5" />
              <span>Supports JPEG, PNG, WEBP up to 25MB</span>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 z-10">
            <Sparkles className="w-8 h-8 text-gold-500 animate-spin" />
            <p className="text-xs font-bold text-slate-200 animate-pulse">
              AI Vision analyzing geometry, surfaces & plumbing...
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Try Sample Bathrooms */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Or try sample bathroom photo:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_BATHROOMS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => handleSampleClick(sample.url, sample.name)}
              className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-gold-500 transition-all text-left group"
            >
              <img src={sample.url} alt={sample.name} className="w-12 h-12 rounded-xl object-cover" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-gold-500 transition-colors">
                  {sample.name}
                </p>
                <p className="text-[10px] font-mono text-slate-500">{sample.dimensions}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
