import React, { useState } from "react";
import { Info, HelpCircle, Network, ArrowRight } from "lucide-react";
import telemetryMap from "../../../docs/audit/telemetry-consumption-map.json";
import apiRegistry from "../../../docs/audit/api-registry.json";

export const APIInspector: React.FC = () => {
  const [activeInspectorTab, setActiveInspectorTab] = useState<"telemetry" | "routes">("telemetry");

  const telemetryData = telemetryMap.telemetry;
  const apiData = apiRegistry.api;

  return (
    <div className="flex-1 p-5 rounded-2xl border border-zinc-850 glass-panel flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider">API Inspector</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveInspectorTab("telemetry")}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all border ${
              activeInspectorTab === "telemetry"
                ? "bg-purple-950/40 border-purple-550 text-purple-300"
                : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-350"
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveInspectorTab("routes")}
            className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all border ${
              activeInspectorTab === "routes"
                ? "bg-purple-950/40 border-purple-550 text-purple-300"
                : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-350"
            }`}
          >
            Routes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-h-[360px] overflow-y-auto pr-1 flex flex-col gap-3">
        {activeInspectorTab === "telemetry" && (
          <div className="flex flex-col gap-3">
            {Object.entries(telemetryData).map(([key, value]) => (
              <div key={key} className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-850/70 flex flex-col gap-1.5 hover:border-zinc-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-purple-400">{key}</span>
                  <span className="text-[10px] text-zinc-500 italic">Producer: {value.producer}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-300 mt-0.5">{value.name}</h4>
                <p className="text-[11px] text-zinc-400 leading-normal">{value.description}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 border-t border-zinc-850/30 pt-2 text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider">Active Consumers:</span>
                  {value.consumers.length === 0 ? (
                    <span className="text-zinc-600 italic">Nenhum (Placeholder v1)</span>
                  ) : (
                    value.consumers.map((consumer, cIdx) => (
                      <span key={cIdx} className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded font-semibold">{consumer}</span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeInspectorTab === "routes" && (
          <div className="flex flex-col gap-3">
            {Object.entries(apiData.endpoints).map(([route, val]: [string, any]) => (
              <div key={route} className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-850/70 flex flex-col gap-1.5 hover:border-zinc-800 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white font-black text-[9px] rounded uppercase">{val.method}</span>
                  <span className="font-mono text-xs font-bold text-zinc-200">{apiData.prefix}{route}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">{val.description}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 border-t border-zinc-850/30 pt-2 text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider">Bridge Consumers:</span>
                  {val.consumers.map((c: string, cIdx: number) => (
                    <span key={cIdx} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-medium">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
