import React, { useState } from "react";
import { useChordStore, TUNING_PRESETS } from "../store/useChordStore";
import { Music, Sparkles, Sliders } from "lucide-react";

const NOTE_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OCTAVES = [1, 2, 3, 4, 5];

export default function Header() {
  const {
    tuningPreset,
    tuning,
    setTuning,
    updateCustomStringTuning,
    notationStyle,
    setNotationStyle
  } = useChordStore();

  const [showTuning, setShowTuning] = useState(false);

  const handleTuningPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const selected = TUNING_PRESETS.find(p => p.name === presetName);
    if (selected) {
      setTuning(presetName, selected.notes);
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

            {/* Estilo de Cifragem */}
            <div className="flex flex-col gap-1 md:w-1/4">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Estilo de Cifragem</label>
              <select
                value={notationStyle}
                onChange={(e) => setNotationStyle(e.target.value as "Jazz" | "Brazilian" | "Academic")}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
              >
                <option value="Jazz">Jazz / Internacional (Cmaj7)</option>
                <option value="Brazilian">Nacional / MPB (C7M)</option>
                <option value="Academic">Acadêmico / Bop (CΔ7)</option>
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

    </header>
  );
}
