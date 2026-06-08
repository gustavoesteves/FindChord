import { useState } from "react";
import { useChordStore } from "../../store/useChordStore";
import { generateHarmonicField, type DiatonicChordInfo } from "../../utils/music/analysis/harmonicField";
import { analyzeProgression } from "../../utils/music/analysis/functionalAnalysis";
import { parseChord } from "../../utils/music/theory/chordParser";
import { playGuitarChord } from "../../utils/audioSynth";
import { Note as TonalNote } from "tonal";
import { Music, X, PlusCircle, Volume2 } from "lucide-react";

export default function DiatonicFieldOverlayPanel() {
  const {
    progressionChords,
    setProgressionChords,
  } = useChordStore();

  const isDiatonicFieldOpen = false;
  const setDiatonicFieldOpen = () => {};

  const [chordFormat, setChordFormat] = useState<'triad' | 'tetrad'>('tetrad');
  const [minorFieldMode, setMinorFieldMode] = useState<'natural' | 'harmonic'>('harmonic');

  if (!isDiatonicFieldOpen || progressionChords.length === 0) return null;

  // Run harmonic analysis to find current tonal center
  const analysis = analyzeProgression(progressionChords);
  const { root, mode, confidence } = analysis.tonalCenter;

  const diatonicChords = generateHarmonicField(
    root,
    mode,
    chordFormat,
    minorFieldMode,
    progressionChords
  );

  const handleAddDiatonicChord = (chordSymbol: string) => {
    setProgressionChords([...progressionChords, chordSymbol]);
  };

  const playDiatonicChord = (chordSymbol: string) => {
    const parsed = parseChord(chordSymbol);
    if (parsed.empty) return;

    let currentOctave = 3;
    let lastMidiChroma = -1;
    const playNotes = parsed.notes.map((note: string) => {
      const chroma = TonalNote.get(note).chroma;
      if (chroma !== undefined && lastMidiChroma !== -1 && chroma < lastMidiChroma) {
        currentOctave++;
      }
      lastMidiChroma = chroma ?? -1;
      return `${note}${currentOctave}`;
    });

    playGuitarChord(playNotes, 45);
  };

  const getChordLabel = (chordName: string) => {
    return chordName;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      onClick={() => setDiatonicFieldOpen()}
    >
      <div 
        className="bg-[#121216]/98 border border-zinc-800/85 rounded-2xl p-6 w-full max-w-4xl shadow-2xl flex flex-col glass-panel relative animate-scale-up select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button 
          onClick={() => setDiatonicFieldOpen()}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold bg-zinc-900 hover:bg-zinc-850 w-8 h-8 rounded-full flex items-center justify-center transition border border-zinc-800 cursor-pointer hover:scale-105 active:scale-95"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header do Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-4 gap-4 pr-8 select-none">
          <div className="flex items-center gap-2.5">
            <Music className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-100 uppercase tracking-widest">Campo Harmônico Diatônico</h2>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Tom de referência da progressão: <span className="text-purple-300 font-bold">{root} {mode === "MAJOR" ? "Maior" : "Menor"}</span>
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold font-mono">
                  Confiança: {Math.round(confidence * 100)}%
                </span>
              </p>
            </div>
          </div>

          {/* Controles de Visualização */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor Tríade/Tétrade */}
            <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setChordFormat("triad")}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition duration-150 cursor-pointer ${
                  chordFormat === "triad"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Tríades
              </button>
              <button
                onClick={() => setChordFormat("tetrad")}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition duration-150 cursor-pointer ${
                  chordFormat === "tetrad"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Tétrades
              </button>
            </div>

            {/* Seletor Menor Natural/Harmônica (Apenas se tom for Menor) */}
            {mode === "MINOR" && (
              <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setMinorFieldMode("natural")}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition duration-150 cursor-pointer ${
                    minorFieldMode === "natural"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Natural
                </button>
                <button
                  onClick={() => setMinorFieldMode("harmonic")}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition duration-150 cursor-pointer ${
                    minorFieldMode === "harmonic"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Harmônica
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4.5 mt-6 pb-2">
          {diatonicChords.map((diatonic: DiatonicChordInfo) => {
            const { degree, chordSymbol, harmonicFunction, isActive, isHarmonicMinorVariant } = diatonic;

            const badgeColor =
              harmonicFunction === "TONIC"
                ? "bg-sky-950/80 text-sky-300 border-sky-500/20"
                : harmonicFunction === "SUBDOMINANT"
                ? "bg-amber-950/80 text-amber-300 border-amber-500/20"
                : "bg-rose-950/80 text-rose-300 border-rose-500/20";

            const functionLabel =
              harmonicFunction === "TONIC" ? "T" : harmonicFunction === "SUBDOMINANT" ? "SD" : "D";

            return (
              <div
                key={chordSymbol + degree}
                className={`group relative flex flex-col justify-between p-4.5 rounded-xl border transition-all duration-300 bg-zinc-900/20 select-none ${
                  isActive
                    ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)] bg-purple-950/10 scale-[1.03]"
                    : "border-zinc-850 hover:bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                {/* Top Bar: Grau + Função */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-black ${isActive ? "text-purple-400" : "text-zinc-500"}`}>
                    {degree}
                  </span>
                  <div className="flex items-center gap-1">
                    {isHarmonicMinorVariant && (
                      <span className="text-[7px] px-1 py-[1.5px] rounded bg-purple-950/50 border border-purple-500/20 text-purple-300 font-bold uppercase" title="Variante Harmônica">
                        Harm
                      </span>
                    )}
                    <span className={`text-[8px] font-black px-1.5 py-[1.5px] rounded border ${badgeColor}`}>
                      {functionLabel}
                    </span>
                  </div>
                </div>

                {/* Middle: Cifra */}
                <div className="text-center py-4 flex flex-col items-center justify-center">
                  <span className={`text-base font-black tracking-wide ${isActive ? "text-zinc-100" : "text-zinc-300"}`}>
                    {getChordLabel(chordSymbol)}
                  </span>
                </div>

                {/* Bottom Bar: Ações (Play e +) */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-850/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2">
                  <button
                    onClick={() => playDiatonicChord(chordSymbol)}
                    className="p-1.5 rounded bg-zinc-850/80 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 transition cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
                    title="Ouvir acorde"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleAddDiatonicChord(chordSymbol)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[8px] font-black uppercase tracking-wider transition cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                    title="Adicionar à timeline"
                  >
                    <PlusCircle className="h-2.5 w-2.5" />
                    <span>+ Add</span>
                  </button>
                </div>

                {/* Indicador Ativo sutil */}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
