import { useState, useMemo, useEffect } from "react";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { useProjectionController } from "../../hooks/useProjectionController";
import type { MelodicAnchor } from "../../utils/music/analysis/models/ProjectionSet";
import { StandardLayout } from "../ui/StandardLayout";
import { Music2 } from "lucide-react";
import { musescoreAdapter, type ConnectionStatus } from "../../utils/musescoreAdapter";
import type { ScoreSection } from "../../utils/music/analysis/models/ScoreSnapshot";

import { useChordStore } from "../../store/useChordStore";
import { ArrowRight } from "lucide-react";

interface HarmonicSpaceExplorerProps {
  onNavigateToBuilder?: () => void;
}

// --- Main Container ---

export default function HarmonicSpaceExplorer({ onNavigateToBuilder }: HarmonicSpaceExplorerProps = {}) {
  const { scoreSnapshot, indexes } = useOntologySessionStore();
  const setProgressionChords = useChordStore(s => s.setProgressionChords);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnStatus(status);
      if (status === "disconnected") setIsSyncing(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await musescoreAdapter.requestScoreSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const sections = indexes?.formalSections || [];
  
  // Set default section if none is selected or if the selected one was deleted
  useEffect(() => {
    if (sections.length > 0) {
      const isValid = sections.some(s => s.id === selectedSectionId);
      if (!selectedSectionId || !isValid) {
        setSelectedSectionId(sections[0].id);
      }
    } else {
      if (selectedSectionId) setSelectedSectionId(null);
    }
  }, [sections, selectedSectionId]);

  const activeSection = sections.find(s => s.id === selectedSectionId);

  const melodyAnchorsData = useMemo<{ anchors: MelodicAnchor[], isTruncated: boolean }>(() => {
    if (!scoreSnapshot?.notes) return { anchors: [], isTruncated: false };
    
    // Sort notes by tickStart
    const sortedNotes = [...scoreSnapshot.notes].sort((a, b) => a.tickStart - b.tickStart);
    
    // Filter notes by selected section
    let relevantNotes = sortedNotes;
    if (activeSection) {
      relevantNotes = sortedNotes.filter(n => {
        const startTick = activeSection.startTick ?? (activeSection.startMeasure - 1) * 1920;
        const endTick = activeSection.endTick ?? activeSection.endMeasure * 1920;
        return n.tickStart >= startTick && n.tickStart < endTick;
      });
    }

    const anchors: MelodicAnchor[] = [];
    relevantNotes.forEach(n => {
      const measureIdx = n.measure || Math.floor(n.tickStart / 1920) + 1; 
      let pc = n.step;
      if (n.alter === 1) pc += "#";
      else if (n.alter === -1) pc += "b";

      anchors.push({
        measureIndex: measureIdx,
        pitch: pc,
        duration: n.durationTicks
      });
    });

    // We limit to 32 anchors to preserve performance.
    const isTruncated = anchors.length > 32;
    return {
      anchors: anchors.slice(0, 32),
      isTruncated
    };
  }, [scoreSnapshot, activeSection]);

  const { proposals, phraseContext } = useProjectionController({ 
    melodyAnchors: melodyAnchorsData.anchors,
    section: (activeSection as unknown as ScoreSection) || null,
    allNotes: scoreSnapshot?.notes || [],
    keySignature: scoreSnapshot?.metadata?.keySignature
  });

  return (
    <StandardLayout
      headerContent={
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-white">Produzir (Rearmonização)</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                Propostas estruturais geradas a partir da melodia.
              </span>
              {phraseContext && (
                <div className="flex flex-col gap-1 ml-4 border-l border-zinc-800 pl-4 text-xs font-mono text-zinc-300">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Contexto Detectado</span>
                  <span>Centro principal: {phraseContext.selectedCenter.tonic} {phraseContext.selectedCenter.mode === "minor" ? "Menor" : "Maior"}</span>
                  {phraseContext.tonalCenterCandidates.length > 1 && (
                    <span>Centro alternativo: {phraseContext.tonalCenterCandidates[1].tonic} {phraseContext.tonalCenterCandidates[1].mode === "minor" ? "Menor" : "Maior"}</span>
                  )}
                  <span className="mt-1">
                    Frase termina em: {phraseContext.cadentialTarget.targetPitch} ({phraseContext.cadentialTarget.cadenceType === "HALF" ? "Meia Cadência" : phraseContext.cadentialTarget.cadenceType})
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={connStatus !== "connected" || isSyncing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition text-[10px] font-black text-zinc-300 uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar Partitura"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-10 animate-fade-in pb-10 max-w-4xl mx-auto w-full">
        
        {/* Sections Selector */}
        {sections.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Music2 className="w-4 h-4" /> Seções
            </span>
            <div className="flex flex-wrap gap-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition border ${
                    selectedSectionId === section.id
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                  }`}
                >
                  {section.label} (Compasso {section.startMeasure} - {section.endMeasure})
                </button>
              ))}
            </div>
          </div>
        )}

        {melodyAnchorsData.isTruncated && (
          <div className="text-amber-500/80 text-xs font-bold bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20 text-center">
            Mostrando apenas as primeiras 32 âncoras melódicas desta seção para otimização de performance.
          </div>
        )}

        {/* Ideas layer */}
        <div className="flex flex-col gap-6">
          {(isExpanded ? proposals : proposals.slice(0, 5)).map((prop) => ( 
            <div key={prop.id} className="flex flex-col gap-3 p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{prop.name}</span>
                  <button
                    onClick={() => {
                      const allChords = prop.measures.flatMap(m => m.chords);
                      setProgressionChords(allChords);
                      if (onNavigateToBuilder) onNavigateToBuilder();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Aplicar em Escrever
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-4 items-start">
                
                <div className="flex-1">
                  
                  {/* Explicit Bass Line (F22.1) */}
                  {prop.bassLine && prop.bassLine.length > 0 && (
                    <div className="mb-3">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Baixo:</span>
                      <span className="text-sm font-mono text-zinc-300">
                        {prop.bassLine.join(" → ")}
                      </span>
                    </div>
                  )}

                  {/* Chords (Measures) */}
                  <div className="flex flex-wrap gap-2 items-center text-sm font-medium">
                    <span className="text-zinc-600 font-light">|</span>
                    {prop.measures.map(m => (
                      <div key={m.measureIndex} className="flex gap-2 items-center">
                        {m.chords.map((chord, i) => (
                          <span key={i} className="text-white bg-zinc-800 px-2 py-1 rounded">
                            {chord}
                          </span>
                        ))}
                        <span className="text-zinc-600 font-light">|</span>
                      </div>
                    ))}
                  </div>

                  {/* Motives (F22.1) */}
                  {prop.detectedMotives && prop.detectedMotives.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Por que esta ideia?</span>
                      {prop.detectedMotives.map((motive, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-indigo-300/80">
                          <span className="text-indigo-400">✓</span> {motive}
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {proposals.length > 5 && (
            <div className="w-full py-4 text-center">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition cursor-pointer"
              >
                {isExpanded ? "Mostrar Menos" : `Mostrar Mais Ideias (+${proposals.length - 5})`}
              </button>
            </div>
          )}

          {proposals.length === 0 && melodyAnchorsData.anchors.length > 0 && (
            <div className="text-zinc-500 text-sm italic py-10 text-center">
              Avaliando possibilidades estruturais...
            </div>
          )}
          {melodyAnchorsData.anchors.length === 0 && (
             <div className="text-zinc-500 text-sm italic py-10 text-center">
             Selecione uma seção ou sincronize a partitura para começar.
           </div>
          )}
        </div>

      </div>
    </StandardLayout>
  );
}
