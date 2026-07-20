import React, { useState } from "react";
import { useChordStore } from "../../../store/useChordStore";
import { INSTRUMENTS } from "../../../utils/music/models/InstrumentTuning";
import { TUNING_NOTE_OPTIONS } from "../services/tuningNoteOptions";
import { Sparkles, Sliders } from "lucide-react";

export default function TuningSettings() {
  const {
    activeInstrument,
    setInstrument,
    tuningPreset,
    tuning,
    setTuning,
    updateCustomStringTuning,
    notationStyle,
    setNotationStyle
  } = useChordStore();

  const [showTuning, setShowTuning] = useState(false);

  const currentInstrumentObj = INSTRUMENTS.find(i => i.name === activeInstrument) || INSTRUMENTS[0];
  const currentPresets = currentInstrumentObj.tuningPresets;

  const handleTuningPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const selected = currentPresets.find(p => p.name === presetName);
    if (selected) {
      setTuning(presetName, selected.notes);
    }
  };

  return (
    <div className="flex flex-col items-end relative z-50">
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
        Afinação
      </button>

      {showTuning && (
        <div className="absolute top-full mt-2 right-0 w-[800px] max-w-[90vw] flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-2xl animate-scale-up bg-zinc-950/95 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-extrabold text-zinc-100 uppercase tracking-wider">Afinações</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 font-bold uppercase tracking-wider">
              {tuningPreset}
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
            <div className="flex flex-col gap-1 xl:col-span-3">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Instrumento</label>
              <select
                value={activeInstrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
              >
                {INSTRUMENTS.map(i => (
                  <option key={i.name} value={i.name}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 xl:col-span-3">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Afinação</label>
              <select
                value={tuningPreset}
                onChange={handleTuningPresetChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
              >
                {currentPresets.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
                <option value="Personalizado" disabled>Personalizado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 xl:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Estilo de Cifragem</label>
              <select
                value={notationStyle}
                onChange={(e) => setNotationStyle(e.target.value as "International" | "Brazilian" | "Academic")}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
              >
                <option value="International">Internacional (Cmaj7)</option>
                <option value="Brazilian">Nacional / MPB (C7M)</option>
                <option value="Academic">Acadêmico / Bop (CΔ7)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 xl:col-span-4">
              <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Ajuste por corda (1ª à {tuning.length}ª)
              </label>
              <div 
                className="grid gap-1.5" 
                style={{ gridTemplateColumns: `repeat(${tuning.length}, minmax(0, 1fr))` }}
              >
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
                        className="bg-zinc-950 border border-zinc-850 rounded-md text-[10px] py-1 px-0.5 text-center font-bold text-zinc-350 cursor-pointer focus:outline-none focus:border-purple-500"
                      >
                        {TUNING_NOTE_OPTIONS.map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
