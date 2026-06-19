import React from 'react';
import type { AttractorField } from "../../utils/music/analysis/models/FunctionalAnalysis";
import { Activity } from "lucide-react";

interface AttractorRadarProps {
  field: AttractorField | null;
}

export const AttractorRadar: React.FC<AttractorRadarProps> = ({ field }) => {
  if (!field?.activeAttractors || field.activeAttractors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-zinc-800/50 bg-zinc-900/30 rounded-xl">
        <Activity className="h-5 w-5 text-zinc-600 mb-2" />
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">
          Campo Gravitacional Inativo
        </span>
      </div>
    );
  }

  // Pre-define standard attractors to always show them (even if 0, for context), or just sort active ones.
  // The user requested showing bars for TONAL_RESOLUTION, PROLONGATION, etc.
  
  // Sort vectors by weight descending
  const sortedVectors = [...field.activeAttractors].sort((a, b) => b.weight - a.weight);

  const getBarColor = (type: string) => {
    switch (type) {
      case "TONAL_RESOLUTION": return "bg-emerald-500";
      case "MODAL_GRAVITY": return "bg-amber-500";
      case "PROLONGATION_INERTIA": return "bg-blue-500";
      case "CADENTIAL_DOMINANT": return "bg-red-500";
      case "LOCAL_RESOLUTION": return "bg-purple-500";
      default: return "bg-zinc-500";
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4 text-zinc-400" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Attractor Radar
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {sortedVectors.map((vector, i) => {
          const widthPct = Math.min(100, Math.max(2, vector.weight * 100)); // min 2% so the bar is visible
          const colorClass = getBarColor(vector.type);

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Rótulo */}
              <div className="w-40 flex-shrink-0">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider truncate block">
                  {vector.type}
                </span>
              </div>

              {/* Barra */}
              <div className="flex-grow h-2.5 bg-zinc-800/50 rounded-full overflow-hidden flex items-center">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              {/* Valor Numérico */}
              <div className="w-10 flex-shrink-0 text-right">
                <span className="text-[10px] font-black text-zinc-300">
                  {vector.weight.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
