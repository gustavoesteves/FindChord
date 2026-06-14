import React, { useState, useMemo } from "react";
import type { InspectorDiagnostic, DiagnosticSeverity } from "../utils/music/analysis/models/InspectorDiagnostic";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Activity, 
  Sparkles,
  FilterX
} from "lucide-react";

interface InspectorDashboardProps {
  diagnostics: InspectorDiagnostic[];
  totalMeasures: number;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({ 
  diagnostics = [], 
  totalMeasures = 0 
}) => {
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null);

  // 1. Calcular contadores gerais
  const stats = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;

    diagnostics.forEach(d => {
      if (d.severity === "critical") critical++;
      else if (d.severity === "warning") warning++;
      else if (d.severity === "info") info++;
    });

    const total = critical + warning + info;

    return { critical, warning, info, total };
  }, [diagnostics]);

  // 2. Agrupar severidade mais alta por compasso para colorir a timeline
  const measuresStatus = useMemo(() => {
    const statusMap: Record<number, DiagnosticSeverity | "clean"> = {};
    for (let m = 1; m <= totalMeasures; m++) {
      statusMap[m] = "clean";
    }

    diagnostics.forEach(diag => {
      diag.affectedMeasures.forEach(m => {
        if (m >= 1 && m <= totalMeasures) {
          const current = statusMap[m];
          if (diag.severity === "critical") {
            statusMap[m] = "critical";
          } else if (diag.severity === "warning" && current !== "critical") {
            statusMap[m] = "warning";
          } else if (diag.severity === "info" && current === "clean") {
            statusMap[m] = "info";
          }
        }
      });
    });

    return statusMap;
  }, [diagnostics, totalMeasures]);

  // 3. Filtrar e ordenar alertas de acordo com a seleção de compasso na timeline
  const filteredDiagnostics = useMemo(() => {
    let result = [...diagnostics];
    if (selectedMeasure !== null) {
      result = result.filter(d => d.affectedMeasures.includes(selectedMeasure));
    }
    return result;
  }, [diagnostics, selectedMeasure]);

  const severityBarPercentages = useMemo(() => {
    if (stats.total === 0) return { critical: 0, warning: 0, info: 0 };
    return {
      critical: (stats.critical / stats.total) * 100,
      warning: (stats.warning / stats.total) * 100,
      info: (stats.info / stats.total) * 100
    };
  }, [stats]);

  return (
    <div className="flex flex-col gap-6 text-zinc-100 font-sans">
      
      {/* 1. Visão Geral (Overview Counters) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Críticos */}
        <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 backdrop-blur-md flex items-center justify-between shadow-lg shadow-red-950/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Críticos</span>
            <span className="text-3xl font-extrabold text-red-100">{stats.critical}</span>
          </div>
          <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Card Alertas */}
        <div className="p-4 rounded-xl border border-amber-900/30 bg-amber-950/10 backdrop-blur-md flex items-center justify-between shadow-lg shadow-amber-950/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Alertas</span>
            <span className="text-3xl font-extrabold text-amber-100">{stats.warning}</span>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Card Informativos */}
        <div className="p-4 rounded-xl border border-indigo-900/30 bg-indigo-950/10 backdrop-blur-md flex items-center justify-between shadow-lg shadow-indigo-950/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Informativos</span>
            <span className="text-3xl font-extrabold text-indigo-100">{stats.info}</span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Info className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 2. Barra de Distribuição de Severidade */}
      {stats.total > 0 && (
        <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-zinc-850 bg-zinc-900/20">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <span>Distribuição de Gravidade</span>
            <span>{stats.total} total de diagnósticos</span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950 rounded-full flex overflow-hidden border border-zinc-900">
            {severityBarPercentages.critical > 0 && (
              <div 
                style={{ width: `${severityBarPercentages.critical}%` }} 
                className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-500" 
                title={`Crítico: ${stats.critical}`}
              />
            )}
            {severityBarPercentages.warning > 0 && (
              <div 
                style={{ width: `${severityBarPercentages.warning}%` }} 
                className="bg-gradient-to-r from-amber-500 to-amber-350 h-full transition-all duration-500" 
                title={`Alerta: ${stats.warning}`}
              />
            )}
            {severityBarPercentages.info > 0 && (
              <div 
                style={{ width: `${severityBarPercentages.info}%` }} 
                className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full transition-all duration-500" 
                title={`Info: ${stats.info}`}
              />
            )}
          </div>
        </div>
      )}

      {/* 3. Timeline de Alertas por Compasso */}
      {totalMeasures > 0 && (
        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs uppercase tracking-wider">
              <Activity className="h-4 w-4 text-purple-400" />
              Linha do Tempo Harmônica (Auditada por Compasso)
            </div>
            {selectedMeasure !== null && (
              <button 
                onClick={() => setSelectedMeasure(null)}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-850 hover:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
              >
                <FilterX className="h-3 w-3 text-purple-400" />
                Limpar Filtro (C{selectedMeasure})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 mt-1">
            {Array.from({ length: totalMeasures }).map((_, idx) => {
              const mNum = idx + 1;
              const status = measuresStatus[mNum];
              const isSelected = selectedMeasure === mNum;

              let statusClasses = "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-350";
              if (status === "critical") {
                statusClasses = `border-red-900 bg-red-950/20 text-red-400 hover:bg-red-950/30 ${
                  isSelected ? "ring-2 ring-red-500 scale-105" : ""
                }`;
              } else if (status === "warning") {
                statusClasses = `border-amber-900 bg-amber-950/20 text-amber-400 hover:bg-amber-950/30 ${
                  isSelected ? "ring-2 ring-amber-500 scale-105" : ""
                }`;
              } else if (status === "info") {
                statusClasses = `border-indigo-900 bg-indigo-950/20 text-indigo-400 hover:bg-indigo-950/30 ${
                  isSelected ? "ring-2 ring-indigo-500 scale-105" : ""
                }`;
              } else if (status === "clean") {
                statusClasses = `border-emerald-950 bg-emerald-950/5 text-emerald-400 hover:border-emerald-800 ${
                  isSelected ? "ring-2 ring-emerald-500 scale-105" : ""
                }`;
              }

              return (
                <button
                  key={mNum}
                  onClick={() => setSelectedMeasure(isSelected ? null : mNum)}
                  className={`w-11 h-11 rounded-lg border text-center flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${statusClasses}`}
                  title={`Compasso ${mNum}: ${status.toUpperCase()}`}
                >
                  <span className="text-[10px] font-black uppercase select-none opacity-50">Comp</span>
                  <span className="text-sm font-extrabold leading-none">{mNum}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Diagnostic Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          Feed de Diagnósticos e Linter
        </h3>

        {filteredDiagnostics.length === 0 ? (
          <div className="p-8 rounded-2xl border border-emerald-900/30 bg-emerald-950/5 flex flex-col items-center justify-center text-center shadow-inner">
            <CheckCircle className="h-8 w-8 text-emerald-400 mb-2 animate-bounce" />
            <span className="text-xs font-bold text-emerald-300">Condução Limpa & Consenso Estável</span>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-sm">
              Nenhum problema harmônico ou de condução detectado {selectedMeasure !== null ? `para o compasso ${selectedMeasure}` : ""}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDiagnostics.map((diag) => {
              // Definir cores com base na severidade
              let borderClass = "border-l-4 border-l-indigo-500 bg-indigo-950/10 border-zinc-850";
              let badgeColor = "text-indigo-400 bg-indigo-950/60 border-indigo-900";
              if (diag.severity === "critical") {
                borderClass = "border-l-4 border-l-red-500 bg-red-950/10 border-zinc-850";
                badgeColor = "text-red-400 bg-red-950/60 border-red-900";
              } else if (diag.severity === "warning") {
                borderClass = "border-l-4 border-l-amber-500 bg-amber-950/10 border-zinc-850";
                badgeColor = "text-amber-400 bg-amber-950/60 border-amber-900";
              }

              return (
                <div 
                  key={diag.id} 
                  className={`p-4 rounded-xl border flex flex-col gap-3 hover:brightness-105 transition duration-150 shadow-md ${borderClass}`}
                >
                  {/* Alert Header */}
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
                      <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
                        {diag.source}
                      </span>
                      {diag.confidence !== undefined && (
                        <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-purple-400">
                          conf: {(diag.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alert Description */}
                  <p className="text-xs text-zinc-350 leading-relaxed">{diag.description}</p>

                  {/* Evidence list */}
                  {diag.evidence && diag.evidence.length > 0 && (
                    <div className="flex flex-col gap-1 pl-2.5 border-l border-zinc-800">
                      {diag.evidence.map((ev, evIdx) => (
                        <span key={evIdx} className="text-[10px] text-zinc-400 font-mono">
                          • {ev}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metric Telemetry Fact Card */}
                  {diag.telemetry && (
                    <div className="mt-1 pt-2 border-t border-zinc-900/60 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {diag.telemetry.cfs !== undefined && (
                        <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900/60 flex flex-col font-mono text-[9.5px]">
                          <span className="text-zinc-500 uppercase font-black tracking-widest text-[8px]">CFS Fragility</span>
                          <span className="text-pink-400 font-extrabold mt-0.5">{diag.telemetry.cfs.toFixed(4)}</span>
                        </div>
                      )}
                      {diag.telemetry.adi !== undefined && (
                        <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900/60 flex flex-col font-mono text-[9.5px]">
                          <span className="text-zinc-500 uppercase font-black tracking-widest text-[8px]">ADI Disaccord</span>
                          <span className="text-purple-400 font-extrabold mt-0.5">{diag.telemetry.adi.toFixed(4)}</span>
                        </div>
                      )}
                      {diag.telemetry.iss !== undefined && (
                        <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900/60 flex flex-col font-mono text-[9.5px]">
                          <span className="text-zinc-500 uppercase font-black tracking-widest text-[8px]">ISS Stability</span>
                          <span className="text-emerald-400 font-extrabold mt-0.5">{diag.telemetry.iss.toFixed(4)}</span>
                        </div>
                      )}
                      {diag.telemetry.tas !== undefined && (
                        <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900/60 flex flex-col font-mono text-[9.5px]">
                          <span className="text-zinc-500 uppercase font-black tracking-widest text-[8px]">TAS Adequacy</span>
                          <span className="text-blue-400 font-extrabold mt-0.5">{diag.telemetry.tas.toFixed(4)}</span>
                        </div>
                      )}
                      {diag.telemetry.tfi !== undefined && (
                        <div className="bg-zinc-950/40 p-1.5 rounded border border-zinc-900/60 flex flex-col font-mono text-[9.5px]">
                          <span className="text-zinc-500 uppercase font-black tracking-widest text-[8px]">TFI Frontier</span>
                          <span className="text-amber-500 font-extrabold mt-0.5">{diag.telemetry.tfi.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Affected measure info */}
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                    <span>Compassos afetados: {diag.affectedMeasures.join(", ")}</span>
                    {diag.cadenceType && <span>Cadência: {diag.cadenceType}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
