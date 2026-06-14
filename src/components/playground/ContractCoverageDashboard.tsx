import React from "react";
import { Layers, Bookmark, Trash2 } from "lucide-react";
import contractMap from "../../../docs/audit/contract-consumption-map.json";

export const ContractCoverageDashboard: React.FC = () => {
  const { contracts } = contractMap;

  return (
    <div className="p-5 rounded-2xl border border-zinc-850 glass-panel flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Layers className="h-5 w-5 text-purple-400" />
        <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider">Contract Coverage Dashboard</h2>
      </div>

      {/* Grid of Contracts */}
      <div className="flex flex-col gap-4">
        {Object.entries(contracts).map(([name, data]) => {
          const pct = Math.round((data.consumedFields / data.totalFields) * 100);
          
          return (
            <div key={name} className="p-4 bg-zinc-900/20 border border-zinc-850 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-zinc-200 text-xs uppercase tracking-wide">{name} Event Contract</span>
                <span className="text-xs font-black text-purple-400">{pct}% Active</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850/50">
                <div 
                  className={`h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Specs */}
              <div className="flex justify-between text-[10px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Bookmark className="h-3 w-3 text-emerald-400" />
                  Consumed/Active: {data.consumedFields}
                </span>
                <span className="flex items-center gap-1">
                  <Trash2 className="h-3 w-3 text-purple-400" />
                  Orphan/Deprecated: {data.orphanedFields}
                </span>
                <span>Total Fields: {data.totalFields}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
