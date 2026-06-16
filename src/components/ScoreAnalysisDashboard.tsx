import { useState, useMemo, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import { musescoreAdapter, type ConnectionStatus } from "../utils/musescoreAdapter";
import { analyzeProgression } from "../utils/music/analysis/functionalAnalysis";
import { InspectorEngine } from "../utils/music/analysis/inspector/InspectorEngine";
import { InspectorDashboard } from "./InspectorDashboard";
import { playGuitarChord } from "../utils/audioSynth";
import { parseChord } from "../utils/music/theory/chordParser";
import { formatChordName } from "../utils/music/theory/enharmonics";
import { noteToMidi } from "../utils/music/core/midi";
import { getNoteAt } from "../utils/music/core/notes";
import { Note as TonalNote } from "tonal";
import type { CanonicalProgressionEvent } from "../utils/music/analysis/models/CanonicalProgressionEvent";
import type { CanonicalChordEvent } from "../utils/music/analysis/models/CanonicalChordEvent";
import type {
  Phrase,
  PhraseGroup,
} from "../utils/music/analysis/models/FunctionalAnalysis";
import {
  BookOpen,
  Activity,
  ShieldAlert,
  Lightbulb,
  Music2,
  Sparkles,
  Volume2,
  ChevronDown,
  ChevronRight,
  Zap,
  Waves,
  Star,
  GitBranch,
  Clock,
  RefreshCcw,
  Wifi,
  WifiOff
} from "lucide-react";

// ─── Colour maps ────────────────────────────────────────────────

const intentColors: Record<string, string> = {
  PROLONGATION: "text-sky-400 bg-sky-950/40 border-sky-900/30",
  PREPARATION: "text-amber-400 bg-amber-950/40 border-amber-900/30",
  INTENSIFICATION: "text-orange-400 bg-orange-950/40 border-orange-900/30",
  ATTRACTION: "text-rose-400 bg-rose-950/40 border-rose-900/30",
  RESOLUTION: "text-emerald-400 bg-emerald-950/40 border-emerald-900/30",
  COLORATION: "text-purple-400 bg-purple-950/40 border-purple-900/30",
};
const intentLabels: Record<string, string> = {
  PROLONGATION: "Prolongamento",
  PREPARATION: "Preparação",
  INTENSIFICATION: "Intensificação",
  ATTRACTION: "Atração",
  RESOLUTION: "Resolução",
  COLORATION: "Coloração",
};
const roleColors: Record<string, string> = {
  OPENING: "text-blue-300 bg-blue-950/20 border-blue-900/20",
  BODY: "text-zinc-400 bg-zinc-900/30 border-zinc-800/20",
  PRE_CADENTIAL: "text-yellow-300 bg-yellow-950/20 border-yellow-900/20",
  CADENTIAL: "text-rose-300 bg-rose-950/20 border-rose-900/20",
  CLOSING: "text-emerald-300 bg-emerald-950/20 border-emerald-900/20",
};
const roleLabels: Record<string, string> = {
  OPENING: "Abertura de Frase",
  BODY: "Corpo da Frase",
  PRE_CADENTIAL: "Pré-Cadencial",
  CADENTIAL: "Área Cadencial",
  CLOSING: "Fechamento",
};

// ─── Reharmonisation buttons ─────────────────────────────────────

const REHARMONISATION_BUTTONS = [
  {
    id: "mais_tensao",
    label: "Mais Tensão",
    emoji: "⚡",
    description: "Adiciona tensão dominante ou substituto de trítono",
    color: "from-orange-600/30 to-rose-600/20 border-orange-700/50 text-orange-300 hover:border-orange-500",
  },
  {
    id: "mais_surpresa",
    label: "Mais Surpresa",
    emoji: "✨",
    description: "Empréstimo modal ou acorde de cor inesperado",
    color: "from-purple-600/30 to-indigo-600/20 border-purple-700/50 text-purple-300 hover:border-purple-500",
  },
  {
    id: "mais_modal",
    label: "Mais Modal",
    emoji: "🌊",
    description: "Substitui por um acorde modal equivalente",
    color: "from-sky-600/30 to-cyan-600/20 border-sky-700/50 text-sky-300 hover:border-sky-500",
  },
  {
    id: "mais_jazz",
    label: "Mais Jazz",
    emoji: "🎷",
    description: "Adiciona extensões (7ª, 9ª, 13ª) e alterações",
    color: "from-amber-600/30 to-yellow-600/20 border-amber-700/50 text-amber-300 hover:border-amber-500",
  },
  {
    id: "mais_estavel",
    label: "Mais Estável",
    emoji: "⚓",
    description: "Simplifica para função tonal primária",
    color: "from-emerald-600/30 to-teal-600/20 border-emerald-700/50 text-emerald-300 hover:border-emerald-500",
  },
  {
    id: "mais_cromatico",
    label: "Mais Cromático",
    emoji: "🎨",
    description: "Insere movimento cromático ou substituição",
    color: "from-pink-600/30 to-fuchsia-600/20 border-pink-700/50 text-pink-300 hover:border-pink-500",
  },
];

type DashboardPanel = "narrativa" | "estrutura" | "tensao" | "auditoria" | "exploracao";

// ─── Helpers ─────────────────────────────────────────────────────

function getTensionColor(tension: number): string {
  if (tension < 0.25) return "bg-emerald-500/80";
  if (tension < 0.5) return "bg-amber-400/80";
  if (tension < 0.75) return "bg-orange-500/80";
  return "bg-rose-500/90";
}

function getTensionGlowColor(tension: number): string {
  if (tension < 0.25) return "text-emerald-400 bg-emerald-950/20 border-emerald-800/30";
  if (tension < 0.5) return "text-amber-400 bg-amber-950/20 border-amber-800/30";
  if (tension < 0.75) return "text-orange-400 bg-orange-950/20 border-orange-800/30";
  return "text-rose-400 bg-rose-950/20 border-rose-800/30";
}

function getTensionLabel(tension: number): string {
  if (tension < 0.25) return "Estável";
  if (tension < 0.5) return "Leve";
  if (tension < 0.75) return "Alta";
  return "Máxima";
}

function getFunctionLabel(fn: string): string {
  if (fn === "TONIC") return "Tônica";
  if (fn === "DOMINANT") return "Dominante";
  if (fn === "SUBDOMINANT") return "Subdominante";
  return fn;
}

// ─── Main Component ───────────────────────────────────────────────

export default function ScoreAnalysisDashboard() {
  const {
    scoreSnapshot,
    timelineVoicings,
    tuning,
    activeInstrument,
    activeTimelineIndex,
    setActiveTimelineIndex,
    notationStyle,
  } = useChordStore();

  const [activePanel, setActivePanel] = useState<DashboardPanel>("narrativa");
  const [localSelectedChordIdx, setLocalSelectedChordIdx] = useState<number | null>(null);
  const [expandedChordIdx, setExpandedChordIdx] = useState<number | null>(null);
  const [reharmoResult, setReharmoResult] = useState<string | null>(null);
  const [technicalExpanded, setTechnicalExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    musescoreAdapter.connect();
    return musescoreAdapter.subscribe((status) => {
      setConnectionStatus(status);
      if (status === "disconnected") setIsSyncing(false);
    });
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

  // The globally selected chord is either the timeline's active index or a local selection
  const selectedChordIdx = activeTimelineIndex ?? localSelectedChordIdx ?? 0;

  const selectChord = (idx: number) => {
    setLocalSelectedChordIdx(idx);
    setActiveTimelineIndex(idx);
    setReharmoResult(null);
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

    return analyzeProgression(progressionChords, "GENERAL", false, mappedSections);
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
  }, [progressionChords, timelineVoicings, tuning, activeInstrument]);

  const diagnostics = useMemo(() => InspectorEngine.inspect(progressionEvent, analysis), [progressionEvent, analysis]);

  // ── Helpers ───────────────────────────────────────────────────
  const getChordDisplay = (chord: string | { chordSymbol: string }) => {
    const symbol = typeof chord === "string" ? chord : chord.chordSymbol;
    const parsed = parseChord(symbol);
    if (parsed.empty) return symbol;
    const omissions = symbol.includes("(no5)") ? ["5"] : [];
    return formatChordName(parsed.root, parsed.quality, omissions, parsed.bass, notationStyle);
  };

  const playChordAudio = (chordSymbol: string) => {
    const parsed = parseChord(chordSymbol);
    if (parsed.empty) return;
    let currentOctave = 3;
    let lastChroma = -1;
    const playNotes = parsed.notes.map((note) => {
      const chroma = TonalNote.get(note).chroma;
      if (chroma !== undefined && lastChroma !== -1 && chroma < lastChroma) currentOctave++;
      lastChroma = chroma ?? -1;
      return `${note}${currentOctave}`;
    });
    playGuitarChord(playNotes, 45);
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

  // ── Formal Blocks ─────────────────────────────────────────────
  const formalBlocks = useMemo(() => {
    if (!analysis) return [];
    const blocks: Array<
      | { type: "PERIOD"; group: PhraseGroup; phrases: Phrase[] }
      | { type: "STANDALONE"; phrase: Phrase }
    > = [];
    const phrases: Phrase[] = analysis.phrases || [];
    const groups: PhraseGroup[] = analysis.phraseGroups || [];
    let i = 0;
    while (i < phrases.length) {
      const phrase = phrases[i];
      if (phrase.phraseGroupId !== undefined) {
        const group = groups.find((g) => g.index === phrase.phraseGroupId);
        if (group && group.type === "PERIOD") {
          const next = phrases[i + 1];
          if (next && next.phraseGroupId === group.index) {
            blocks.push({ type: "PERIOD", group, phrases: [phrase, next] });
            i += 2;
            continue;
          }
        }
      }
      blocks.push({ type: "STANDALONE", phrase });
      i++;
    }
    return blocks;
  }, [analysis]);

  // ── Simulate Reharmonisation ─────────────────────────────────
  const applyReharmonisation = (buttonId: string) => {
    if (!analysis || selectedChordIdx === null) return;
    const chord = progressionChords[selectedChordIdx];
    const parsed = parseChord(chord);
    if (parsed.empty) return;

    const suggestions: Record<string, (root: string) => string> = {
      mais_tensao: (r) => `${r}7(#11)`,
      mais_surpresa: (r) => `${r}maj7#5`,
      mais_modal: (r) => `${r}sus2`,
      mais_jazz: (r) => `${r}9`,
      mais_estavel: (r) => `${r}`,
      mais_cromatico: (r) => {
        const chromatic: Record<string, string> = { C: "Db", D: "Eb", E: "F", F: "Gb", G: "Ab", A: "Bb", B: "C" };
        return `${chromatic[r] ?? r}7`;
      },
    };
    const fn = suggestions[buttonId];
    if (fn) {
      const result = fn(parsed.root);
      setReharmoResult(result);
      playChordAudio(result);
    }
  };

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
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
            connectionStatus === "connected" && !isSyncing
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

  const panels: { id: DashboardPanel; label: string; icon: typeof BookOpen; badge?: number }[] = [
    { id: "narrativa", label: "Narrativa", icon: BookOpen },
    { id: "estrutura", label: "Estrutura Formal", icon: GitBranch },
    { id: "tensao", label: "Mapa de Tensão", icon: Waves },
    {
      id: "auditoria",
      label: "Auditoria",
      icon: ShieldAlert,
      badge: diagnostics.length > 0 ? diagnostics.length : undefined,
    },
    { id: "exploracao", label: "Exploração", icon: Lightbulb },
  ];

  return (
    <div className="w-full flex flex-col gap-0 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Top Sync Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60 bg-zinc-950/80">
        <div className="flex items-center gap-2">
          {connectionStatus === "connected" ? (
            <Wifi className="h-3 w-3 text-emerald-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-rose-500" />
          )}
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            {connectionStatus === "connected" ? "MuseScore Sincronizado" : "MuseScore Desconectado"}
          </span>
        </div>
        <button
          onClick={handleSync}
          disabled={connectionStatus !== "connected" || isSyncing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition text-[9px] font-black text-zinc-300 uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCcw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
          Sincronizar
        </button>
      </div>

      {/* Panel Tab Selector */}
      <div className="flex items-center gap-0 border-b border-zinc-800/60 bg-zinc-950/60 overflow-x-auto">
        {panels.map((p) => {
          const Icon = p.icon;
          const isActive = activePanel === p.id;
          return (
            <button
              key={p.id}
              id={`analysis-panel-${p.id}`}
              onClick={() => setActivePanel(p.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-purple-500 text-purple-400 bg-purple-950/20"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {p.label}
              {p.badge !== undefined && p.badge > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-rose-600/30 text-rose-300 text-[9px] font-black border border-rose-500/20">
                  {p.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="p-5 flex flex-col gap-5 animate-scale-up">

        {/* ── PANEL: NARRATIVA HARMÔNICA ──────────────────────── */}
        {activePanel === "narrativa" && (
          <div className="flex flex-col gap-4">

            {/* Global Narrative (Nível 1) */}
            {analysis.narrativeExplanation?.global && analysis.narrativeExplanation.global.observations.length > 0 && (
              <div className="p-5 rounded-2xl border border-purple-500/15 bg-purple-950/10 text-xs text-zinc-300 leading-relaxed shadow-lg">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-4">
                  Visão Geral da Obra
                </span>
                <div className="flex flex-col gap-4">
                  {analysis.narrativeExplanation.global.observations.map((obs, i) => (
                    <p key={i} className="font-medium text-[13px] text-purple-100/90 leading-relaxed">{obs.prose}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Section Narrative (Nível 2) */}
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

            {/* Pedagogical Overview (Legacy Fallback) */}
            {!analysis.narrativeExplanation?.global && analysis.narrativeExplanation?.overview && (
              <div className="p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 text-xs text-zinc-400 leading-relaxed shadow-lg">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">
                  Visão Geral (Legado)
                </span>
                <p className="whitespace-pre-line font-medium">{analysis.narrativeExplanation.overview}</p>
              </div>
            )}

            {/* Chord-by-chord pills */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Acordes — clique para detalhar
              </span>
              <div className="flex flex-wrap gap-2">
                {progressionChords.map((chord, idx) => {
                  const chordData = analysis.chords[idx];
                  const isSelected = selectedChordIdx === idx;
                  return (
                    <button
                      key={idx}
                      id={`narrative-chord-${idx}`}
                      onClick={() => {
                        selectChord(idx);
                        setExpandedChordIdx(isSelected && expandedChordIdx === idx ? null : idx);
                      }}
                      className={`group flex flex-col items-center p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-150 hover:scale-[1.03] w-[88px] ${
                        isSelected
                          ? "bg-purple-950/30 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                          : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playChordAudio(chord);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition mb-1 p-0.5 rounded text-purple-400 hover:text-purple-200 cursor-pointer"
                      >
                        <Volume2 className="h-2.5 w-2.5" />
                      </button>
                      <span className={`text-[12px] font-black truncate w-full ${isSelected ? "text-white" : "text-zinc-200"}`}>
                        {getChordDisplay(chord)}
                      </span>
                      {chordData && (
                        <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider mt-0.5">
                          {getFunctionLabel(chordData.harmonicFunction)}
                        </span>
                      )}
                      {scoreSnapshot.harmonies[idx] && (
                        <span className="text-[8px] text-zinc-600 font-bold mt-0.5">
                          Compasso {scoreSnapshot.harmonies[idx].measure}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected chord detail */}
            {expandedChordIdx !== null && analysis.chords[expandedChordIdx] && (
              <div className="p-4 rounded-xl border border-purple-800/40 bg-purple-950/10 flex flex-col gap-2 animate-scale-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 uppercase">
                    {getChordDisplay(progressionChords[expandedChordIdx])} — Compasso {expandedChordIdx + 1}
                  </span>
                  <button
                    onClick={() => playChordAudio(progressionChords[expandedChordIdx])}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 rounded-lg text-[10px] font-bold text-purple-300 cursor-pointer transition"
                  >
                    <Volume2 className="h-3 w-3" /> Ouvir
                  </button>
                </div>
                {(() => {
                  const cd = analysis.chords[expandedChordIdx];
                  return (
                    <div className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
                      {cd.semantic?.intent && (
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold w-fit ${intentColors[cd.semantic.intent] || "text-zinc-400"}`}
                        >
                          <Sparkles className="h-3 w-3" />
                          Intenção: {intentLabels[cd.semantic.intent] || cd.semantic.intent}
                        </div>
                      )}
                      {cd.semantic?.phraseRole && (
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold w-fit ${roleColors[cd.semantic.phraseRole] || "text-zinc-400"}`}
                        >
                          <Clock className="h-3 w-3" />
                          Papel: {roleLabels[cd.semantic.phraseRole] || cd.semantic.phraseRole}
                        </div>
                      )}
                      {cd.semantic?.explanation && cd.semantic.explanation.length > 0 && (
                        <p className="text-zinc-400 leading-relaxed mt-1 border-l-2 border-purple-700/40 pl-3">
                          {cd.semantic.explanation.join(" ")}
                        </p>
                      )}
                      {!cd.semantic && cd.explanation && cd.explanation.length > 0 && (
                        <p className="text-zinc-400 leading-relaxed mt-1 border-l-2 border-purple-700/40 pl-3">
                          {cd.explanation.join(" ")}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Suno Export */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Prompt Suno (gerado da narrativa)
                </span>
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  value={sunoPrompt}
                  rows={4}
                  className="w-full bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3 text-[11px] text-zinc-400 font-mono resize-none focus:outline-none focus:border-amber-800/60 transition"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(sunoPrompt)}
                  className="absolute bottom-2 right-2 px-2 py-1 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/40 rounded-lg text-[9px] font-black text-amber-400 cursor-pointer transition"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PANEL: ESTRUTURA FORMAL ─────────────────────────── */}
        {activePanel === "estrutura" && (
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-purple-500" />
              Blocos Formais — Períodos, Frases e Cadências
            </div>

            {formalBlocks.length === 0 && (
              <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 text-center text-zinc-500 text-xs">
                Adicione mais acordes para detectar estrutura formal.
              </div>
            )}

            {formalBlocks.map((block, idx) => {
              if (block.type === "PERIOD") {
                const [phraseA, phraseB] = block.phrases;
                return (
                  <div
                    key={`period-${idx}`}
                    className="p-5 rounded-2xl border border-purple-900/35 bg-purple-950/5 flex flex-col gap-4 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                  >
                    <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl animate-pulse" />
                    <div className="flex items-center justify-between border-b border-purple-900/20 pb-2">
                      <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">
                        🎼 {block.group.name}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-900/30 border border-purple-800/35 text-purple-300 font-extrabold uppercase font-mono">
                        Confiança: {Math.round(block.group.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[phraseA, phraseB].map((phrase, pi) => {
                        const firstChord = analysis.chords[phrase.startIndex];
                        const keyName = firstChord?.state
                          ? `${firstChord.state.root} ${firstChord.state.mode === "IONIAN" ? "Maior" : "Menor"}`
                          : "";
                        return (
                          <div
                            key={pi}
                            className={`flex flex-col gap-2 pl-3 border-l-2 ${
                              pi === 0 ? "border-amber-500/50" : "border-emerald-500/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[9.5px] font-black uppercase tracking-wider ${
                                  pi === 0 ? "text-amber-400" : "text-emerald-400"
                                }`}
                              >
                                Frase {phrase.index + 1} — {pi === 0 ? "Antecedente" : "Consequente"}
                              </span>
                              {keyName && (
                                <span className="text-[8.5px] text-zinc-500 font-bold">{keyName}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {Array.from({ length: phrase.endIndex - phrase.startIndex + 1 }).map(
                                (_, si) => {
                                  const cIdx = phrase.startIndex + si;
                                  const cd = analysis.chords[cIdx];
                                  const isActive = selectedChordIdx === cIdx;
                                  return (
                                    <div key={cIdx} className="flex items-center gap-1">
                                      <button
                                        id={`structure-chord-${cIdx}`}
                                        onClick={() => selectChord(cIdx)}
                                        className={`flex flex-col p-2 rounded-xl border text-center cursor-pointer transition w-[80px] ${
                                          isActive
                                            ? "bg-purple-950/30 border-purple-500"
                                            : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                                        }`}
                                      >
                                        <span className="text-[11px] font-black text-zinc-200 truncate">
                                          {getChordDisplay(progressionChords[cIdx])}
                                        </span>
                                        {cd && (
                                          <span className="text-[8px] text-purple-400 font-black uppercase">
                                            {cd.harmonicFunction === "TONIC"
                                              ? "Tôn"
                                              : cd.harmonicFunction === "DOMINANT"
                                              ? "Dom"
                                              : cd.harmonicFunction === "SUBDOMINANT"
                                              ? "Sub"
                                              : cd.harmonicFunction}
                                          </span>
                                        )}
                                      </button>
                                      {si < phrase.endIndex - phrase.startIndex && (
                                        <ChevronRight className="h-3 w-3 text-zinc-700 shrink-0" />
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // STANDALONE phrase
              const phrase = block.phrase;
              const firstChord = analysis.chords[phrase.startIndex];
              const keyName = firstChord?.state
                ? `${firstChord.state.root} ${firstChord.state.mode === "IONIAN" ? "Maior" : "Menor"}`
                : "";
              return (
                <div
                  key={`phrase-${idx}`}
                  className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                      Frase {phrase.index + 1}
                      {phrase.formalRole && (
                        <span className="ml-2 text-[9px] text-zinc-500 font-bold normal-case">
                          (
                          {phrase.formalRole === "ANTECEDENT"
                            ? "Antecedente"
                            : phrase.formalRole === "CONSEQUENT"
                            ? "Consequente"
                            : "Independente"}
                          )
                        </span>
                      )}
                    </span>
                    {keyName && <span className="text-[9px] text-zinc-500">{keyName}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: phrase.endIndex - phrase.startIndex + 1 }).map((_, si) => {
                      const cIdx = phrase.startIndex + si;
                      const isActive = selectedChordIdx === cIdx;
                      return (
                        <div key={cIdx} className="flex items-center gap-1">
                          <button
                            id={`structure-standalone-chord-${cIdx}`}
                            onClick={() => selectChord(cIdx)}
                            className={`flex flex-col p-2 rounded-xl border text-center cursor-pointer transition w-[80px] ${
                              isActive
                                ? "bg-purple-950/30 border-purple-500"
                                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                            }`}
                          >
                            <span className="text-[11px] font-black text-zinc-200 truncate">
                              {getChordDisplay(progressionChords[cIdx])}
                            </span>
                            {scoreSnapshot.harmonies[cIdx] && (
                              <span className="text-[8px] text-zinc-600 mt-0.5">
                                c.{scoreSnapshot.harmonies[cIdx].measure}
                              </span>
                            )}
                          </button>
                          {si < phrase.endIndex - phrase.startIndex && (
                            <ChevronRight className="h-3 w-3 text-zinc-700 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PANEL: MAPA DE TENSÃO ───────────────────────────── */}
        {activePanel === "tensao" && (
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-purple-500" />
              Mapa de Tensão Harmônica — clique em uma barra para selecionar
            </div>

            {/* Tension chart */}
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
                      className={`flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200 ${
                        isActive ? "scale-105" : "hover:scale-[1.03]"
                      }`}
                      title={`${getChordDisplay(progressionChords[idx])} — Tensão: ${getTensionLabel(td.tension)}`}
                    >
                      {/* Value label */}
                      <span className="text-[9px] font-black text-zinc-500 group-hover:text-zinc-300 transition">
                        {Math.round(td.tension * 100)}
                      </span>
                      {/* Bar */}
                      <div
                        className={`w-10 rounded-t-lg transition-all duration-300 ${getTensionColor(td.tension)} ${
                          isActive
                            ? "ring-2 ring-white/40 shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                            : "opacity-80 group-hover:opacity-100"
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                      {/* Chord label */}
                      <span
                        className={`text-[9px] font-black uppercase truncate w-10 text-center transition ${
                          isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                        }`}
                      >
                        {getChordDisplay(progressionChords[idx])}
                      </span>
                      {scoreSnapshot.harmonies[idx] && (
                        <span className="text-[7.5px] text-zinc-700 font-bold">
                          c.{scoreSnapshot.harmonies[idx].measure}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold flex-wrap">
              {[
                { color: "bg-emerald-500/80", label: "Estável (<25%)" },
                { color: "bg-amber-400/80", label: "Leve (25–50%)" },
                { color: "bg-orange-500/80", label: "Alta (50–75%)" },
                { color: "bg-rose-500/90", label: "Máxima (>75%)" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>

            {/* Selected chord detail in tension view */}
            {selectedChordIdx !== null && tensionData[selectedChordIdx] && (
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 flex flex-col gap-2 animate-scale-up">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-black text-zinc-200">
                    {getChordDisplay(progressionChords[selectedChordIdx])} — Compasso {selectedChordIdx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getTensionGlowColor(tensionData[selectedChordIdx].tension)}`}
                  >
                    Tensão: {getTensionLabel(tensionData[selectedChordIdx].tension)}
                  </span>
                </div>
                {analysis.chords[selectedChordIdx]?.harmonicFunction && (
                  <div className="text-[11px] text-zinc-400">
                    Função harmônica:{" "}
                    <span className="text-purple-300 font-bold">
                      {getFunctionLabel(analysis.chords[selectedChordIdx].harmonicFunction)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PANEL: AUDITORIA TÉCNICA ────────────────────────── */}
        {activePanel === "auditoria" && (
          <div className="flex flex-col gap-4">
            {/* Tonal Centre Header (Movido da Narrativa) */}
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

            {/* Regional Flow (Movido da Narrativa) */}
            {(analysis.regions || []).length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                {(analysis.regions || []).map((reg, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1.5 rounded-lg border border-purple-800/40 bg-purple-950/20 text-[10px] font-black text-purple-300 uppercase">
                      {reg.baseCenter.root} {reg.baseCenter.mode === "MAJOR" ? "M" : "m"}
                      <span className="ml-1 text-zinc-500 font-bold normal-case">
                        [{reg.startIndex + 1}–{reg.endIndex + 1}]
                      </span>
                    </span>
                    {idx < (analysis.regions || []).length - 1 && (
                      <ChevronRight className="h-3 w-3 text-zinc-600" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <ShieldAlert className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider">
                Linter Harmônico & Observabilidade
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Audite a condução de vozes, estabilidade interpretativa e conflitos teóricos.
            </p>

            {diagnostics.length === 0 ? (
              <div className="p-8 rounded-xl border border-emerald-900/30 bg-emerald-950/10 text-center text-emerald-400 text-xs font-bold">
                ✅ Nenhum problema detectado na progressão.
              </div>
            ) : (
              <InspectorDashboard diagnostics={diagnostics} totalMeasures={progressionChords.length} />
            )}

            {/* Technical metrics toggle */}
            <button
              onClick={() => setTechnicalExpanded(!technicalExpanded)}
              className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-wider cursor-pointer transition"
            >
              {technicalExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Métricas Técnicas (ADI, CFS, ISS, TAS, TFI)
            </button>

            {technicalExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-scale-up">
                {[
                  {
                    key: "ADI",
                    label: "Dens. Analítica",
                    value: (diagnostics.length / Math.max(1, progressionChords.length)).toFixed(2),
                    color: "text-sky-400",
                  },
                  {
                    key: "CFS",
                    label: "Estabilidade",
                    value:
                      diagnostics.filter((d) => d.severity === "info").length === diagnostics.length
                        ? "Alta"
                        : "Média",
                    color: "text-emerald-400",
                  },
                  {
                    key: "ISS",
                    label: "Score Intègre",
                    value: Math.max(
                      0,
                      1 - diagnostics.filter((d) => d.severity === "critical").length * 0.3
                    ).toFixed(2),
                    color: "text-amber-400",
                  },
                  {
                    key: "TAS",
                    label: "Tensão Méd.",
                    value: tensionData.length
                      ? (tensionData.reduce((a, b) => a + b.tension, 0) / tensionData.length).toFixed(2)
                      : "—",
                    color: "text-orange-400",
                  },
                  {
                    key: "TFI",
                    label: "Índice Tonal",
                    value: (analysis.regions || []).length === 1 ? "Monotonal" : "Politonal",
                    color: "text-purple-400",
                  },
                ].map((m) => (
                  <div
                    key={m.key}
                    className="flex flex-col gap-1.5 p-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30"
                  >
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{m.key}</span>
                    <span className={`text-base font-black ${m.color}`}>{m.value}</span>
                    <span className="text-[9px] text-zinc-600">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PANEL: EXPLORAÇÃO CONTEXTUAL ────────────────────── */}
        {activePanel === "exploracao" && (
          <div className="flex flex-col gap-5">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Rearmonização Contextual — selecione um compasso e explore alternativas
            </div>

            {/* Chord selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-zinc-600 font-bold">Compasso selecionado:</span>
              <div className="flex gap-2 flex-wrap">
                {progressionChords.map((chord, idx) => {
                  const isActive = selectedChordIdx === idx;
                  return (
                    <button
                      key={idx}
                      id={`exploration-chord-${idx}`}
                      onClick={() => {
                        selectChord(idx);
                        setReharmoResult(null);
                      }}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-black cursor-pointer transition ${
                        isActive
                          ? "bg-purple-950/40 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                      }`}
                    >
                      <span className="block">{getChordDisplay(chord)}</span>
                      <span className="text-[7.5px] text-zinc-600 font-bold">c.{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reharmonisation action buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                Intenção de rearmonização para{" "}
                <span className="text-purple-300">
                  {selectedChordIdx !== null
                    ? getChordDisplay(progressionChords[selectedChordIdx])
                    : "—"}
                </span>
                :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REHARMONISATION_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    id={`reharmonise-${btn.id}`}
                    onClick={() => applyReharmonisation(btn.id)}
                    className={`group flex flex-col gap-1 p-3.5 rounded-xl border bg-gradient-to-br ${btn.color} cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <span className="text-base">{btn.emoji}</span>
                    <span className="text-[11px] font-black">{btn.label}</span>
                    <span className="text-[9px] opacity-70 leading-tight">{btn.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reharmonisation Result */}
            {reharmoResult && (
              <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/20 flex flex-col gap-3 animate-scale-up">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Sugestão: {getChordDisplay(reharmoResult)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400">
                    Substituir{" "}
                    <span className="text-zinc-200 font-bold">
                      {selectedChordIdx !== null
                        ? getChordDisplay(progressionChords[selectedChordIdx])
                        : ""}
                    </span>{" "}
                    por{" "}
                    <span className="text-amber-300 font-black">{getChordDisplay(reharmoResult)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playChordAudio(reharmoResult)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 rounded-lg text-[10px] font-black text-amber-300 cursor-pointer transition"
                  >
                    <Volume2 className="h-3 w-3" /> Ouvir
                  </button>
                  <button
                    onClick={() => {
                      if (selectedChordIdx !== null) {
                        const { setProgressionChords } = useChordStore.getState();
                        const newChords = [...progressionChords];
                        newChords[selectedChordIdx] = reharmoResult;
                        setProgressionChords(newChords);
                        setReharmoResult(null);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 rounded-lg text-[10px] font-black text-purple-300 cursor-pointer transition"
                  >
                    <Zap className="h-3 w-3" /> Aplicar na Partitura
                  </button>
                  <button
                    onClick={() => setReharmoResult(null)}
                    className="text-zinc-600 hover:text-zinc-400 text-[9px] font-bold cursor-pointer transition"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {selectedChordIdx === null && (
              <div className="p-6 text-center text-zinc-600 text-xs font-bold">
                Selecione um compasso acima para habilitar as sugestões de rearmonização.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
