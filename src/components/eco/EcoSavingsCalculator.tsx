import React, { useState } from 'react';
import { RecommendationBundle } from '../../types';
import { 
  Droplets, 
  Zap, 
  Award, 
  Leaf, 
  Users, 
  IndianRupee
} from 'lucide-react';

interface EcoSavingsCalculatorProps {
  bundle: RecommendationBundle;
}

export const EcoSavingsCalculator: React.FC<EcoSavingsCalculatorProps> = ({ bundle }) => {
  const [householdMembers, setHouseholdMembers] = useState(4);

  // Math Calculations:
  // 1. Toilet savings: 13L standard - 3.8L Verre Studio dual flush = 9.2L saved per flush.
  // 4 flushes/person/day * 9.2L * 365 days * householdMembers
  const toiletSavingsLiters = Math.round(householdMembers * 4 * 9.2 * 365);

  // 2. Faucet savings: 2.2 gpm vs 1.2 gpm laminar stream = ~12L saved/person/day
  const faucetSavingsLiters = Math.round(householdMembers * 12 * 365);

  // 3. Shower savings: Katalyst air induction (30% water reduction) = ~16L saved/person/day
  const showerSavingsLiters = Math.round(householdMembers * 16 * 365);

  const totalWaterSavedLiters = toiletSavingsLiters + faucetSavingsLiters + showerSavingsLiters;
  
  const waterTariffInrPerLiter = 0.02;
  const heatedWaterEnergyInrPerLiter = 0.08;
  const annualBillSavings = Math.round(
    toiletSavingsLiters * waterTariffInrPerLiter +
    (faucetSavingsLiters + showerSavingsLiters) * (waterTariffInrPerLiter + heatedWaterEnergyInrPerLiter)
  );
  const tenYearSavings = annualBillSavings * 10;

  // Carbon CO2 offset: ~0.003 kg CO2 per liter saved from pumping & water heating
  const co2SavedKg = Math.round(totalWaterSavedLiters * 0.003);

  // Payback period
  const paybackYears = annualBillSavings > 0 ? (bundle.totalCost / annualBillSavings).toFixed(1) : 'N/A';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-500/30">
                ECO-SMART ESG MATRIX
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Green Building & Utility ROI Calculator</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <Leaf className="w-6 h-6 text-emerald-500" />
              Sustainability & Resource Savings
            </h2>
          </div>

          {/* Household Size Stepper */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Household Size:</span>
            <div className="flex items-center gap-1.5">
              {[2, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  onClick={() => setHouseholdMembers(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    householdMembers === num
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Impact Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Annual Water Saved */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Annual Water Saved
              </span>
              <Droplets className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                {totalWaterSavedLiters.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                Liters / Year (~{Math.round(totalWaterSavedLiters / 1000)} tankers)
              </span>
            </div>
          </div>

          {/* Card 2: Annual Utility Bill Savings */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Utility Bill Savings
              </span>
              <IndianRupee className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{annualBillSavings.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                Per Year (₹{tenYearSavings.toLocaleString('en-IN')} in 10 yrs)
              </span>
            </div>
          </div>

          {/* Card 3: Carbon Offset */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-5 rounded-2xl border border-purple-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                CO2 Footprint Offset
              </span>
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                {co2SavedKg} kg
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                CO2e heating energy eliminated
              </span>
            </div>
          </div>

          {/* Card 4: Green LEED Rating */}
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-5 rounded-2xl border border-amber-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Green Building Rating
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold font-sans text-amber-600 dark:text-amber-400">
                Lower-Flow Spec
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                Certification not claimed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 px-1">
        Utility savings use ₹{waterTariffInrPerLiter.toFixed(2)}/L for water and add ₹{heatedWaterEnergyInrPerLiter.toFixed(2)}/L heating energy only to faucet and shower savings. Estimated simple payback: {paybackYears} years.
      </div>

      {/* Breakdown by Fixture Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toilet Savings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🚽</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dual-Flush Smart Commode</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Consumes only 3.8L per Class Five flush compared to dated 13L single-flush gravity tanks.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Saves: </span>
            <strong className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">
              {toiletSavingsLiters.toLocaleString('en-IN')} Liters/yr
            </strong>
          </div>
        </div>

        {/* Faucet Savings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🚰</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Aerated Laminar Basin Mixer</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Air-induction micro-nozzles create full voluminous water pressure at 1.2 gpm flow rate.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Saves: </span>
            <strong className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">
              {faucetSavingsLiters.toLocaleString('en-IN')} Liters/yr
            </strong>
          </div>
        </div>

        {/* Shower Savings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🚿</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Katalyst Rainhead Induction</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Infuses 2 liters of air per minute directly into the water stream for rich tropical droplets.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Saves: </span>
            <strong className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">
              {showerSavingsLiters.toLocaleString('en-IN')} Liters/yr
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
