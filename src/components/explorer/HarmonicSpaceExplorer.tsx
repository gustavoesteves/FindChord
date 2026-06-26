import { useState, useMemo, useEffect } from "react";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { useProjectionController } from "../../hooks/useProjectionController";
import type { MelodicAnchor } from "../../utils/music/analysis/models/ProjectionSet";
import { StandardLayout } from "../ui/StandardLayout";
import { Music2 } from "lucide-react";
import { musescoreAdapter, type ConnectionStatus } from "../../utils/musescoreAdapter";
import type { ScoreHarmonyEvent, ScoreNoteEvent, ScoreSection } from "../../utils/music/analysis/models/ScoreSnapshot";
import type { ReharmonizationProposal } from "../../utils/music/analysis/models/ReharmonizationProposal";
import type { PhraseContext } from "../../utils/music/analysis/engines/PhraseAnalysisEngine";
import { analyzeReferenceHarmony } from "../../utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { generateControlledSubstitutionProposals } from "../../utils/music/analysis/strategies/ControlledSubstitutionProposals";

import { useChordStore } from "../../store/useChordStore";
import { ArrowRight } from "lucide-react";

interface HarmonicSpaceExplorerProps {
  onNavigateToBuilder?: () => void;
}

const EMPTY_NOTES: ScoreNoteEvent[] = [];
const EMPTY_SECTIONS: ScoreSection[] = [];

function chordBass(chord: string): string {
  const slashBass = chord.split("/")[1];
  if (slashBass) return slashBass;
  return chord.match(/^[A-G](?:#|b)?/)?.[0] || chord;
}

function harmonyEventsToMeasures(harmonies: ScoreHarmonyEvent[]) {
  const measuresMap = new Map<number, string[]>();
  for (const harmony of harmonies) {
    const chords = measuresMap.get(harmony.measure) || [];
    chords.push(harmony.harmony);
    measuresMap.set(harmony.measure, chords);
  }

  return Array.from(measuresMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([measureIndex, chords]) => ({ measureIndex, chords }));
}

function fallbackPhraseContext(keySignature?: string): PhraseContext {
  const tonic = keySignature?.replace(/m/i, "").trim() || "C";
  const mode: "major" | "minor" = keySignature?.toLowerCase().includes("m") ? "minor" : "major";
  const center = { tonic, mode, confidence: 0.5 };

  return {
    selectedCenter: center,
    tonalCenterCandidates: [center],
    cadentialTarget: {
      targetPitch: tonic,
      cadenceType: "UNKNOWN",
      confidence: 0.1
    }
  };
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

  const sections = indexes?.formalSections || EMPTY_SECTIONS;
  
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

  const activeSection = useMemo(() => sections.find(s => s.id === selectedSectionId), [sections, selectedSectionId]);

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
    allNotes: scoreSnapshot?.notes || EMPTY_NOTES,
    keySignature: scoreSnapshot?.metadata?.keySignature
  });

  const sectionHarmonies = useMemo<ScoreHarmonyEvent[]>(() => {
    if (!scoreSnapshot?.harmonies?.length) return [];
    return scoreSnapshot.harmonies.filter(harmony => {
      if (!activeSection) return true;
      return harmony.measure >= activeSection.startMeasure && harmony.measure <= activeSection.endMeasure;
    });
  }, [scoreSnapshot, activeSection]);

  const existingHarmonyProposal = useMemo<ReharmonizationProposal | null>(() => {
    if (sectionHarmonies.length === 0) return null;

    const measures = harmonyEventsToMeasures(sectionHarmonies);
    const referenceAnalysis = analyzeReferenceHarmony(sectionHarmonies);
    const context = phraseContext || fallbackPhraseContext(scoreSnapshot?.metadata?.keySignature);

    return {
      id: "existing-harmony-reference",
      name: "Referência — Harmonia da partitura",
      measures,
      explanation: referenceAnalysis.explanation,
      bassLine: referenceAnalysis.bassTrajectory.length > 0
        ? referenceAnalysis.bassTrajectory
        : sectionHarmonies.map(harmony => chordBass(harmony.harmony)),
      detectedMotives: [],
      phraseContext: context
    };
  }, [sectionHarmonies, phraseContext, scoreSnapshot]);

  const controlledReharmonizationProposals = useMemo<ReharmonizationProposal[]>(() => {
    if (sectionHarmonies.length === 0 || !phraseContext || melodyAnchorsData.anchors.length === 0) return [];

    return generateControlledSubstitutionProposals(
      sectionHarmonies,
      melodyAnchorsData.anchors,
      phraseContext.selectedCenter.tonic,
      1
    ).map((controlled, index) => {
      const substitutedEvents = sectionHarmonies.map(harmony => (
        harmony.measure === controlled.measure && harmony.harmony === controlled.originalChord
          ? { ...harmony, harmony: controlled.substituteChord }
          : harmony
      ));

      return {
        id: `controlled-substitution-${index}`,
        name: "Rearmonização controlada — substituição funcional",
        measures: harmonyEventsToMeasures(substitutedEvents),
        explanation: controlled.explanation,
        bassLine: substitutedEvents.map(harmony => chordBass(harmony.harmony)),
        detectedMotives: [],
        phraseContext
      };
    });
  }, [sectionHarmonies, melodyAnchorsData.anchors, phraseContext]);

  const displayedProposals = useMemo(() => (
    existingHarmonyProposal
      ? [existingHarmonyProposal, ...controlledReharmonizationProposals, ...proposals]
      : proposals
  ), [existingHarmonyProposal, controlledReharmonizationProposals, proposals]);

  return (
    <StandardLayout
      headerContent={
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-white">Harmonizar</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                Caminhos de harmonização possíveis para a melodia selecionada.
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
          {(isExpanded ? displayedProposals : displayedProposals.slice(0, 5)).map((prop) => ( 
            <div key={prop.id} className="flex flex-col gap-3 p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      {prop.id === "existing-harmony-reference" ? "Referência harmônica" : "Estratégia de harmonização"}
                    </span>
                    <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{prop.name}</span>
                  </div>
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

                  {(prop.explanation.length > 0 || prop.detectedMotives.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Por que funciona?</span>
                      {[...prop.explanation, ...prop.detectedMotives].map((motive, idx) => (
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

          {displayedProposals.length > 5 && (
            <div className="w-full py-4 text-center">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition cursor-pointer"
              >
                {isExpanded ? "Mostrar Menos" : `Mostrar Mais Harmonizações (+${displayedProposals.length - 5})`}
              </button>
            </div>
          )}

          {displayedProposals.length === 0 && melodyAnchorsData.anchors.length > 0 && (
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
