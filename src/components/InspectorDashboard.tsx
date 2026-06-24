import React, { useState, useMemo } from "react";
import type { InspectorDiagnostic } from "../utils/music/analysis/models/InspectorDiagnostic";
import { 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  Activity
} from "lucide-react";

interface InspectorDashboardProps {
  diagnostics: InspectorDiagnostic[];
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({ 
  diagnostics = []
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Agrupamento semântico
  const groupedDiagnostics = useMemo(() => {
    const problemas: InspectorDiagnostic[] = [];
    const atencao: InspectorDiagnostic[] = [];
    const oportunidades: InspectorDiagnostic[] = [];

    diagnostics.forEach(d => {
      if (d.severity === "critical" || d.severity === "warning") {
        problemas.push(d);
      } else if (d.severity === "suggestion") {
        oportunidades.push(d);
      } else {
        // info / notice
        atencao.push(d);
      }
    });

    return { problemas, atencao, oportunidades };
  }, [diagnostics]);

  const renderDiagnosticList = (list: InspectorDiagnostic[], type: "problema" | "atencao" | "oportunidade") => {
    if (list.length === 0) return null;

    let groupTitle = "";
    let Icon = Info;
    let groupColor = "";
    
    if (type === "problema") {
      groupTitle = "Problemas";
      Icon = AlertTriangle;
      groupColor = "text-rose-400";
    } else if (type === "atencao") {
      groupTitle = "Pontos de Atenção";
      Icon = Info;
      groupColor = "text-amber-400";
    } else {
      groupTitle = "Oportunidades";
      Icon = Lightbulb;
      groupColor = "text-emerald-400";
    }

    return (
      <div className="flex flex-col gap-3 mb-6">
        <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${groupColor} mb-1`}>
          <Icon className="h-4 w-4" />
          {groupTitle}
        </h4>
        {list.map((diag) => {
          let borderClass = "border-l-4 border-zinc-800/60 bg-zinc-900/40";
          let badgeColor = "text-zinc-400 bg-zinc-950/60 border-zinc-900";
          
          if (diag.severity === "critical") {
            borderClass = "border-l-4 border-l-rose-500 bg-rose-950/10 border-zinc-800";
            badgeColor = "text-rose-400 bg-rose-950/60 border-rose-900";
          } else if (diag.severity === "warning") {
            borderClass = "border-l-4 border-l-amber-500 bg-amber-950/10 border-zinc-800";
            badgeColor = "text-amber-400 bg-amber-950/60 border-amber-900";
          } else if (diag.severity === "suggestion") {
            borderClass = "border-l-4 border-l-emerald-500 bg-emerald-950/10 border-zinc-800";
            badgeColor = "text-emerald-400 bg-emerald-950/60 border-emerald-900";
          } else {
            borderClass = "border-l-4 border-l-indigo-500 bg-indigo-950/10 border-zinc-800";
            badgeColor = "text-indigo-400 bg-indigo-950/60 border-indigo-900";
          }

          const isExpanded = !!expandedIds[diag.id];

          return (
            <div 
              key={diag.id} 
              className={`p-4 rounded-xl border flex flex-col gap-3 transition duration-150 shadow-md ${borderClass}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{diag.category.replace("-", " ")}</span>
                    {diag.subcategory && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-purple-400">{diag.subcategory}</span>
                      </>
                    )}
                  </span>
                  <h4 className="text-sm font-extrabold text-zinc-100">{diag.title}</h4>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className={`px-2 py-0.5 rounded border ${badgeColor}`}>
                    {diag.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-350 leading-relaxed">{diag.description}</p>

              <button
                onClick={() => toggleExpand(diag.id)}
                className="w-fit text-[9px] text-zinc-500 hover:text-purple-400 font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors mt-0.5 select-none"
              >
                <Activity className={`h-3 w-3 ${isExpanded ? "text-purple-400" : ""}`} />
                {isExpanded ? "Ocultar Telemetria" : "Mostrar Telemetria"}
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-3 p-3.5 mt-1 rounded-xl bg-zinc-950/60 border border-zinc-900/60 animate-scale-up">
                  <div className="flex items-center gap-4 text-[9px] font-bold font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 uppercase font-black">Fonte:</span>
                      <span className="px-2 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-zinc-400">
                        {diag.source}
                      </span>
                    </div>
                    {diag.confidence !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 uppercase font-black">Confiança:</span>
                        <span className="px-2 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-purple-400">
                          {(diag.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {diag.evidence && diag.evidence.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Evidências Científicas:</span>
                      <div className="flex flex-col gap-1 pl-2 border-l border-zinc-850">
                        {diag.evidence.map((ev, evIdx) => (
                          <span key={evIdx} className="text-[10px] text-zinc-400 font-mono">
                            • {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col font-sans">
      {diagnostics.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 text-sm italic bg-zinc-900/30 rounded-xl border border-zinc-800/40">
          Nenhuma observação harmônica de destaque neste compasso.
        </div>
      ) : (
        <>
          {renderDiagnosticList(groupedDiagnostics.problemas, "problema")}
          {renderDiagnosticList(groupedDiagnostics.atencao, "atencao")}
          {renderDiagnosticList(groupedDiagnostics.oportunidades, "oportunidade")}
        </>
      )}
    </div>
  );
};
