import React from "react";
import { useBuilder } from "./context/BuilderContext";
import { INSTRUMENTS, useChordStore } from "../../store/useChordStore";
import { Sparkles } from "lucide-react";

const NOTE_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OCTAVES = [1, 2, 3, 4, 5];

export const TuningSelector: React.FC = () => {
  const { state, actions } = useBuilder();

  const currentInstrumentObj = INSTRUMENTS.find(i => i.name === state.activeInstrument) || INSTRUMENTS[0];
  const currentPresets = currentInstrumentObj.tuningPresets;

  const handleTuningPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const selected = currentPresets.find(p => p.name === presetName);
    if (selected) {
      actions.setTuning(presetName, selected.notes);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">Afinador & Afinações do Builder</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 font-bold uppercase tracking-wider">
          {state.tuningPreset}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Seletor de Instrumento */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Instrumento</label>
          <select
            value={state.activeInstrument}
            onChange={(e) => actions.setInstrument(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
          >
            {INSTRUMENTS.map(i => (
              <option key={i.name} value={i.name}>{i.name}</option>
            ))}
          </select>
        </div>

        {/* Seletor de Presets */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Preset de Afinação</label>
          <select
            value={state.tuningPreset}
            onChange={handleTuningPresetChange}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
          >
            {currentPresets.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
            <option value="Personalizado" disabled>Personalizado</option>
          </select>
        </div>

        {/* Estilo de Cifragem */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Estilo de Cifragem</label>
          <select
            value={state.notationStyle}
            onChange={(e) => {
              // Sincroniza o estilo de notação no store principal
              const setNotationStyle = (useChordStore.getState() as any).setNotationStyle;
              if (setNotationStyle) setNotationStyle(e.target.value);
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer transition font-semibold"
          >
            <option value="Jazz">Jazz / Internacional (Cmaj7)</option>
            <option value="Brazilian">Nacional / MPB (C7M)</option>
            <option value="Academic">Acadêmico / Bop (CΔ7)</option>
          </select>
        </div>

        {/* Ajuste Individual das Cordas */}
        <div className="flex flex-col gap-1 md:col-span-3 border-t border-zinc-800/40 pt-3 mt-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Ajuste Fino por Corda (1ª à {state.tuning.length}ª)
          </label>
          <div 
            className="grid gap-1.5" 
            style={{ gridTemplateColumns: `repeat(${state.tuning.length}, minmax(0, 1fr))` }}
          >
            {state.tuning.map((note, index) => {
              const match = note.match(/^([A-G][b#]?)(.*)$/);
              const noteName = match ? match[1] : "E";
              const octave = match ? parseInt(match[2]) : 4;
              
              return (
                <div key={`builder-string-tune-${index}`} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-center font-black text-zinc-500 uppercase">{`${index + 1}ª`}</span>
                  <select
                    value={`${noteName}${octave}`}
                    onChange={(e) => actions.updateCustomStringTuning(index, e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 rounded-md text-[10px] py-1 px-0.5 text-center font-bold text-zinc-350 cursor-pointer focus:outline-none focus:border-purple-500"
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
  );
};
