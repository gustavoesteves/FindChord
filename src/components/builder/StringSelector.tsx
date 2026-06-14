import React from "react";
import { useBuilder } from "./context/BuilderContext";
import { getNoteAt } from "../../utils/music/core/notes";
import { Volume2, VolumeX } from "lucide-react";

export const StringSelector: React.FC = () => {
  const { state, actions } = useBuilder();

  return (
    <div className="w-full flex flex-col gap-3 p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">Status das Cordas (Abafamento)</h3>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {state.tuning.map((stringNote, idx) => {
          const fret = state.selectedFrets[idx];
          const isMuted = fret === null;
          const noteName = isMuted ? "X" : getNoteAt(stringNote, fret);

          return (
            <button
              key={idx}
              onClick={() => actions.muteString(idx)}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all select-none cursor-pointer ${
                isMuted
                  ? "bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-950/30"
                  : "bg-purple-950/20 border-purple-800/40 text-purple-300 hover:bg-purple-950/30"
              }`}
            >
              <div className="flex justify-between w-full text-[9px] font-black uppercase text-zinc-500">
                <span>{idx + 1}ª Corda</span>
                <span>{stringNote}</span>
              </div>
              <div className="flex items-center gap-1.5 my-0.5">
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-red-500 animate-pulse" />
                ) : (
                  <Volume2 className="h-4 w-4 text-purple-400" />
                )}
                <span className="font-extrabold text-sm tracking-wide">
                  {isMuted ? "MUTE" : noteName.replace(/\d/, "")}
                </span>
              </div>
              <div className="text-[9px] font-bold text-zinc-400 uppercase">
                {isMuted ? "Abafada" : fret === 0 ? "Solta" : `Casa ${fret}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
