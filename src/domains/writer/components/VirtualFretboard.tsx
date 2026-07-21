import React, { useState, useEffect } from "react";
import { useWriter } from "../context/WriterContext";
import { getNoteAt } from "../../../utils/music/core/notes";
import { playGuitarNote } from "../../../utils/audioSynth";
import { musescoreAdapter } from "../../../utils/musescoreAdapter";
import { buildWriterMuseScoreChordEvent } from "../services/writerMuseScorePayload";
import { buildWriterFretboardPlaybackSteps } from "../services/writerFretboardPlayback";
import {
  buildWriterFretboardGeometry,
  writerStringGeometry
} from "../services/writerFretboardGeometry";
import { buildWriterInputFretboardNotes } from "../services/writerInputFretboardNotes";
import { FretboardRenderer } from "./fretboard/FretboardRenderer";
import { Volume2, RotateCcw, Send } from "lucide-react";

export const VirtualFretboard: React.FC = () => {
  const { state, actions } = useWriter();
  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>([]);
  const [museScoreSendStatus, setMuseScoreSendStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setVibratingStrings(Array(state.tuning.length).fill(false));
  }, [state.tuning.length]);

  const triggerStringPlay = (stringIndex: number, noteName: string) => {
    playGuitarNote(noteName);
    setVibratingStrings(prev => {
      const next = [...prev];
      next[stringIndex] = true;
      return next;
    });

    setTimeout(() => {
      setVibratingStrings(prev => {
        const next = [...prev];
        next[stringIndex] = false;
        return next;
      });
    }, 600);
  };

  const handleSendToMuseScore = async () => {
    const payload = buildWriterMuseScoreChordEvent({
      activeChord: state.activeChord,
      selectedFrets: state.selectedFrets,
      tuning: state.tuning,
      activeInstrument: state.activeInstrument
    });
    if (!payload) return;

    const result = await musescoreAdapter.sendChordDetailed(payload);
    setMuseScoreSendStatus(result.ok
      ? { kind: "success", message: `Inserido no MuseScore: ${result.chordSymbol}` }
      : { kind: "error", message: result.message }
    );
  };

  const playCurrentFretboard = () => {
    buildWriterFretboardPlaybackSteps(state.selectedFrets, state.tuning).forEach(step => {
      setTimeout(() => {
        triggerStringPlay(step.stringIndex, step.noteName);
      }, step.delayMs);
    });
  };

  const fretboardGeometry = buildWriterFretboardGeometry(state.tuning.length);
  const visibleNotes = buildWriterInputFretboardNotes({
    tuning: state.tuning,
    selectedFrets: state.selectedFrets,
    activeChord: state.activeChord
  });
  const renderedStrings = state.tuning.map((_, idx) => ({
    ...writerStringGeometry(idx),
    isVibrating: vibratingStrings[idx]
  }));

  const handleFretClick = (stringIndex: number, fret: number) => {
    const isCurrentlyFretted = state.selectedFrets[stringIndex] === fret;
    if (!isCurrentlyFretted) {
      triggerStringPlay(stringIndex, getNoteAt(state.tuning[stringIndex], fret));
    }
    actions.toggleFret(stringIndex, fret);
  };

  return (
    <div className="w-full flex flex-col gap-3 animate-scale-up">
      {/* Header Fretboard */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-zinc-400">
            {state.activeChord ? `Acorde: ${state.activeChord.symbol}` : "Braço"}
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>

        {/* Ações do Braço */}
        <div className="flex items-center gap-2">
          {state.activeChord && (
            <button
              onClick={handleSendToMuseScore}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-650 hover:brightness-110 text-white shadow-md active:scale-95 transition cursor-pointer"
              title="Enviar acorde atual ao MuseScore"
            >
              <Send className="h-3.5 w-3.5" />
              Inserir no MuseScore
            </button>
          )}

          <button
            onClick={playCurrentFretboard}
            disabled={state.selectedFrets.every(f => f === null)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Tocar dedilhado"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Tocar acorde
          </button>

          <button
            onClick={actions.clearFretboard}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-400 cursor-pointer transition active:scale-95 shadow-sm"
            title="Limpar braço"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar braço
          </button>
        </div>
      </div>
      {museScoreSendStatus && (
        <div className={`px-1 text-[11px] font-semibold ${
          museScoreSendStatus.kind === "success" ? "text-emerald-300" : "text-amber-300"
        }`}>
          {museScoreSendStatus.message}
        </div>
      )}

      {/* SVG Fretboard */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800/80 glass-panel p-4 shadow-2xl relative select-none">
        <FretboardRenderer
          geometry={fretboardGeometry}
          strings={renderedStrings}
          notes={visibleNotes}
          onFretClick={handleFretClick}
        />

        {/* Botões Mute rápidos no Nut esquerdo */}
        <div className="absolute left-1 top-[20px] bottom-[20px] flex flex-col justify-between py-1 bg-[#121216]/90 border-r border-zinc-800/80 px-2 rounded-l-lg pointer-events-auto">
          {state.tuning.map((_, idx) => {
            const isMuted = state.selectedFrets[idx] === null;
            const isOpen = state.selectedFrets[idx] === 0;

            return (
              <div key={`nut-control-b-${idx}`} className="flex flex-col items-center justify-center h-9">
                <button
                  onClick={() => {
                    if (isMuted) {
                      actions.toggleFret(idx, 0);
                    } else if (isOpen) {
                      actions.muteString(idx);
                    } else {
                      actions.muteString(idx);
                    }
                  }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition border cursor-pointer ${
                    isMuted 
                      ? "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300" 
                      : isOpen 
                        ? "bg-emerald-950/80 border-emerald-700/60 text-emerald-400" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                  }`}
                  title={isMuted ? "Corda Mutada (Clique para soltar)" : "Corda Ativa (Clique para mutar)"}
                >
                  {isMuted ? "×" : isOpen ? "0" : "•"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
);
};
