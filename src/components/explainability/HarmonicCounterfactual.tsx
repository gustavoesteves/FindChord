import React, { useState, useMemo } from 'react';
import type { ExplanationTrace } from "../../utils/music/analysis/explainability/ExplanationTrace";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { HelpCircle, RefreshCw, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";

interface HarmonicCounterfactualProps {
  trace: ExplanationTrace | null;
  chordIndex: number | null;
}

export const HarmonicCounterfactual: React.FC<HarmonicCounterfactualProps> = ({ trace, chordIndex }) => {
  const { scoreSnapshot, activeNode } = useOntologySessionStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hypotheticalChord, setHypotheticalChord] = useState<string>("");
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const suggestions = useMemo(() => {
    if (!activeNode) return [];
    
    const func = activeNode.harmonicFunction;
    const isMajor = !activeNode.chordSymbol.includes("m") && !activeNode.chordSymbol.includes("dim");
    
    if (func === "DOMINANT") {
      return [
        { chord: "Db7", label: "Substituição de Trítono (SubV)", effect: "A resolução ficaria mais cromática, escura e deslizante." },
        { chord: "Bbmaj7", label: "Empréstimo Modal (bVII)", effect: "A tensão dominante desapareceria e surgiria uma cor lírica e suspensiva." }
      ];
    }
    if (func === "SUBDOMINANT") {
      return [
        { chord: isMajor ? "Fm7" : "Abmaj7", label: "Empréstimo Modal", effect: "A preparação ganharia um tom dramático e melancólico." },
        { chord: "D7", label: "Dominante Secundária (V/V)", effect: "A progressão ganharia um impulso direcional forte para o clímax." }
      ];
    }
    if (func === "TONIC") {
      return [
        { chord: "Am7", label: "Substituição Diatônica (vi)", effect: "A frase repousaria em um ambiente mais reflexivo, evitando o encerramento total." },
        { chord: "Ebmaj7", label: "Expansão Modal (bIII)", effect: "O centro tonal sofreria uma expansão grandiosa de cor." }
      ];
    }
    
    // Fallback
    return [
      { chord: "Abmaj7", label: "Empréstimo Modal", effect: "Injetaria uma cor surpreendente e distante do centro original." },
      { chord: "G7sus4", label: "Suspensão", effect: "Adicionaria ambiguidade flutuante à progressão." }
    ];
  }, [activeNode]);

  if (!trace || chordIndex === null || !scoreSnapshot || !activeNode) {
    return null;
  }

  const handleSimulate = () => {
    if (!hypotheticalChord.trim()) return;

    setIsSimulating(true);

    try {
      const baseProgression = scoreSnapshot.harmonies.slice(0, chordIndex + 1).map(h => h.harmony);
      const { getCounterfactualSimulation } = useOntologySessionStore.getState();
      const analysis = getCounterfactualSimulation(baseProgression, hypotheticalChord.trim(), chordIndex);
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
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-amber-500/20 bg-amber-950/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-amber-400" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
            Contrafactual Harmônico ("What If?")
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white bg-zinc-900/60 px-4 py-2 rounded-xl border border-zinc-800">
            {activeNode.chordSymbol}
          </span>
          <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Acorde Atual</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {suggestions.map((sug, i) => (
            <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-amber-900/40 bg-zinc-950/60 hover:bg-zinc-900/80 transition group">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-amber-500/60" />
                <span className="text-xl font-black text-amber-400 group-hover:text-amber-300 transition">{sug.chord}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-zinc-800">{sug.label}</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed pl-6">
                {sug.effect}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800/60 flex flex-col gap-3">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition self-start"
        >
          {showAdvanced ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Testar outro acorde
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-2 mt-2 animate-scale-up">
             <div className="flex items-center gap-2">
              <input
                type="text"
                value={hypotheticalChord}
                onChange={(e) => setHypotheticalChord(e.target.value)}
                placeholder="Ex: C/E"
                className="flex-grow px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
              />
              <button
                onClick={handleSimulate}
                disabled={isSimulating || !hypotheticalChord.trim()}
                className="flex items-center justify-center px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition"
              >
                {isSimulating ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Simular"}
              </button>
            </div>

            {simulationResult && (
              <div className="mt-2 p-3 rounded-lg border border-zinc-800 bg-black/40">
                {simulationResult.success ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">Resultado da Substituição:</span>
                    <p className="text-xs text-zinc-300">
                      A interpretação estrutural original de <strong>{trace.symbol}</strong> mudaria de <span className="line-through text-zinc-500 mx-1">{simulationResult.originalRole}</span> 
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
        )}
      </div>

    </div>
  );
};
