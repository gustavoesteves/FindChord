import React, { useState } from 'react';
import type { ExplanationTrace } from "../../utils/music/analysis/explainability/ExplanationTrace";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { HelpCircle, RefreshCw } from "lucide-react";

interface HarmonicCounterfactualProps {
  trace: ExplanationTrace | null;
  chordIndex: number | null;
}

export const HarmonicCounterfactual: React.FC<HarmonicCounterfactualProps> = ({ trace, chordIndex }) => {
  const { scoreSnapshot } = useOntologySessionStore();
  const [hypotheticalChord, setHypotheticalChord] = useState<string>("");
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!trace || chordIndex === null || !scoreSnapshot) {
    return null;
  }

  const handleSimulate = () => {
    if (!hypotheticalChord.trim()) return;

    setIsSimulating(true);

    try {
      // 1. Extrair a progressão até o acorde selecionado
      const baseProgression = scoreSnapshot.harmonies.slice(0, chordIndex + 1).map(h => h.harmony);
      
      // 2. Pegar a simulação do cache ou computar em modo COUNTERFACTUAL
      const { getCounterfactualSimulation } = useOntologySessionStore.getState();
      const analysis = getCounterfactualSimulation(baseProgression, hypotheticalChord.trim(), chordIndex);
      
      // 3. Pegar a interpretação *do acorde original* neste novo contexto
      // O acorde original está em `chordIndex`.
      const originalChordInNewContext = analysis.chords[chordIndex];
      
      setSimulationResult({
        success: true,
        originalRole: trace.phraseRole,
        newRole: originalChordInNewContext?.semantic?.phraseRole || "UNKNOWN",
        newFunction: originalChordInNewContext?.harmonicFunction || "UNKNOWN"
      });
    } catch (e) {
      setSimulationResult({ success: false, error: "Acorde inválido ou erro na análise." });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-blue-500/20 bg-blue-950/10">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-blue-400" />
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
          Contrafactual Harmônico ("What If?")
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
          O acorde atual <strong>{trace.symbol}</strong> foi interpretado como <strong>{trace.phraseRole}</strong>. 
          O que aconteceria se o <em>próximo</em> acorde fosse diferente?
        </p>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={hypotheticalChord}
            onChange={(e) => setHypotheticalChord(e.target.value)}
            placeholder="Ex: Bbmaj7, C/E"
            className="flex-grow px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
          />
          <button
            onClick={handleSimulate}
            disabled={isSimulating || !hypotheticalChord.trim()}
            className="flex items-center justify-center px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition"
          >
            {isSimulating ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Simular"}
          </button>
        </div>
      </div>

      {simulationResult && (
        <div className="mt-2 p-3 rounded-lg border border-zinc-800 bg-black/40">
          {simulationResult.success ? (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">Resultado:</span>
              <p className="text-xs text-zinc-300">
                Se o próximo acorde fosse <strong className="text-white">{hypotheticalChord}</strong>, a interpretação estrutural de <strong>{trace.symbol}</strong> 
                mudaria de <span className="line-through text-zinc-500 mx-1">{simulationResult.originalRole}</span> 
                para <strong className={simulationResult.newRole !== simulationResult.originalRole ? "text-amber-400" : "text-emerald-400"}>
                  {simulationResult.newRole}
                </strong>.
              </p>
            </div>
          ) : (
            <span className="text-xs text-rose-400 font-medium">{simulationResult.error}</span>
          )}
        </div>
      )}
    </div>
  );
};
