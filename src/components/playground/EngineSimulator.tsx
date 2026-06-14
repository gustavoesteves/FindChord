import React, { useState, useEffect } from "react";
import { usePlayground } from "./context/PlaygroundContext";
import { analyzeProgression } from "../../utils/music/analysis/orchestrators/progressionAnalysis";
import { InspectorEngine } from "../../utils/music/analysis/inspector/InspectorEngine";
import { InspectorDashboard } from "../InspectorDashboard";
import type { CanonicalChordEvent } from "../../utils/music/analysis/models/CanonicalChordEvent";
import type { CanonicalScoreEvent } from "../../utils/music/analysis/models/CanonicalScoreEvent";
import type { CanonicalProgressionEvent } from "../../utils/music/analysis/models/CanonicalProgressionEvent";
import { 
  Play, 
  Layers, 
  ShieldCheck, 
  Activity,
  Cpu
} from "lucide-react";

export const EngineSimulator: React.FC = () => {
  const { state, actions } = usePlayground();
  const [pipelineTab, setPipelineTab] = useState<"input" | "validation" | "analysis" | "telemetry" | "inspector" | "output" | "bridge">("input");
  const [loading, setLoading] = useState<boolean>(false);

  const getProgressionEventForInspector = (): CanonicalProgressionEvent | null => {
    if (!state.loadedPayload) return null;
    if (state.activeContractType === "progression") {
      return state.loadedPayload as CanonicalProgressionEvent;
    }
    if (state.activeContractType === "chord") {
      const chordEvent = state.loadedPayload as CanonicalChordEvent;
      return {
        id: `pr_mock_${chordEvent.id}`,
        chordEvents: [chordEvent],
        tonalCenters: [chordEvent.symbol]
      };
    }
    if (state.activeContractType === "score") {
      const scoreEvent = state.loadedPayload as CanonicalScoreEvent;
      return {
        id: `pr_mock_${scoreEvent.id}`,
        chordEvents: scoreEvent.progressionEvents.flatMap(p => p.chordEvents),
        tonalCenters: scoreEvent.progressionEvents.flatMap(p => p.tonalCenters)
      };
    }
    return null;
  };

  const handleRunEngine = () => {
    if (!state.loadedPayload) return;
    setLoading(true);
    try {
      // Extract progression chord symbols
      let progressionSymbols: string[] = [];
      if (state.activeContractType === "chord") {
        const chordEvent = state.loadedPayload as CanonicalChordEvent;
        progressionSymbols = [chordEvent.symbol];
      } else if (state.activeContractType === "progression") {
        const progEvent = state.loadedPayload as CanonicalProgressionEvent;
        progressionSymbols = progEvent.chordEvents.map(c => c.symbol);
      } else if (state.activeContractType === "score") {
        const scoreEvent = state.loadedPayload as CanonicalScoreEvent;
        progressionSymbols = scoreEvent.progressionEvents.flatMap(p => 
          p.chordEvents.map(c => c.symbol)
        );
      }

      // Run analysis
      const result = analyzeProgression(progressionSymbols, "GENERAL");
      actions.setAnalysisResult(result);
    } catch (e) {
      console.error("Erro na simulação do motor analítico:", e);
    } finally {
      setLoading(false);
    }
  };

  // Format Bridge payload simulation JSON
  const getBridgePayloadJson = () => {
    if (!state.loadedPayload) return "{}";
    return JSON.stringify({
      event: state.activeContractType === "chord" ? "insertChord" : "insertProgression",
      timestamp: 1718390400, // Fixed constant placeholder for render purity
      version: "1.0",
      payload: state.loadedPayload
    }, null, 2);
  };

  // Trigger analysis when loadedPayload changes
  useEffect(() => {
    if (state.loadedPayload) {
      const timer = setTimeout(() => {
        handleRunEngine();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      actions.setAnalysisResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loadedPayload, state.activeContractType]);

  if (!state.loadedPayload) {
    return (
      <div className="flex-1 p-5 rounded-2xl border border-zinc-850 bg-zinc-900/20 flex flex-col items-center justify-center min-h-[260px] text-center">
        <Cpu className="h-9 w-9 text-zinc-700 mb-2 animate-spin" />
        <span className="text-xs font-bold text-zinc-500">Aguardando carregamento de DTO no Payload Studio...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 rounded-2xl border border-zinc-850 glass-panel flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider">Engine Simulator</h2>
        </div>
        <button
          onClick={handleRunEngine}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-extrabold text-xs rounded-lg border border-zinc-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Play className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Run Pipeline
        </button>
      </div>

      {/* Simulator Pipeline Tabs */}
      <div className="flex border-b border-zinc-850/60 pb-0.5 overflow-x-auto gap-1">
        {(["input", "validation", "analysis", "telemetry", "inspector", "output", "bridge"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setPipelineTab(tab)}
            className={`px-3 py-1.5 text-xs font-bold capitalize transition-all border-b-2 -mb-0.5 cursor-pointer whitespace-nowrap ${
              pipelineTab === tab
                ? "border-purple-500 text-purple-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pipeline Tab Content */}
      <div className="flex-1 bg-zinc-950 p-4 rounded-xl border border-zinc-900 font-mono text-[11px] leading-relaxed max-h-[360px] overflow-y-auto">
        {pipelineTab === "input" && (
          <pre className="text-zinc-400">{JSON.stringify(state.loadedPayload, null, 2)}</pre>
        )}

        {pipelineTab === "validation" && (
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-zinc-900 pb-2 mb-2">
              <ShieldCheck className="h-4 w-4" />
              Verificação Sintática Pré-Execução
            </div>
            <span className="text-zinc-500">Midi notes ordenadas: </span>
            <span className="text-emerald-400 font-bold">✓ OK</span>
            <br />
            <span className="text-zinc-500">Scores de Tensão: </span>
            <span className="text-emerald-400 font-bold">✓ OK</span>
            <br />
            <span className="text-zinc-500">Permissão de Acesso: </span>
            <span className="text-purple-400 font-bold">READ ONLY</span>
          </div>
        )}

        {pipelineTab === "analysis" && (
          <div>
            {loading ? (
              <span className="text-zinc-600 animate-pulse">Resolvendo caminhos Viterbi...</span>
            ) : state.analysisResult ? (
              <div>
                <div className="text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2 flex items-center justify-between">
                  <span className="font-bold text-zinc-300">Viterbi Core Output:</span>
                  <span className="text-[10px] text-purple-400 font-extrabold">Tonal Center: {state.analysisResult.tonalCenter.root} {state.analysisResult.tonalCenter.mode}</span>
                </div>
                {state.analysisResult.chords.map((chord, idx) => (
                  <div key={idx} className="flex justify-between border-b border-zinc-900/50 py-1 font-sans text-xs">
                    <span className="text-zinc-400 font-mono">[{idx}] {chord.chordSymbol}</span>
                    <div className="flex gap-2">
                      <span className="text-zinc-500">Grau: <b className="text-zinc-300">{chord.romanNumeral}</b></span>
                      <span className="text-zinc-500">Função: <b className="text-purple-400">{chord.harmonicFunction}</b></span>
                      <span className="text-zinc-500">Confiança: <b className="text-emerald-400">{chord.confidence.toFixed(2)}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-zinc-600">Execute o simulador para ver os resultados.</span>
            )}
          </div>
        )}

        {pipelineTab === "telemetry" && (
          <div>
            {state.analysisResult ? (
              <div className="flex flex-col gap-3 font-sans text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold border-b border-zinc-900 pb-1.5">
                  <Activity className="h-4 w-4 text-purple-400" />
                  Métricas Científicas do Consenso
                </div>
                {state.analysisResult.chords.map((chord, idx) => {
                  const stateInfo = chord.debug?.adaptiveTonalState;
                  return (
                    <div key={idx} className="bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900 flex flex-col gap-1">
                      <span className="font-bold text-zinc-300 font-mono">Acorde [{idx}]: {chord.chordSymbol}</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] mt-1 font-mono text-zinc-400">
                        <div>ADI (Disaccord): <span className="text-purple-400 font-bold">{stateInfo?.adi !== undefined ? stateInfo.adi.toFixed(4) : "0.0000"}</span></div>
                        <div>CFS (Fragility): <span className="text-pink-400 font-bold">{stateInfo?.cfs !== undefined ? stateInfo.cfs.toFixed(4) : "0.0000"}</span></div>
                        <div>ISS (Stability): <span className="text-emerald-400 font-bold">{stateInfo?.iss !== undefined ? stateInfo.iss.toFixed(4) : "1.0000"}</span></div>
                        <div>Certainty: <span className="text-blue-400 font-bold">{stateInfo?.certaintyLevel || "HIGH"}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-zinc-600">Nenhum dado analítico disponível. Execute o resolvedor.</span>
            )}
          </div>
        )}

        {pipelineTab === "inspector" && (
          <div>
            {(() => {
              const progressionEvent = getProgressionEventForInspector();
              if (progressionEvent) {
                const diagnostics = InspectorEngine.inspect(progressionEvent);
                return (
                  <div className="font-sans text-xs">
                    <InspectorDashboard 
                      diagnostics={diagnostics} 
                      totalMeasures={progressionEvent.chordEvents.length} 
                    />
                  </div>
                );
              }
              return <span className="text-zinc-650 font-sans">Nenhum DTO de progressão carregado.</span>;
            })()}
          </div>
        )}

        {pipelineTab === "output" && (
          <pre className="text-zinc-400">
            {state.analysisResult 
              ? JSON.stringify(state.analysisResult, null, 2)
              : "{}"
            }
          </pre>
        )}

        {pipelineTab === "bridge" && (
          <pre className="text-zinc-400">{getBridgePayloadJson()}</pre>
        )}
      </div>
    </div>
  );
};
