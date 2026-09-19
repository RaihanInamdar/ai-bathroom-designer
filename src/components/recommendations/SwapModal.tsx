import React from 'react';
import { PlacedProduct, Product } from '../../types';
import { CATALOG_PRODUCTS } from '../../data/products';
import { X, Check, Star } from 'lucide-react';

interface SwapModalProps {
  currentProduct: PlacedProduct | null;
  onClose: () => void;
  onSwap: (newProduct: Product) => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  currentProduct,
  onClose,
  onSwap
}) => {
  if (!currentProduct) return null;

  const alternatives = CATALOG_PRODUCTS.filter(
    (p) => p.category === currentProduct.category || 
          (currentProduct.category === 'smart_toilet' && p.category === 'toilet') ||
          (currentProduct.category === 'toilet' && p.category === 'smart_toilet')
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-luxury max-w-2xl w-full rounded-3xl p-6 border border-gold-500/30 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
              Alternate Fixture Models
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Swap {currentProduct.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List with Photos */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {alternatives.map((alt) => {
            const isCurrent = alt.id === currentProduct.id;
            const priceDiff = alt.price - currentProduct.price;

            return (
              <div
                key={alt.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/60'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {alt.imageUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src={alt.imageUrl} alt={alt.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{alt.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500 text-white shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{alt.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-mono">
                      <span>{alt.width}' × {alt.depth}' × {alt.height}'</span>
                      <span>•</span>
                      <span className="text-amber-500 flex items-center gap-1 font-sans font-semibold">
                        <Star className="w-3 h-3 fill-amber-500" /> {alt.rating}★
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{alt.finish}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 block">
                      ₹{alt.price.toLocaleString('en-IN')}
                    </span>
                    {!isCurrent && (
                      <span className={`text-[11px] font-mono font-semibold ${
                        priceDiff > 0 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {priceDiff > 0 ? `+₹${priceDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(priceDiff).toLocaleString('en-IN')}`}
                      </span>
                    )}
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => onSwap(alt)}
                      className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 text-xs font-bold transition-all shadow-md"
                    >
                      Select Model
                    </button>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
