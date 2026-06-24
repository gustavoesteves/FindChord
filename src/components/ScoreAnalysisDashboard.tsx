import { useState, useMemo, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import { useOntologySessionStore } from "../store/useOntologySessionStore";
import { musescoreAdapter, type ConnectionStatus } from "../utils/musescoreAdapter";
import { analyzeProgression } from "../utils/music/analysis/functionalAnalysis";
import { InspectorEngine } from "../utils/music/analysis/inspector/InspectorEngine";
import { InspectorDashboard } from "./InspectorDashboard";
import { parseChord } from "../utils/music/theory/chordParser";
import { formatChordName } from "../utils/music/theory/enharmonics";
import { noteToMidi } from "../utils/music/core/midi";
import { getNoteAt } from "../utils/music/core/notes";
import type { CanonicalProgressionEvent } from "../utils/music/analysis/models/CanonicalProgressionEvent";
import type { CanonicalChordEvent } from "../utils/music/analysis/models/CanonicalChordEvent";
import { DecisionClustersPanel } from "./composer/DecisionClustersPanel";
import { MelodicAnchorInspector } from "./composer/MelodicAnchorInspector";
import { Activity, BookOpen, ChevronDown, ChevronRight, GitBranch, Music2, RefreshCcw, ShieldAlert, Star, Waves, Wifi, WifiOff } from "lucide-react";
import { StandardLayout } from "./ui/StandardLayout";
import { MusicalObservationsPanel } from "./explainability/MusicalObservationsPanel";
import { ExplainabilityTimeline } from "./explainability/ExplainabilityTimeline";
import { RegionExplainabilityPanel } from "./explainability/RegionExplainabilityPanel";
import { AttractorRadar } from "./explainability/AttractorRadar";
import { AttractorCompass } from "./explainability/AttractorCompass";
import { DecisionTreeVisual } from "./explainability/DecisionTreeVisual";
import { GlobalProgression } from "./explainability/GlobalProgression";// ─── Colour maps ────────────────────────────────────────────────

const intentColors: Record<string, string> = {
  PROLONGATION: "text-sky-400 bg-sky-950/40 border-sky-900/30",
  PREPARATION: "text-amber-400 bg-amber-950/40 border-amber-900/30",
  INTENSIFICATION: "text-orange-400 bg-orange-950/40 border-orange-900/30",
  ATTRACTION: "text-rose-400 bg-rose-950/40 border-rose-900/30",
  RESOLUTION: "text-emerald-400 bg-emerald-950/40 border-emerald-900/30",
  COLORATION: "text-purple-400 bg-purple-950/40 border-purple-900/30",
};

const roleColors: Record<string, string> = {
  OPENING: "text-blue-300 bg-blue-950/20 border-blue-900/20",
  BODY: "text-zinc-400 bg-zinc-900/30 border-zinc-800/20",
  PRE_CADENTIAL: "text-yellow-300 bg-yellow-950/20 border-yellow-900/20",
  CADENTIAL: "text-rose-300 bg-rose-950/20 border-rose-900/20",
  CLOSING: "text-emerald-300 bg-emerald-950/20 border-emerald-900/20",
};

// ─── Helpers ─────────────────────────────────────────────────────

function getTensionColor(tension: number): string {
  if (tension < 0.25) return "bg-emerald-500/80";
  if (tension < 0.5) return "bg-amber-400/80";
  if (tension < 0.75) return "bg-orange-500/80";
  return "bg-rose-500/90";
}

// ─── Main Component ───────────────────────────────────────────────

export default function ScoreAnalysisDashboard() {
  const {
    timelineVoicings,
    tuning,
    activeInstrument,
    activeTimelineIndex,
    setActiveTimelineIndex,
    notationStyle,
    userCustomVoicings,
  } = useChordStore();

  const { scoreSnapshot, activeNode, activeFormalSection, activeRegion, selectChordByIndex, activeExplorationResult } = useOntologySessionStore();

  const [technicalExpanded, setTechnicalExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // Auto-selecionar o cluster principal assim que um resultado for gerado
  useEffect(() => {
    if (activeExplorationResult && activeExplorationResult.clusters.length > 0) {
      setSelectedClusterId(activeExplorationResult.clusters[0].id);
    } else {
      setSelectedClusterId(null);
    }
  }, [activeExplorationResult]);

  useEffect(() => {
    musescoreAdapter.connect();
    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnectionStatus(status);
      if (status === "disconnected") setIsSyncing(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await musescoreAdapter.requestScoreSync();
    // Parar de girar o ícone após um breve delay (simulando request se for muito rápido)
    setTimeout(() => setIsSyncing(false), 800);
  };

  const progressionChords = useMemo(() => {
    return scoreSnapshot ? scoreSnapshot.harmonies.map(h => h.harmony) : [];
  }, [scoreSnapshot]);

  const selectedChordIdx = activeTimelineIndex ?? 0;

  const selectChord = (idx: number) => {
    setActiveTimelineIndex(idx);
    selectChordByIndex(idx);
  };

  // ── Analysis ──────────────────────────────────────────────────
  const analysis = useMemo(() => {
    if (progressionChords.length === 0) return null;

    let mappedSections = scoreSnapshot?.sections;
    if (scoreSnapshot && mappedSections) {
      mappedSections = mappedSections.map(sec => {
        const startChordIndex = scoreSnapshot.harmonies.findIndex(h => h.measure >= sec.startMeasure);
        let endChordIndex = scoreSnapshot.harmonies.findIndex(h => h.measure > sec.endMeasure);
        if (endChordIndex === -1) endChordIndex = scoreSnapshot.harmonies.length - 1;
        else endChordIndex -= 1; // The last chord before the next measure

        return {
          ...sec,
          startChordIndex: startChordIndex !== -1 ? startChordIndex : 0,
          endChordIndex: endChordIndex !== -1 ? Math.max(0, endChordIndex) : 0
        };
      });
    }

    return analyzeProgression(progressionChords, "GENERAL", "FULL", mappedSections);
  }, [progressionChords, scoreSnapshot]);

  // ── Inspector (Linter) ────────────────────────────────────────
  const progressionEvent = useMemo<CanonicalProgressionEvent>(() => {
    const chordEvents: CanonicalChordEvent[] = progressionChords.map((symbol, idx) => {
      const voicing = timelineVoicings[idx];
      const frets = voicing ? voicing.frets : Array(tuning.length).fill(null);
      const notes = voicing
        ? voicing.frets
          .map((f, si) => (f !== null ? noteToMidi(getNoteAt(tuning[si], f)) : null))
          .filter((n): n is number => n !== null)
        : [];
      return {
        id: `ch_${symbol}_${idx}`,
        symbol,
        voicing: { notes, frets },
        tuning: { instrument: activeInstrument, strings: tuning },
        inversion: "Root",
        voicingType: voicing ? voicing.shapeFamily || "Unknown" : "Unknown",
        tensionLevel: 0.5,
        voiceLeadingScore: 1.0,
      };
    });
    return {
      id: `progression_${progressionChords.join("_")}`,
      chordEvents,
      tonalCenters: [],
    };
  }, [progressionChords, timelineVoicings, tuning, userCustomVoicings, activeInstrument]);

  const diagnostics = useMemo(() => InspectorEngine.inspect(progressionEvent, analysis), [progressionEvent, analysis]);

  // ── Helpers ───────────────────────────────────────────────────
  const getChordDisplay = (chord: string | { chordSymbol: string }) => {
    const symbol = typeof chord === "string" ? chord : chord.chordSymbol;
    const parsed = parseChord(symbol);
    if (parsed.empty) return symbol;
    const omissions = symbol.includes("(no5)") ? ["5"] : [];
    return formatChordName(parsed.root, parsed.quality, omissions, parsed.bass, notationStyle);
  };

  // ── Suno Prompt Generation ─────────────────────────────────────
  const sunoPrompt = useMemo(() => {
    if (!analysis || progressionChords.length === 0) return "";
    const tonic = `${analysis.tonalCenter.root} ${analysis.tonalCenter.mode === "MAJOR" ? "Major" : "Minor"}`;
    const regions = (analysis.regions || [])
      .map((r, i) => `Section ${i + 1}: ${r.baseCenter.root} ${r.baseCenter.mode === "MAJOR" ? "Major" : "Minor"} (bars ${r.startIndex + 1}–${r.endIndex + 1})`)
      .join(", ");
    const phraseCount = (analysis.phrases || []).length;
    const hasModulation = (analysis.regions || []).length > 1;

    const charText = analysis.narrativeExplanation?.global
      ? analysis.narrativeExplanation.global.observations.map(o => o.prose).join(" ")
      : analysis.narrativeExplanation?.overview;

    return `Musical style: Harmonic progression in ${tonic}. Chord sequence: ${progressionChords.join(" - ")}. ${hasModulation ? `Tonal journey: ${regions}.` : ""} Structure: ${phraseCount} phrase${phraseCount !== 1 ? "s" : ""}. ${charText ? `Character: ${charText.substring(0, 200)}...` : ""} Mood: introspective, cinematic. Acoustic guitar with subtle orchestral elements.`;
  }, [analysis, progressionChords]);

  // ── Tension data per chord ────────────────────────────────────
  const tensionData = useMemo(() => {
    if (!analysis) return [];
    return progressionChords.map((chord, idx) => {
      const chordData = analysis.chords[idx];
      let tension = 0.3;
      if (chordData?.harmonicFunction === "DOMINANT") tension = 0.75;
      else if (chordData?.harmonicFunction === "SUBDOMINANT") tension = 0.5;
      else if (chordData?.harmonicFunction === "TONIC") tension = 0.2;
      // Add entropy from diagnostics
      const diagsForChord = diagnostics.filter((d) => d.affectedMeasures.includes(idx + 1));
      const diagBonus = diagsForChord.reduce((acc, d) => {
        if (d.severity === "critical") return acc + 0.2;
        if (d.severity === "warning") return acc + 0.1;
        return acc;
      }, 0);
      return { chord, tension: Math.min(1, tension + diagBonus), chordData };
    });
  }, [analysis, progressionChords, diagnostics]);

  // ── Empty state ───────────────────────────────────────────────
  if (!scoreSnapshot || progressionChords.length === 0) {
    return (
      <div className="w-full p-10 rounded-2xl border border-zinc-850 bg-zinc-900/20 flex flex-col items-center gap-5 text-center">
        <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
          {connectionStatus === "connected" ? <RefreshCcw className={`h-8 w-8 ${isSyncing ? 'animate-spin' : ''}`} /> : <WifiOff className="h-8 w-8" />}
        </div>
        <div>
          <h3 className="text-base font-extrabold text-zinc-200">
            {connectionStatus === "connected" ? "Sincronizar Partitura" : "MuseScore Desconectado"}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {connectionStatus === "connected"
              ? "Clique abaixo para ler a partitura atualmente aberta no MuseScore e extrair todos os acordes e metadados para análise em tempo real."
              : "Abra o MuseScore 3 e inicie o plugin 'Find Chord Bridge' para permitir a extração contínua da partitura."}
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={connectionStatus !== "connected" || isSyncing}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${connectionStatus === "connected" && !isSyncing
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar Partitura"}
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <>
      <MelodicAnchorInspector />
      <StandardLayout
        headerContent={
          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-rose-500" />
                )}
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  {connectionStatus === "connected" ? "MuseScore Sincronizado" : "MuseScore Desconectado"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={connectionStatus !== "connected" || isSyncing}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition text-[10px] font-black text-zinc-300 uppercase tracking-widest disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCcw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  Sincronizar
                </button>
              </div>
            </div>
            <GlobalProgression />
            <ExplainabilityTimeline />
          </div>
        }
      >
        <div className="flex flex-col gap-8 animate-scale-up">

          {/* ── F16.7 UI UNIFICADA: DIAGNÓSTICO E EXPLORAÇÃO ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">

            {/* Left Column: Diagnóstico */}
            <div className="flex flex-col gap-6">
              <MusicalObservationsPanel />
            </div>

            {/* Right Column: Exploração */}
            <div className="flex flex-col gap-6">
              <DecisionClustersPanel
                selectedClusterId={selectedClusterId}
                onSelectCluster={setSelectedClusterId}
              />
            </div>
          </div>

          {/* ── VISÃO TÉCNICA E ANALISADORES (Modo Desenvolvedor) ──────────────────────── */}
          <details className="mt-8 group p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
            <summary className="flex items-center gap-2 cursor-pointer outline-none marker:content-[''] list-none">
              <Activity className="h-5 w-5 text-zinc-500 group-open:rotate-90 transition-transform" />
              <span className="text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-200 transition-colors">
                Visão Técnica e Analisadores Primitivos
              </span>
            </summary>
            <div className="flex flex-col gap-12 mt-8 animate-fade-in border-t border-zinc-800/60 pt-8">

              {/* ── STICKY HEADER TÉCNICO ──────────────────────── */}
              {activeNode && (
                <div className="sticky top-0 z-50 p-4 rounded-2xl border border-zinc-700/60 bg-zinc-950/80 backdrop-blur-md shadow-2xl flex items-center gap-6 overflow-x-auto">
                  <div className="flex items-center gap-3 pr-6 border-r border-zinc-800/60">
                    <span className="text-xl font-black text-white whitespace-nowrap">
                      [ {activeNode.chordSymbol} ]
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] font-medium tracking-wide">
                    {activeFormalSection && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">Section</span>
                        <span className="px-2 py-0.5 rounded border font-bold text-zinc-300 bg-zinc-800/40 border-zinc-700/40">
                          {activeFormalSection.label}
                        </span>
                      </div>
                    )}
                    {activeRegion && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">Ontology</span>
                        <span className="px-2 py-0.5 rounded border font-bold text-emerald-300 bg-emerald-950/40 border-emerald-900/30">
                          {activeRegion.regionType}
                        </span>
                      </div>
                    )}
                    {activeNode.semantic?.phraseRole && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">Role</span>
                        <span className={`px-2 py-0.5 rounded border font-bold ${roleColors[activeNode.semantic.phraseRole] || "text-zinc-400"}`}>
                          {activeNode.semantic.phraseRole}
                        </span>
                      </div>
                    )}
                    {activeNode.semantic?.intent && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">Intent</span>
                        <span className={`px-2 py-0.5 rounded border font-bold ${intentColors[activeNode.semantic.intent] || "text-zinc-400"}`}>
                          {activeNode.semantic.intent}
                        </span>
                      </div>
                    )}
                    {activeNode.attractorField?.primaryAttractor && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">Attractor</span>
                        <span className="text-purple-300 font-bold bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded">
                          {activeNode.attractorField.primaryAttractor.type} {(activeNode.attractorField.primaryAttractor.alignment * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── COMPONENTES ARQUITETURAIS MOVIDOS ──────────────────────── */}
              <div className="flex flex-col gap-8 mt-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <Waves className="h-5 w-5 text-sky-400" />
                  <span className="text-sm font-black text-zinc-200 uppercase tracking-widest">Attractor Compass (Direção)</span>
                </div>
                <div className="w-full p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/20">
                  <AttractorCompass field={activeNode?.attractorField || null} />
                </div>
              </div>

              {/* ── NARRATIVA E ESTRUTURA (Técnico) ──────────────────────── */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-black text-zinc-200 uppercase tracking-widest">Narrativa Estrutural</span>
                </div>

                {analysis.narrativeExplanation?.sections && analysis.narrativeExplanation.sections.length > 0 && (
                  <div className="flex flex-col gap-3 mt-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Narrativa por Seção
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.narrativeExplanation.sections.map((sec, i) => (
                        <div key={i} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
                          <span className="text-[11px] font-black text-amber-500/90 uppercase tracking-widest block mb-2">
                            {sec.label}
                          </span>
                          <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                            {sec.prose}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suno Export */}
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Prompt Suno
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={sunoPrompt}
                      rows={2}
                      className="w-full bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3 text-[11px] text-zinc-400 font-mono resize-none focus:outline-none focus:border-amber-800/60 transition"
                    />
                  </div>
                </div>
              </div>

              {/* ── GRAVIDADE E RADAR (Técnico) ──────────────────────── */}
              <div className="flex flex-col gap-8 mt-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <Waves className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-black text-zinc-200 uppercase tracking-widest">Gravidade & Tensão (Bruto)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="w-full overflow-x-auto">
                      <div className="flex items-end gap-1.5 h-40 min-w-max px-1">
                        {tensionData.map((td, idx) => {
                          const barHeight = Math.max(8, Math.round(td.tension * 100));
                          const isActive = selectedChordIdx === idx;
                          return (
                            <button
                              key={idx}
                              id={`tension-bar-${idx}`}
                              onClick={() => selectChord(idx)}
                              className={`flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 ${isActive ? "scale-105" : "hover:scale-[1.03]"}`}
                            >
                              <span className="text-[9px] font-black text-zinc-500 group-hover:text-zinc-300 transition">
                                {Math.round(td.tension * 100)}
                              </span>
                              <div
                                className={`w-10 rounded-t-lg transition-all duration-300 ${getTensionColor(td.tension)} ${isActive ? "ring-2 ring-white/40" : "opacity-80"}`}
                                style={{ height: `${barHeight}px` }}
                              />
                              <span className={`text-[9px] font-black uppercase truncate w-10 text-center transition ${isActive ? "text-white" : "text-zinc-500"}`}>
                                {getChordDisplay(progressionChords[idx])}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <AttractorRadar field={activeNode?.attractorField || null} />
                  </div>
                </div>
              </div>

              {/* ── AUDITORIA & INSPECTOR ──────────────────────── */}
              <div className="flex flex-col gap-8 mt-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <ShieldAlert className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-black text-zinc-200 uppercase tracking-widest">Linter Harmônico & Observabilidade</span>
                </div>

                {/* ── COMO O SISTEMA CHEGOU NESSA CONCLUSÃO ──────────────────────── */}
                <details className="flex flex-col gap-6 w-full mt-4 group">
                  <summary className="flex items-center gap-2 pb-2 border-b border-zinc-800/60 cursor-pointer outline-none marker:content-[''] list-none">
                    <GitBranch className="h-5 w-5 text-emerald-400 group-open:rotate-90 transition-transform" />
                    <span className="text-sm font-black text-zinc-200 uppercase tracking-widest hover:text-white">Ver raciocínio da IA</span>
                  </summary>
                  <div className="mt-6">
                    {(() => {
                      const { indexes, activeRegionIndex, getExplanationTrace } = useOntologySessionStore.getState();
                      const region = indexes?.regions[activeRegionIndex ?? 0] || null;
                      const trace = activeNode && region ? getExplanationTrace(region, activeNode) : null;
                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <RegionExplainabilityPanel region={region} trace={trace} />
                          <DecisionTreeVisual trace={trace} />
                        </div>
                      );
                    })()}
                  </div>
                </details>

                <div className="flex flex-col gap-4">
                  {/* Tonal Centre Header */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-900/40 bg-purple-950/10">
                    <Music2 className="h-5 w-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-zinc-200 uppercase tracking-wider">
                        Centro tonal Global:{" "}
                        <span className="text-purple-300">
                          {analysis.tonalCenter.root} {analysis.tonalCenter.mode === "MAJOR" ? "Maior" : "Menor"}
                        </span>
                      </div>
                      {(analysis.regions || []).length > 1 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                          <Activity className="h-3 w-3 text-purple-500" />
                          {(analysis.regions || []).length} regiões harmônicas detectadas
                        </div>
                      )}
                    </div>
                  </div>

                  {diagnostics.length === 0 ? (
                    <div className="p-8 rounded-xl border border-emerald-900/30 bg-emerald-950/10 text-center text-emerald-400 text-xs font-bold">
                      ✅ Nenhum problema detectado na progressão.
                    </div>
                  ) : (
                    <InspectorDashboard diagnostics={diagnostics} />
                  )}

                  {/* Technical metrics toggle */}
                  <button
                    onClick={() => setTechnicalExpanded(!technicalExpanded)}
                    className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-wider cursor-pointer transition mt-4"
                  >
                    {technicalExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    Métricas Técnicas (ADI, CFS, ISS, TAS, TFI)
                  </button>

                  {technicalExpanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-scale-up">
                      {[
                        { key: "ADI", label: "Dens. Analítica", value: (diagnostics.length / Math.max(1, progressionChords.length)).toFixed(2), color: "text-sky-400" },
                        { key: "CFS", label: "Estabilidade", value: diagnostics.filter((d) => d.severity === "info").length === diagnostics.length ? "Alta" : "Média", color: "text-emerald-400" },
                        { key: "ISS", label: "Score Intègre", value: Math.max(0, 1 - diagnostics.filter((d) => d.severity === "critical").length * 0.3).toFixed(2), color: "text-amber-400" },
                        { key: "TAS", label: "Tensão Méd.", value: tensionData.length ? (tensionData.reduce((a, b) => a + b.tension, 0) / tensionData.length).toFixed(2) : "—", color: "text-orange-400" },
                        { key: "TFI", label: "Índice Tonal", value: (analysis.regions || []).length === 1 ? "Monotonal" : "Politonal", color: "text-purple-400" },
                      ].map((m) => (
                        <div key={m.key} className="flex flex-col gap-1.5 p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{m.key}</span>
                          <span className={`text-base font-black ${m.color}`}>{m.value}</span>
                          <span className="text-[9px] text-zinc-600">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>


        </div>
      </StandardLayout>
    </>
  );
}
