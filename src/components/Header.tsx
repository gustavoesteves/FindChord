import React, { useState } from "react";
import { useChordStore, TUNING_PRESETS } from "../store/useChordStore";
import { getNoteAt } from "../utils/musicTheory";
import { Music, RotateCcw, Search, Sparkles, Sliders } from "lucide-react";

const NOTE_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OCTAVES = [1, 2, 3, 4, 5];

const CHORD_QUALITIES = [
  { label: "Maior (Tríade)", value: "" },
  { label: "Menor (Tríade)", value: "m" },
  { label: "Diminuto", value: "dim" },
  { label: "Aumentado", value: "aug" },
  { label: "Sus2", value: "sus2" },
  { label: "Sus4", value: "sus4" },
  { label: "Dominante 7", value: "7" },
  { label: "Sétima Maior (maj7)", value: "maj7" },
  { label: "Sétima menor (m7)", value: "m7" },
  { label: "Menor com 7ª Maior (mMaj7)", value: "mMaj7" },
  { label: "Meio-Diminuto (m7b5)", value: "m7b5" },
  { label: "Diminuto 7 (dim7)", value: "dim7" },
  { label: "Adicionado 9 (add9)", value: "add9" },
  { label: "Menor add9 (madd9)", value: "madd9" },
  { label: "Nona Maior (9)", value: "9" },
  { label: "Sétima com nona menor (7b9)", value: "7b9" },
  { label: "Sétima com nona aumentada (7#9)", value: "7#9" },
  { label: "Sétima com 5ª bemol (7b5)", value: "7b5" },
  { label: "Sétima com 5ª sustenida (7#5)", value: "7#5" },
  { label: "Décima Primeira (11)", value: "11" },
  { label: "Sétima com 11ª aumentada (7#11)", value: "7#11" },
  { label: "Décima Terceira (13)", value: "13" }
];

export default function Header() {
  const {
    tuningPreset,
    tuning,
    setTuning,
    updateCustomStringTuning,
    clearFretboard,
    fretboardExplorerMode,
    setFretboardExplorerMode,
    toggleFret
  } = useChordStore();

  const [showTuning, setShowTuning] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const [reverseRoot, setReverseRoot] = useState("C");
  const [reverseQuality, setReverseQuality] = useState("");

  const handleTuningPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const selected = TUNING_PRESETS.find(p => p.name === presetName);
    if (selected) {
      setTuning(presetName, selected.notes);
    }
  };

  // Executa o modo Chord Construction / Reverso
  const buildChordReverse = () => {
    clearFretboard();
    
    // Ativa o Explorer Mode para acender todas as notas correspondentes
    setFretboardExplorerMode(true);
    
    // Para que o sistema detecte o acorde criado, vamos forçar uma marcação física básica
    // (ex: a tônica na corda mais grave que a possuir)
    let placed = false;
    for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
      const baseNote = tuning[stringIdx];
      for (let fret = 0; fret <= 15; fret++) {
        const noteName = getNoteAt(baseNote, fret).replace(/\d/, "");
        if (noteName === reverseRoot && !placed) {
          toggleFret(stringIdx, fret);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  };

  return (
    <header className="w-full flex flex-col gap-4">
      {/* Brand Title Row with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Music className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Guitar Chord Analyzer & Harmony Lab
            </h1>
            <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
              Estúdio Inteligente de Análise e Condução de Acordes
            </p>
          </div>
        </div>

        {/* Action Controls Menu */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Tuning Button */}
          <button
            onClick={() => {
              setShowTuning(!showTuning);
              setShowBuilder(false); // Fecha o outro
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-md ${
              showTuning
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-zinc-900 border-zinc-850 hover:bg-zinc-850 hover:text-white text-zinc-300"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            ⚙️ Afinação
          </button>

          {/* Toggle Chord Builder Button */}
          <button
            onClick={() => {
              setShowBuilder(!showBuilder);
              setShowTuning(false); // Fecha o outro
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-md ${
              showBuilder
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-zinc-900 border-zinc-850 hover:bg-zinc-850 hover:text-white text-zinc-300"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            🔍 Construtor
          </button>

          {/* Global Reset */}
          <button
            onClick={() => {
              clearFretboard();
              setFretboardExplorerMode(false);
              setShowTuning(false);
              setShowBuilder(false);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-400 cursor-pointer transition shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar Braço
          </button>
        </div>
      </div>

      {/* Collapsible Panels */}
      
      {/* 1. Panel Tuning (Afinação) */}
      {showTuning && (
        <div className="w-full flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg animate-scale-up">
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-extrabold text-zinc-100 uppercase tracking-wider">Afinador & Afinações</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 font-bold uppercase tracking-wider">
              {tuningPreset}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Seletor de Presets */}
            <div className="flex flex-col gap-1 md:w-1/3">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Preset de Afinação</label>
              <select
                value={tuningPreset}
                onChange={handleTuningPresetChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
              >
                {TUNING_PRESETS.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
                <option value="Personalizado" disabled>Personalizado</option>
              </select>
            </div>

            {/* Ajuste Individual das Cordas */}
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Ajuste Fino por Corda (1ª à 6ª)</label>
              <div className="grid grid-cols-6 gap-2">
                {tuning.map((note, index) => {
                  const match = note.match(/^([A-G][b#]?)(.*)$/);
                  const noteName = match ? match[1] : "E";
                  const octave = match ? parseInt(match[2]) : 4;
                  
                  return (
                    <div key={`string-tune-${index}`} className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-center font-black text-zinc-500 uppercase">{`${index + 1}ª`}</span>
                      <select
                        value={`${noteName}${octave}`}
                        onChange={(e) => updateCustomStringTuning(index, e.target.value)}
                        className="bg-zinc-950 border border-zinc-850 rounded-md text-xs py-1.5 px-0.5 text-center font-bold text-zinc-300 cursor-pointer focus:outline-none focus:border-purple-500"
                      >
                        {OCTAVES.flatMap(oct => 
                          NOTE_CLASSES.map(n => {
                            const val = `${n}${oct}`;
                            return (
                              <option key={val} value={val}>{val}</option>
                            );
                          })
                        )}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Panel Chord Builder (Construtor) */}
      {showBuilder && (
        <div className="w-full flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg animate-scale-up">
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-extrabold text-zinc-100 uppercase tracking-wider">Construtor de Acordes Reverso</h2>
            </div>
            {fretboardExplorerMode && (
              <button 
                onClick={() => setFretboardExplorerMode(false)}
                className="text-[9px] px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold transition hover:bg-amber-900 cursor-pointer uppercase tracking-wider"
              >
                Desativar Fret Explorer
              </button>
            )}
          </div>

          <div className="flex items-end gap-3">
            {/* Tônica */}
            <div className="flex flex-col gap-1 w-1/4">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Tônica</label>
              <select
                value={reverseRoot}
                onChange={(e) => setReverseRoot(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-zinc-200 font-black focus:outline-none focus:border-purple-500 cursor-pointer transition"
              >
                {NOTE_CLASSES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Qualidade do Acorde */}
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Tipo de Acorde</label>
              <select
                value={reverseQuality}
                onChange={(e) => setReverseQuality(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
              >
                {CHORD_QUALITIES.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>

            {/* Ação */}
            <button
              onClick={buildChordReverse}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/20 cursor-pointer border border-purple-500/30 transition-all transform active:scale-95"
            >
              Construir
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Selecione uma cifra e o sistema irá encontrar todas as notas no braço inteiro de 24 trastes e mapear voicings clássicos instantaneamente no Fretboard Explorer!
          </p>
        </div>
      )}

    </header>
  );
}
