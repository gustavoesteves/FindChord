import { useState } from "react";
import { useChordStore } from "../store/useChordStore";
import { analyzeProgression } from "../utils/music/analysis/functionalAnalysis";
import { playGuitarChord } from "../utils/audioSynth";
import { parseChord } from "../utils/music/theory/chordParser";
import { formatChordName } from "../utils/music/theory/enharmonics";
import { Note as TonalNote } from "tonal";
import { 
  X, 
  BookOpen, 
  Brain, 
  Volume2, 
  Activity, 
  ArrowRight, 
  CheckCircle,
  HelpCircle,
  Clock
} from "lucide-react";

// Mapeamento de cores premium para Intenções Harmônicas (F6)
const intentColors: Record<string, string> = {
  PROLONGATION: "text-sky-400 bg-sky-950/40 border-sky-900/30",
  PREPARATION: "text-amber-400 bg-amber-950/40 border-amber-900/30",
  INTENSIFICATION: "text-orange-400 bg-orange-950/40 border-orange-900/30",
  ATTRACTION: "text-rose-400 bg-rose-950/40 border-rose-900/30",
  RESOLUTION: "text-emerald-400 bg-emerald-950/40 border-emerald-900/30",
  COLORATION: "text-purple-400 bg-purple-950/40 border-purple-900/30"
};

const intentLabels: Record<string, string> = {
  PROLONGATION: "Prolongamento",
  PREPARATION: "Preparação",
  INTENSIFICATION: "Intensificação",
  ATTRACTION: "Atração",
  RESOLUTION: "Resolução",
  COLORATION: "Coloração"
};

// Mapeamento de cores para Papéis de Frase (F6)
const roleColors: Record<string, string> = {
  OPENING: "text-blue-300 bg-blue-950/20 border-blue-900/20",
  BODY: "text-zinc-400 bg-zinc-900/30 border-zinc-800/20",
  PRE_CADENTIAL: "text-yellow-300 bg-yellow-950/20 border-yellow-900/20",
  CADENTIAL: "text-rose-300 bg-rose-950/20 border-rose-900/20",
  CLOSING: "text-emerald-300 bg-emerald-950/20 border-emerald-900/20"
};

const roleLabels: Record<string, string> = {
  OPENING: "Abertura de Frase",
  BODY: "Corpo da Frase",
  PRE_CADENTIAL: "Pré-Cadencial",
  CADENTIAL: "Área Cadencial",
  CLOSING: "Fechamento"
};

export default function HarmonicNarrativeOverlayPanel() {
  const {
    progressionChords,
    isHarmonicNarrativeOpen,
    setHarmonicNarrativeOpen,
    notationStyle
  } = useChordStore();

  const [activeTab, setActiveTab] = useState<"overview" | "phrases" | "chords" | "cadences">("overview");
  const [selectedChordIdx, setSelectedChordIdx] = useState<number | null>(null);

  // Run harmonic and semantic analysis pipeline on the current progression
  const analysis = progressionChords.length > 0 ? analyzeProgression(progressionChords) : null;

  if (!isHarmonicNarrativeOpen || !analysis || progressionChords.length === 0) return null;

  const actualSelectedIdx = (selectedChordIdx !== null && selectedChordIdx < progressionChords.length) 
    ? selectedChordIdx 
    : 0;

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
    let lastMidiChroma = -1;
    const playNotes = parsed.notes.map(note => {
      const chroma = TonalNote.get(note).chroma;
      if (chroma !== undefined && lastMidiChroma !== -1 && chroma < lastMidiChroma) {
        currentOctave++;
      }
      lastMidiChroma = chroma ?? -1;
      return `${note}${currentOctave}`;
    });

    playGuitarChord(playNotes, 45);
  };

  // Helper lists
  const activeChord = analysis.chords[actualSelectedIdx] || null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={() => setHarmonicNarrativeOpen(false)}
    >
      <div 
        className="bg-[#0E0E12]/98 border border-zinc-800/85 rounded-2xl p-5 w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] glass-panel relative animate-scale-up overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={() => setHarmonicNarrativeOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold bg-zinc-900 hover:bg-zinc-850 w-8 h-8 rounded-full flex items-center justify-center transition border border-zinc-800 cursor-pointer hover:scale-105 active:scale-95 z-10"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-3 gap-3 pr-8 select-none">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider">Narrativa Harmônica da Frase</h2>
              <p className="text-[10px] text-zinc-400 font-medium">
                Centro tonal principal: <span className="text-purple-300 font-bold">{analysis.tonalCenter.root} {analysis.tonalCenter.mode === "MAJOR" ? "Maior" : "Menor"}</span>
                {(analysis.regions || []).length > 1 && (
                  <span className="ml-2 text-zinc-500">
                    ({(analysis.regions || []).length} Regiões Harmônicas mapeadas)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-zinc-900/60 p-1 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-wider">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer ${
                activeTab === "overview" ? "bg-purple-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("phrases")}
              className={`px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer ${
                activeTab === "phrases" ? "bg-purple-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Frases
            </button>
            <button
              onClick={() => setActiveTab("chords")}
              className={`px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer ${
                activeTab === "chords" ? "bg-purple-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Acordes
            </button>
            <button
              onClick={() => setActiveTab("cadences")}
              className={`px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer ${
                activeTab === "cadences" ? "bg-purple-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Cadências
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin flex flex-col gap-4">

          {/* TAB 1: VISÃO GERAL (OVERVIEW) */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-5 animate-scale-up">
              {/* Regional Modulations Header */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-400">
                <Activity className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <span className="font-bold text-zinc-300">Estrutura Regional: </span>
                  {(analysis.regions || []).map((reg, idx) => (
                    <span key={idx} className="inline-flex items-center">
                      <span className="font-bold text-purple-300">{reg.baseCenter.root} {reg.baseCenter.mode === "MAJOR" ? "Maior" : "Menor"}</span>
                      <span className="mx-1 text-zinc-650 font-semibold">{`[Compassos ${reg.startIndex + 1}-${reg.endIndex + 1}]`}</span>
                      {idx < (analysis.regions || []).length - 1 && <span className="mx-2 text-zinc-650">➔</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Phrase chains */}
              <div className="flex flex-col gap-5">
                {(analysis.phrases || []).map((phrase, pIdx) => {
                  const firstChord = analysis.chords[phrase.startIndex];
                  const keyName = firstChord?.state ? `${firstChord.state.root} ${firstChord.state.mode === 'IONIAN' ? 'Maior' : 'Menor'}` : '';

                  return (
                    <div 
                      key={pIdx} 
                      className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/30 flex flex-col gap-3.5 relative overflow-hidden"
                    >
                      {/* Background soft glow */}
                      <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl" />
                      
                      {/* Phrase Header */}
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 select-none">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                          Frase {pIdx + 1}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase">
                          Tom Inicial: {keyName}
                        </span>
                      </div>

                      {/* Horizontally scrollable chain of chords */}
                      <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin select-none">
                        {Array.from({ length: phrase.endIndex - phrase.startIndex + 1 }).map((_, stepIdx) => {
                          const idx = phrase.startIndex + stepIdx;
                          const chord = analysis.chords[idx];
                          if (!chord) return null;

                          const isSelected = selectedChordIdx === idx;
                          const displayName = getChordDisplay(chord);
                          const semantic = chord.semantic;

                          return (
                            <div key={idx} className="flex items-center shrink-0">
                              <div
                                onClick={() => setSelectedChordIdx(idx)}
                                className={`flex flex-col p-3 rounded-xl border text-center cursor-pointer transition duration-200 hover:scale-[1.03] w-[110px] ${
                                  isSelected 
                                    ? "bg-purple-950/20 border-purple-500 shadow-[0_0_12px_rgba(255,78,140,0.15)]" 
                                    : "bg-zinc-900/40 border-zinc-850 hover:border-zinc-700/80"
                                }`}
                              >
                                <span className={`text-xs font-black tracking-wide truncate ${isSelected ? "text-white" : "text-zinc-200"}`}>
                                  {displayName}
                                </span>
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mt-1">
                                  {chord.romanNumeral || "-"}
                                </span>
                                
                                {/* Intent & Role Badges (Orthogonal) */}
                                {semantic && (
                                  <div className="flex flex-col gap-1 mt-2.5">
                                    <span className={`text-[7.5px] px-1 py-0.5 rounded font-black uppercase tracking-wider border leading-none truncate ${intentColors[semantic.intent] || "text-zinc-400 border-zinc-800"}`}>
                                      {intentLabels[semantic.intent] || semantic.intent}
                                    </span>
                                    <span className={`text-[7px] px-1 py-0.5 rounded font-bold uppercase tracking-wider border leading-none truncate ${roleColors[semantic.phraseRole] || "text-zinc-500 border-zinc-900"}`}>
                                      {roleLabels[semantic.phraseRole] || semantic.phraseRole}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {idx < phrase.endIndex && (
                                <ArrowRight className="h-4 w-4 text-zinc-750 mx-1.5 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic selected chord preview at the bottom */}
              {activeChord && (
                <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/5 flex flex-col md:flex-row justify-between gap-4 animate-scale-up select-none">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-zinc-100">{getChordDisplay(activeChord)}</span>
                      <span className="text-[10px] bg-purple-900/40 border border-purple-800/40 px-1.5 py-0.5 rounded font-black text-purple-300">
                        {activeChord.romanNumeral || "-"}
                      </span>
                      <button
                        onClick={() => playChordAudio(getChordDisplay(activeChord))}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 transition cursor-pointer active:scale-95 flex items-center justify-center border border-zinc-800"
                        title="Ouvir acorde"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeChord.semantic && (
                        <>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black uppercase tracking-wider ${intentColors[activeChord.semantic.intent]}`}>
                            {intentLabels[activeChord.semantic.intent]}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-black uppercase tracking-wider ${roleColors[activeChord.semantic.phraseRole]}`}>
                            {roleLabels[activeChord.semantic.phraseRole]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 md:max-w-xl border-t md:border-t-0 md:border-l border-zinc-900 pt-3 md:pt-0 md:pl-4">
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block mb-1.5">Fatos de Explicabilidade</span>
                    <ul className="text-[10.5px] text-zinc-400 font-medium flex flex-col gap-1 leading-normal list-disc list-inside">
                      {(activeChord.semantic?.explanation || []).map((fact: string, fIdx: number) => (
                        <li key={fIdx} className="truncate">{fact}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FLUXO FRASEOLÓGICO (PHRASES) */}
          {activeTab === "phrases" && (
            <div className="flex flex-col gap-4 animate-scale-up select-none">
              {(analysis.phrases || []).map((phrase, pIdx) => {
                return (
                  <div key={pIdx} className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/20 flex flex-col gap-4">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider select-none">
                      Estrutura da Frase {pIdx + 1}
                    </span>

                    {/* Vertical timeline flow */}
                    <div className="flex flex-col gap-3 pl-2 relative border-l border-zinc-850/80 ml-2">
                      {Array.from({ length: phrase.endIndex - phrase.startIndex + 1 }).map((_, stepIdx) => {
                        const idx = phrase.startIndex + stepIdx;
                        const chord = analysis.chords[idx];
                        if (!chord) return null;

                        const semantic = chord.semantic;
                        const isSelected = selectedChordIdx === idx;

                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setSelectedChordIdx(idx);
                              setActiveTab("chords");
                            }}
                            className={`flex items-start gap-3.5 relative py-1 cursor-pointer group ${
                              isSelected ? "text-purple-300" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {/* Marker circle on the line */}
                            <div className={`absolute -left-[13px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border transition duration-200 ${
                              isSelected 
                                ? "bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110" 
                                : "bg-zinc-950 border-zinc-700 group-hover:border-zinc-500"
                            }`} />

                            {/* Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black tracking-wide select-none ${isSelected ? "text-white" : "text-zinc-200"}`}>
                                   {getChordDisplay(chord)}
                                </span>
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider font-mono">
                                  {chord.romanNumeral || "-"}
                                </span>
                              </div>

                              {semantic && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[7px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border leading-none ${intentColors[semantic.intent]}`}>
                                    {intentLabels[semantic.intent]}
                                  </span>
                                  <span className={`text-[7px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border leading-none ${roleColors[semantic.phraseRole]}`}>
                                    {roleLabels[semantic.phraseRole]}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: AUDITORIA DO ACORDE (CHORDS) */}
          {activeTab === "chords" && (
            <div className="animate-scale-up select-none">
              {activeChord ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2">
                  
                  {/* Left Column: Semantic Info & Badges */}
                  <div className="md:col-span-5 flex flex-col gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">{getChordDisplay(activeChord)}</span>
                        <span className="text-[10px] bg-purple-900/40 border border-purple-800/40 px-2 py-0.5 rounded font-black text-purple-300 font-mono">
                          {activeChord.romanNumeral || "-"}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => playChordAudio(getChordDisplay(activeChord))}
                        className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-purple-650 hover:bg-purple-550 text-white rounded-lg transition cursor-pointer active:scale-95 shadow-sm"
                        title="Ouvir acorde"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Ouvir
                      </button>
                    </div>

                    {/* Metadata table */}
                    <div className="flex flex-col gap-2 border-t border-zinc-900 pt-3 text-[10px] font-bold text-zinc-400">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 uppercase">Tonalidade Local:</span>
                        <span className="text-zinc-200">
                          {activeChord.state ? `${activeChord.state.root} ${activeChord.state.mode === 'IONIAN' ? 'Maior' : 'Menor'}` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 uppercase">Função Diatônica:</span>
                        <span className="text-zinc-200">
                          {activeChord.harmonicFunction || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 uppercase">Classificação Contextual:</span>
                        <span className="text-purple-300">
                          {activeChord.contextualFunction || "PRIMARY"}
                        </span>
                      </div>
                    </div>

                    {/* Intent & Role */}
                    {activeChord.semantic && (
                      <div className="flex flex-col gap-2.5 border-t border-zinc-900 pt-3 select-none">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Intenção Harmônica</span>
                          <span className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-black uppercase tracking-widest text-center shadow-inner ${intentColors[activeChord.semantic.intent]}`}>
                            {intentLabels[activeChord.semantic.intent]} ({activeChord.semantic.intent})
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Papel Estrutural na Frase</span>
                          <span className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-black uppercase tracking-widest text-center shadow-inner ${roleColors[activeChord.semantic.phraseRole]}`}>
                            {roleLabels[activeChord.semantic.phraseRole]} ({activeChord.semantic.phraseRole})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Explanatory Narrative Facts */}
                  <div className="md:col-span-7 flex flex-col gap-4.5 bg-zinc-950/20 p-4 rounded-xl border border-zinc-900 relative">
                    
                    {/* Causes Badge Section */}
                    {activeChord.semantic && activeChord.semantic.causes.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Causas Identificadas (Causes)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeChord.semantic.causes.map((cause: string) => (
                            <span key={cause} className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 uppercase">
                              {cause}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supports Badge Section */}
                    {activeChord.semantic && activeChord.semantic.supports.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-zinc-900/60 pt-3">
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Evidências / Suportes (Supports)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeChord.semantic.supports.map((sup: string) => (
                            <span key={sup} className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-purple-950/20 border border-purple-500/20 text-purple-300 uppercase">
                              {sup}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explanations List */}
                    <div className="flex flex-col gap-2 border-t border-zinc-900/60 pt-3 select-none">
                      <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5 text-purple-400" />
                        Audit Factual (Professor de Harmonia)
                      </span>
                      
                      <ul className="text-xs text-zinc-300 font-semibold flex flex-col gap-2 leading-relaxed mt-1">
                        {(activeChord.semantic?.explanation || []).map((item: string, fIdx: number) => (
                          <li key={fIdx} className="flex gap-2.5 items-start">
                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                        {(!activeChord.semantic || (activeChord.semantic.explanation || []).length === 0) && (
                          <li className="text-zinc-500 italic">Nenhuma explicação disponível para este acorde.</li>
                        )}
                      </ul>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center p-8 border border-dashed border-zinc-850 rounded-2xl text-zinc-500 text-xs italic gap-1 select-none">
                  <HelpCircle className="h-6 w-6 text-zinc-700 animate-pulse" />
                  <span>Selecione um acorde nas abas anteriores para auditar suas explicações.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CADÊNCIAS (CADENCES) */}
          {activeTab === "cadences" && (
            <div className="flex flex-col gap-4 animate-scale-up select-none">
              {(analysis.cadences || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.cadences || []).map((cad, idx) => {
                    const statusColors: Record<string, string> = {
                      RESOLVED: "text-emerald-400 bg-emerald-950/30 border-emerald-900/40",
                      DECEPTIVE: "text-purple-400 bg-purple-950/30 border-purple-900/40",
                      EVADED: "text-rose-400 bg-rose-950/30 border-rose-900/40",
                      INTERRUPTED: "text-amber-400 bg-amber-950/30 border-amber-900/40",
                      DELAYED: "text-sky-400 bg-sky-950/30 border-sky-900/40"
                    };

                    const statusLabels: Record<string, string> = {
                      RESOLVED: "Resolvida",
                      DECEPTIVE: "Deceptiva (Falsa)",
                      EVADED: "Evadida",
                      INTERRUPTED: "Interrompida",
                      DELAYED: "Atrasada/Suspensa"
                    };

                    const strengthLabels: Record<string, string> = {
                      STRONG: "Forte",
                      MODERATE: "Moderada",
                      WEAK: "Fraca"
                    };

                    return (
                      <div 
                        key={idx} 
                        className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col gap-3 relative overflow-hidden"
                      >
                        {/* Title & Type */}
                        <div className="flex justify-between items-start select-none">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                              Cadência {cad.type}
                            </span>
                            <span className="text-xs font-black text-zinc-200 mt-0.5">{cad.name}</span>
                          </div>

                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors[cad.resolution.status]}`}>
                            {statusLabels[cad.resolution.status] || cad.resolution.status}
                          </span>
                        </div>

                        {/* Metadados */}
                        <div className="grid grid-cols-2 gap-2 mt-1 py-2 border-t border-b border-zinc-900 text-[10px] font-bold text-zinc-400">
                          <div className="flex justify-between pr-2 border-r border-zinc-900">
                            <span className="text-zinc-500 uppercase">Força:</span>
                            <span className="text-zinc-200">{strengthLabels[cad.strength] || cad.strength}</span>
                          </div>
                          <div className="flex justify-between pl-2">
                            <span className="text-zinc-500 uppercase">Intervalo:</span>
                            <span className="text-zinc-200">{`Comp. ${cad.startIndex + 1}-${cad.endIndex + 1}`}</span>
                          </div>
                        </div>

                        {/* Cadential Weight */}
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">
                            <span>Peso de Convicção (F7)</span>
                            <span className="text-purple-300 font-extrabold">{Math.round((cad.cadentialWeight || 0.5) * 100)}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full" 
                              style={{ width: `${Math.round((cad.cadentialWeight || 0.5) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Explaining string */}
                        {(() => {
                          const targetChordObj = cad.resolution.targetChordIndex !== undefined ? analysis.chords[cad.resolution.targetChordIndex] : undefined;
                          if (!targetChordObj) return null;
                          const targetChordName = getChordDisplay(targetChordObj);
                          return (
                            <div className="text-[9.5px] text-zinc-400 font-medium italic mt-1.5 flex items-center gap-1 leading-normal select-none">
                              <Clock className="h-3 w-3 text-purple-400 shrink-0" />
                              <span>Resoluções esperadas em direção ao acorde <b className="text-zinc-300">{targetChordName}</b>.</span>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center p-8 border border-dashed border-zinc-850 rounded-2xl text-zinc-500 text-xs italic gap-1 select-none">
                  <HelpCircle className="h-6 w-6 text-zinc-700 animate-pulse" />
                  <span>Nenhuma cadência formal confirmada na progressão atual.</span>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
