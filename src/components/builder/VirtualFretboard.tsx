import React, { useState, useEffect } from "react";
import { useBuilder } from "./context/BuilderContext";
import { getNoteAt } from "../../utils/music/core/notes";
import { playGuitarNote } from "../../utils/audioSynth";
import { Volume2, RotateCcw } from "lucide-react";

export const VirtualFretboard: React.FC = () => {
  const { state, actions } = useBuilder();
  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>([]);

  useEffect(() => {
    setVibratingStrings(Array(state.tuning.length).fill(false));
  }, [state.tuning.length]);

  const triggerStringPlay = (stringIndex: number, noteName: string) => {
    playGuitarNote(noteName);
    const newVibrating = [...vibratingStrings];
    newVibrating[stringIndex] = true;
    setVibratingStrings(newVibrating);

    setTimeout(() => {
      setVibratingStrings(prev => {
        const next = [...prev];
        next[stringIndex] = false;
        return next;
      });
    }, 600);
  };

  const playCurrentFretboard = () => {
    let delay = 0;
    for (let i = state.selectedFrets.length - 1; i >= 0; i--) {
      const fret = state.selectedFrets[i];
      if (fret !== null) {
        const noteName = getNoteAt(state.tuning[i], fret);
        const currentString = i;
        setTimeout(() => {
          triggerStringPlay(currentString, noteName);
        }, delay);
        delay += 50;
      }
    }
  };

  // Geometria Fretboard
  const width = 860;
  const height = 40 + (state.tuning.length - 1) * 32;
  const fretCount = 15; // 15 trastes
  const fretWidth = (width - 40) / fretCount;
  const nutWidth = 30;

  return (
    <div className="w-full p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
      {/* Header Fretboard */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex flex-col">
          <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            Braço Virtual (15 Trastes)
          </h2>
          <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
            Clique nas casas para pressionar notas. Clique nos botões "×" à esquerda do braço para abafar as cordas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playCurrentFretboard}
            disabled={state.selectedFrets.every(f => f === null)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 hover:text-white transition disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            title="Tocar dedilhado"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={actions.clearFretboard}
            className="p-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-zinc-900 transition cursor-pointer"
            title="Limpar braço"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SVG Fretboard */}
      <div className="w-full overflow-x-auto p-2 border border-zinc-800 bg-zinc-950/80 rounded-xl relative select-none">
        <div className="min-w-[860px] relative">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Background da escala de madeira escura */}
            <rect x={nutWidth} y="8" width={width - nutWidth} height={height - 16} fill="#1d1d1f" rx="3" />
            
            {/* Pestana de metal */}
            <rect x={nutWidth - 4} y="6" width="4" height={height - 12} fill="#555" rx="1" />
            
            {/* Desenhar trastes */}
            {Array.from({ length: fretCount }).map((_, idx) => {
              const x = nutWidth + (idx + 1) * fretWidth;
              return <line key={idx} x1={x} y1="8" x2={x} y2={height - 8} stroke="hsl(0, 0%, 25%)" strokeWidth="1.5" />;
            })}

            {/* Marcadores de bolinha tradicionais (casas 3, 5, 7, 9, 15) */}
            {[3, 5, 7, 9, 15].map(f => {
              const x = nutWidth + (f - 0.5) * fretWidth;
              return <circle key={f} cx={x} cy={height / 2} r="4" fill="#555" opacity="0.6" />;
            })}
            
            {/* Marcador duplo casa 12 */}
            {(() => {
              const x = nutWidth + (12 - 0.5) * fretWidth;
              return (
                <g>
                  <circle cx={x} cy={height / 2 - 20} r="3.5" fill="#555" opacity="0.6" />
                  <circle cx={x} cy={height / 2 + 20} r="3.5" fill="#555" opacity="0.6" />
                </g>
              );
            })()}

            {/* Desenhar Cordas Metálicas */}
            {state.tuning.map((_, idx) => {
              const y = 20 + idx * 32;
              const isVibrating = vibratingStrings[idx];
              return (
                <line 
                  key={idx} 
                  x1="0" 
                  y1={y} 
                  x2={width} 
                  y2={y} 
                  stroke={isVibrating ? "#FFFFFF" : "hsl(0, 0%, 35%)"} 
                  strokeWidth={1 + idx * 0.4} 
                  opacity={isVibrating ? 1.0 : 0.6}
                  className={isVibrating ? "animate-pulse" : ""}
                />
              );
            })}

            {/* Área invisível de detecção de clique por traste */}
            {state.tuning.map((_, stringIdx) => {
              const y = 20 + stringIdx * 32;
              return (
                <g key={stringIdx}>
                  {/* Casa 0 (solta) no nut */}
                  <rect 
                    x="0" 
                    y={y - 16} 
                    width={nutWidth} 
                    height="32" 
                    fill="transparent" 
                    className="cursor-pointer hover:fill-zinc-800/20"
                    onClick={() => {
                      const isCurrentlyFretted = state.selectedFrets[stringIdx] === 0;
                      if (!isCurrentlyFretted) triggerStringPlay(stringIdx, getNoteAt(state.tuning[stringIdx], 0));
                      actions.toggleFret(stringIdx, 0);
                    }}
                  />
                  {/* Trastes de 1 a 15 */}
                  {Array.from({ length: fretCount }).map((_, fretIdx) => {
                    const fret = fretIdx + 1;
                    return (
                      <rect
                        key={fret}
                        x={nutWidth + fretIdx * fretWidth}
                        y={y - 16}
                        width={fretWidth}
                        height="32"
                        fill="transparent"
                        className="cursor-pointer hover:fill-zinc-700/10"
                        onClick={() => {
                          const isCurrentlyFretted = state.selectedFrets[stringIdx] === fret;
                          if (!isCurrentlyFretted) triggerStringPlay(stringIdx, getNoteAt(state.tuning[stringIdx], fret));
                          actions.toggleFret(stringIdx, fret);
                        }}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Notas Pressionadas (Círculos coloridos) */}
            {state.tuning.map((_, stringIdx) => {
              const y = 20 + stringIdx * 32;
              const selectedFret = state.selectedFrets[stringIdx];
              if (selectedFret === null) return null;

              const x = selectedFret === 0 
                ? nutWidth / 2 
                : nutWidth + (selectedFret - 0.5) * fretWidth;

              const noteName = getNoteAt(state.tuning[stringIdx], selectedFret);

              return (
                <g key={stringIdx} className="pointer-events-none">
                  <circle cx={x} cy={y} r="11" fill="#a855f7" className="stroke-2 stroke-zinc-950" style={{ filter: "drop-shadow(0 0 6px #a855f7)" }} />
                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFF">{noteName.replace(/\d/, "")}</text>
                </g>
              );
            })}
          </svg>

          {/* Botões Mute rápidos no Nut esquerdo */}
          <div className="absolute left-0.5 top-[20px] bottom-[20px] flex flex-col justify-between py-1 bg-zinc-950 border-r border-zinc-900 rounded-l-md">
            {state.tuning.map((_, idx) => {
              const isMuted = state.selectedFrets[idx] === null;
              return (
                <button
                  key={idx}
                  onClick={() => actions.muteString(idx)}
                  className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border rounded transition cursor-pointer ${isMuted ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-purple-950/45 border-purple-800 text-purple-400"}`}
                  title={isMuted ? "Tocar corda" : "Abafar corda"}
                >
                  {isMuted ? "×" : "•"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
