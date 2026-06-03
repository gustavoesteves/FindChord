import React, { useState } from "react";
import { useChordStore, TUNING_PRESETS } from "../store/useChordStore";
import { Music, Sparkles, Sliders, Download } from "lucide-react";
import { harmonyEngine } from "../utils/music/harmonyEngine";
import type { RuntimePattern } from "../utils/music/harmonyEngine";

const NOTE_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OCTAVES = [1, 2, 3, 4, 5];

export default function Header() {
  const {
    tuningPreset,
    tuning,
    setTuning,
    updateCustomStringTuning,
    notationStyle,
    setNotationStyle,
    progressionChords,
    timelineVoicings,
    bpm
  } = useChordStore();

  const [showTuning, setShowTuning] = useState(false);

  // Estados para as configurações de exportação MIDI (Sprint 3.6, 3.65 & 4.5)
  const [showMidiSettings, setShowMidiSettings] = useState(false);
  const [midiFormat, setMidiFormat] = useState<0 | 1>(0);
  const [midiInstrument, setMidiInstrument] = useState<number>(24); // Nylon Guitar
  const [timeSigNum, setTimeSigNum] = useState<number>(4);
  const [timeSigDen, setTimeSigDen] = useState<number>(4);
  const [useHumanize, setUseHumanize] = useState<boolean>(true);
  const [runtimePattern, setRuntimePattern] = useState<RuntimePattern>("block");

  const handleTuningPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const selected = TUNING_PRESETS.find(p => p.name === presetName);
    if (selected) {
      setTuning(presetName, selected.notes);
    }
  };

  const handleExportMidi = () => {
    if (progressionChords.length === 0) return;
    const tuning = useChordStore.getState().tuning;

    try {
      const midiResult = harmonyEngine.generateMidi(
        {
          progression: progressionChords,
          tuning,
          includeAlternatives: false
        },
        {
          bpm,
          velocity: 80,
          chordDurationBeats: 4,
          format: midiFormat,
          instrumentProgram: midiInstrument,
          timeSignature: {
            numerator: timeSigNum,
            denominator: timeSigDen
          },
          humanize: useHumanize ? {
            velocityVariance: 8,
            timingVarianceTicks: 6
          } : undefined,
          pattern: runtimePattern
        }
      );

      const blob = new Blob([midiResult.bytes as any], { type: "audio/midi" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = progressionChords.join("_").replace(/[\/\\?%*:|"<>\s]/g, "-") + ".mid";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Fecha o popover de configurações
      setShowMidiSettings(false);
    } catch (err) {
      console.error("Falha ao exportar MIDI:", err);
    }
  };

  const handleExportMusicXml = () => {
    if (progressionChords.length === 0) return;

    try {
      const xml = harmonyEngine.exportMusicXml(
        progressionChords,
        timelineVoicings,
        bpm
      );

      const blob = new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = progressionChords.join("_").replace(/[\/\\?%*:|"<>\s]/g, "-") + ".musicxml";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Falha ao exportar MusicXML:", err);
    }
  };

  return (
    <header className="w-full flex flex-col gap-4">
      {/* Brand Title Row with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(255,78,140,0.15)]">
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
          {/* Pílula de Exportação Unificada */}
          <div className="relative flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-850/80 shadow-inner">
            <button
              onClick={handleExportMidi}
              disabled={progressionChords.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-purple-950/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-105 active:scale-95"
              title="Exportar cadência como arquivo MIDI (.mid)"
            >
              <Download className="h-3 w-3" />
              <span>MIDI</span>
            </button>
            <div className="h-4 border-l border-zinc-850" />
            <button
              onClick={handleExportMusicXml}
              disabled={progressionChords.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-purple-950/20 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-105 active:scale-95"
              title="Exportar cadência como arquivo MusicXML (.musicxml)"
            >
              <Download className="h-3 w-3" />
              <span>MusicXML</span>
            </button>
            <div className="h-4 border-l border-zinc-850" />
            <button
              onClick={() => setShowMidiSettings(!showMidiSettings)}
              disabled={progressionChords.length === 0}
              className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 ${
                showMidiSettings
                  ? "bg-purple-900/30 text-purple-400 border border-purple-500/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Configurações de Exportação MIDI"
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>

            {/* Menu Popover das Configurações MIDI */}
            {showMidiSettings && (
              <div className="absolute top-10 right-0 z-50 w-64 p-4 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl flex flex-col gap-3 animate-scale-up text-left">
                <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-850 pb-1.5">
                  Ajustes MIDI (Hardening)
                </h4>
                
                {/* Formato MIDI */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Formato SMF</label>
                  <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => setMidiFormat(0)}
                      className={`py-1 text-[9px] font-bold rounded-md transition cursor-pointer ${
                        midiFormat === 0
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Tipo 0 (Pista Única)
                    </button>
                    <button
                      onClick={() => setMidiFormat(1)}
                      className={`py-1 text-[9px] font-bold rounded-md transition cursor-pointer ${
                        midiFormat === 1
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Tipo 1 (Multicanal)
                    </button>
                  </div>
                </div>

                {/* Instrumento (Program Change) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Timbre do Sintetizador</label>
                  <select
                    value={midiInstrument}
                    onChange={(e) => setMidiInstrument(parseInt(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-zinc-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                  >
                    <option value={24}>Nylon Guitar (24)</option>
                    <option value={0}>Acoustic Piano (0)</option>
                    <option value={48}>Orchestral Strings (48)</option>
                    <option value={25}>Steel Guitar (25)</option>
                    <option value={32}>Acoustic Bass (32)</option>
                  </select>
                </div>

                {/* Fórmula de Compasso (Time Signature) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fórmula de Compasso</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">Numerador</span>
                      <select
                        value={timeSigNum}
                        onChange={(e) => setTimeSigNum(parseInt(e.target.value))}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-[10px] text-zinc-200 focus:outline-none focus:border-purple-500 font-semibold text-center cursor-pointer"
                      >
                        <option value={4}>4</option>
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">Denominador</span>
                      <select
                        value={timeSigDen}
                        onChange={(e) => setTimeSigDen(parseInt(e.target.value))}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-[10px] text-zinc-200 focus:outline-none focus:border-purple-500 font-semibold text-center cursor-pointer"
                      >
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                        <option value={2}>2</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Padrão de Execução Rítmica (Sprint 4.5) */}
                <div className="flex flex-col gap-1 border-t border-zinc-850 pt-2.5 mt-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estilo de Performance</label>
                  <select
                    value={runtimePattern}
                    onChange={(e) => setRuntimePattern(e.target.value as RuntimePattern)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-[10px] text-zinc-200 focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                  >
                    <option value="block">Block Chord (Estático)</option>
                    <option value="half-note">Half Note (Pulso Duplo)</option>
                    <option value="quarter-note">Quarter Note (Pulso Quádruplo)</option>
                    <option value="arpeggio-up">Arpeggio Up (Dedilhado Ascendente)</option>
                    <option value="arpeggio-down">Arpeggio Down (Dedilhado Descendente)</option>
                    <option value="broken-chord">Broken Chord (Baixo + Hits Sincopados)</option>
                    <option value="pedal-bass">Pedal Bass (Baixo Sustentado + Hits Pulsantes)</option>
                  </select>
                </div>

                {/* Humanização (Sprint 3.65) */}
                <div className="flex items-center justify-between border-t border-zinc-850 pt-2.5 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-300">Humanizar Expressão</span>
                    <span className="text-[8px] text-zinc-500 font-medium">Variação micro-tempo e volume</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useHumanize}
                    onChange={(e) => setUseHumanize(e.target.checked)}
                    className="accent-purple-500 h-4 w-4 rounded bg-zinc-800 border-zinc-700 cursor-pointer"
                  />
                </div>

              </div>
            )}
          </div>

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
