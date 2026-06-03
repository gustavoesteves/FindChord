import { useState, useEffect, useRef } from "react";
import { useChordStore } from "../store/useChordStore";
import { parseChord } from "../utils/music/theory/chordParser";
import { playGuitarChord, playMetronomeClick } from "../utils/audioSynth";
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  Trash2, 
  Music,
  Sliders,
  Download,
  Volume2,
  VolumeX
} from "lucide-react";
import { harmonyEngine } from "../utils/music/harmonyEngine";
import type { RuntimePattern } from "../utils/music/harmonyEngine";


export default function ChordTimeline() {
  const {
    progressionChords,
    timelineVoicings,
    activeTimelineIndex,
    isPlaying,
    bpm,
    removeFromProgression,
    clearProgression,
    setProgressionChords,
    setPlaying,
    setActiveTimelineIndex,
    setBpm
  } = useChordStore();

  const [cadenceInput, setCadenceInput] = useState(progressionChords.join(" "));
  const timerRef = useRef<any>(null);

  // Estados locais para edição inline (duplo clique)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Estados do metrônomo e visualização
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const isMetronomeEnabledRef = useRef(isMetronomeEnabled);

  // Sincroniza a referência para evitar reiniciar o timer ao mutar/desmutar
  useEffect(() => {
    isMetronomeEnabledRef.current = isMetronomeEnabled;
  }, [isMetronomeEnabled]);

  // Estados para as configurações de exportação MIDI (Sprint 3.6, 3.65 & 4.5)
  const [showMidiSettings, setShowMidiSettings] = useState(false);
  const [midiFormat, setMidiFormat] = useState<0 | 1>(0);
  const [midiInstrument, setMidiInstrument] = useState<number>(24); // Nylon Guitar
  const [timeSigNum, setTimeSigNum] = useState<number>(4);
  const [timeSigDen, setTimeSigDen] = useState<number>(4);
  const [useHumanize, setUseHumanize] = useState<boolean>(true);
  const [runtimePattern, setRuntimePattern] = useState<RuntimePattern>("block");


  const saveInlineEdit = (idx: number) => {
    setEditingIndex(null);
    if (!editingValue.trim()) return;

    // Validar com o parser proprietário
    const parsed = parseChord(editingValue.trim());
    if (!parsed.empty) {
      const current = [...progressionChords];
      current[idx] = editingValue.trim();
      setProgressionChords(current);
    }
  };

  // Sincroniza o input de texto caso a progressão mude por ações internas
  useEffect(() => {
    setCadenceInput(progressionChords.join(" "));
  }, [progressionChords]);

  // Efeito principal do transporte (Play/Pause/Stop) baseado no BPM e com suporte a metrônomo beat-by-beat
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isPlaying || progressionChords.length === 0) return;

    // A duração de 1 batida (quarter note) é 60.000 / BPM ms
    const beatIntervalMs = 60000 / bpm;

    // Dispara a reprodução do primeiro acorde e batida imediatamente se não houver um ativo
    if (activeTimelineIndex === null || activeTimelineIndex >= progressionChords.length) {
      setActiveTimelineIndex(0);
      setCurrentBeat(0);
      playCurrentChordAudio(0);
      if (isMetronomeEnabledRef.current) {
        playMetronomeClick(true);
      }
    }

    timerRef.current = setInterval(() => {
      setCurrentBeat((prevBeat) => {
        const nextBeat = (prevBeat + 1) % 4;
        
        // Usamos o estado mais recente lido diretamente do store
        const currentIndex = useChordStore.getState().activeTimelineIndex;

        if (nextBeat === 0) {
          // Início de um novo compasso: avança para o próximo acorde
          const nextChordIdx = (currentIndex === null || currentIndex >= progressionChords.length - 1) ? 0 : currentIndex + 1;
          setActiveTimelineIndex(nextChordIdx);
          playCurrentChordAudio(nextChordIdx);
          if (isMetronomeEnabledRef.current) {
            playMetronomeClick(true);
          }
        } else {
          // Batida intermediária do compasso atual: apenas toca o clique do metrônomo
          if (isMetronomeEnabledRef.current) {
            playMetronomeClick(false);
          }
        }
        
        return nextBeat;
      });
    }, beatIntervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, bpm, progressionChords.length]);

  // Auxiliar para tocar o áudio de um voicing específico na timeline
  const playCurrentChordAudio = (idx: number) => {
    const voicing = timelineVoicings[idx];
    if (voicing) {
      // Coleta as notas físicas do voicing ativo
      playGuitarChord(voicing.notes, 45);
    }
  };

  // Carrega e valida a cadência digitada pelo usuário
  const handleLoadCadence = () => {
    if (!cadenceInput.trim()) {
      clearProgression();
      return;
    }

    const rawChords = cadenceInput.trim().split(/\s+/);
    const validChords: string[] = [];

    rawChords.forEach(c => {
      const parsed = parseChord(c);
      if (!parsed.empty) {
        validChords.push(c);
      }
    });

    if (validChords.length > 0) {
      setProgressionChords(validChords);
      setActiveTimelineIndex(0);
    }
  };

  // Funções de controle do transporte
  const handlePlayToggle = () => {
    if (progressionChords.length === 0) return;
    setPlaying(!isPlaying);
  };

  const handleStop = () => {
    setPlaying(false);
    setActiveTimelineIndex(null);
    setCurrentBeat(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleRewind = () => {
    setActiveTimelineIndex(0);
    setCurrentBeat(0);
    playCurrentChordAudio(0);
    if (isMetronomeEnabledRef.current) {
      playMetronomeClick(true);
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


  // Clica manualmente em um slot da timeline
  const handleSlotClick = (idx: number) => {
    setActiveTimelineIndex(idx);
    playCurrentChordAudio(idx);
  };

  return (
    <div className="w-full flex flex-col gap-5 p-5 rounded-2xl border border-zinc-850 glass-panel shadow-2xl animate-scale-up">
      
      {/* 1. Barra Superior: Controle de Transporte (DAW Style) & Entrada */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-zinc-800/40">
        
        {/* Lado Esquerdo: Identidade do Painel e Controles de Transporte */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-sm font-black text-zinc-100 uppercase tracking-widest">Progression Timeline</h2>
          </div>

          {/* Botões do DAW */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-850/80 shadow-inner">
            <button
              onClick={handleRewind}
              disabled={progressionChords.length === 0}
              className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-105 active:scale-95"
              title="Voltar ao início"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            
            <button
              onClick={handlePlayToggle}
              disabled={progressionChords.length === 0}
              className={`p-2 rounded-lg transition cursor-pointer hover:scale-105 active:scale-95 ${
                isPlaying 
                  ? "bg-purple-900/30 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(255,78,140,0.15)]" 
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
              title={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-purple-400" /> : <Play className="h-4 w-4 fill-zinc-400" />}
            </button>

            <button
              onClick={handleStop}
              disabled={progressionChords.length === 0}
              className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-105 active:scale-95"
              title="Parar"
            >
              <Square className="h-4 w-4 fill-zinc-400" />
            </button>
          </div>

          {/* Controle do Metrônomo e BPM Redesenhado */}
          <div className="flex items-center gap-4 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-850/80 text-xs shadow-inner">
            {/* Botão de Som do Metrônomo */}
            <button
              onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
              className={`p-1.5 rounded-lg border transition duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${
                isMetronomeEnabled
                  ? "bg-purple-900/30 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  : "bg-zinc-900/40 text-zinc-500 border-zinc-800/80 hover:text-zinc-300 hover:border-zinc-700"
              }`}
              title={isMetronomeEnabled ? "Desativar clique do metrônomo" : "Ativar clique do metrônomo"}
            >
              {isMetronomeEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Ajuste de BPM */}
            <div className="flex flex-col gap-1 items-center">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider select-none">BPM</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBpm(Math.max(60, bpm - 1))}
                  className="w-4 h-4 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer select-none font-bold text-[10px]"
                  title="Diminuir 1 BPM"
                >
                  -
                </button>
                <span className="font-mono font-black text-xs text-purple-400 min-w-[24px] text-center select-none">
                  {bpm}
                </span>
                <button
                  onClick={() => setBpm(Math.min(200, bpm + 1))}
                  className="w-4 h-4 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer select-none font-bold text-[10px]"
                  title="Aumentar 1 BPM"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-16 accent-purple-500 cursor-pointer h-0.5 rounded-lg bg-zinc-800 hover:accent-purple-400 transition-colors"
              />
            </div>

            {/* Separador */}
            <div className="h-8 border-l border-zinc-850" />

            {/* Compasso e LEDs de Batida */}
            <div className="flex flex-col justify-center items-center gap-1 min-w-[50px]">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider select-none">Compasso</span>
                <span className="font-extrabold text-[10px] text-zinc-300">4 / 4</span>
              </div>
              
              {/* LEDs Indicadores de Batida */}
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3].map((b) => {
                  const isActive = isPlaying && currentBeat === b;
                  return (
                    <div
                      key={b}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-150 ${
                        isActive
                          ? b === 0
                            ? "bg-purple-400 shadow-[0_0_8px_#c084fc] scale-110"
                            : "bg-purple-500 shadow-[0_0_6px_#c084fc] scale-105"
                          : "bg-zinc-850"
                      }`}
                      title={`Tempo ${b + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botão de Exportar MIDI com Configurações Popover */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={handleExportMidi}
              disabled={progressionChords.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded-xl border border-purple-500/20 bg-purple-950/20 hover:bg-purple-900/30 text-purple-400 hover:text-purple-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-purple-950/10"
              title="Exportar cadência como arquivo MIDI (.mid)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>MIDI</span>
            </button>
            <button
              onClick={handleExportMusicXml}
              disabled={progressionChords.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded-xl border border-purple-500/20 bg-purple-950/20 hover:bg-purple-900/30 text-purple-400 hover:text-purple-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-purple-950/10"
              title="Exportar cadência como arquivo MusicXML (.musicxml)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>MusicXML</span>
            </button>


            <button
              onClick={() => setShowMidiSettings(!showMidiSettings)}
              disabled={progressionChords.length === 0}
              className={`p-1.5 rounded-xl border transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 ${
                showMidiSettings
                  ? "border-purple-500/40 bg-purple-950/40 text-purple-400"
                  : "border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
              }`}
              title="Configurações de Exportação MIDI"
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>

            {/* Menu Popover das Configurações MIDI */}
            {showMidiSettings && (
              <div className="absolute top-10 left-0 z-50 w-64 p-4 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl flex flex-col gap-3 animate-scale-up text-left">
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
        </div>

        {/* Lado Direito: Caixa de Entrada de Texto Livre */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl xl:justify-end">
          <input
            type="text"
            value={cadenceInput}
            onChange={(e) => setCadenceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadCadence()}
            placeholder="Digite acordes (ex: C Dm G7 ou C7M Am7)"
            className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-bold tracking-wide placeholder-zinc-600 focus:ring-1 focus:ring-purple-500/20 max-w-[200px]"
          />
          <button
            onClick={handleLoadCadence}
            className="px-4 py-2 text-xs font-black uppercase rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer shadow-md shadow-purple-900/20 active:scale-95 flex items-center gap-1"
          >
            Carregar
          </button>
        </div>
      </div>

      {/* 2. Timeline Grid (Largura Total) */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Chord Timeline Track</span>
          {progressionChords.length > 0 && (
            <button 
              onClick={clearProgression} 
              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer transition uppercase"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        {progressionChords.length > 0 ? (
          <div className="relative w-full overflow-x-auto bg-zinc-950 p-4 rounded-2xl border border-zinc-900/60 scrollbar-thin">
            {/* Réguas de compasso no topo da trilha */}
            <div className="flex gap-4 items-center mb-3 text-[10px] text-zinc-600 font-bold select-none min-w-max border-b border-zinc-900/80 pb-1.5">
              {progressionChords.map((_, idx) => (
                <div key={idx} className="w-[90px] flex-none text-center uppercase tracking-wider">
                  {`Comp. ${idx + 1}`}
                </div>
              ))}
            </div>

            {/* Trilha de Blocos */}
            <div className="flex gap-4 items-center min-w-max py-1">
              {progressionChords.map((chord, idx) => {
                const isActive = activeTimelineIndex === idx;
                
                return (
                  <div
                    key={`${chord}-${idx}`}
                    onClick={() => handleSlotClick(idx)}
                    className={`relative w-[90px] h-[72px] flex flex-col justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-300 hover:scale-[1.03] ${
                      isActive
                        ? "bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(255,78,140,0.25)] animate-pulse"
                        : "bg-zinc-900/60 border-zinc-850 hover:border-zinc-700/60"
                    }`}
                  >
                    {/* Playhead Indicator no topo do bloco */}
                    {isActive && isPlaying && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-full bg-emerald-400 animate-pulse border border-zinc-950" />
                    )}

                    {/* Título do Acorde */}
                    {editingIndex === idx ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveInlineEdit(idx);
                          } else if (e.key === "Escape") {
                            setEditingIndex(null);
                          }
                        }}
                        onBlur={() => saveInlineEdit(idx)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-zinc-950 border border-purple-500 rounded px-1 py-0.5 text-[10px] text-center text-zinc-100 font-bold focus:outline-none mt-1"
                      />
                    ) : (
                      <span 
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingIndex(idx);
                          setEditingValue(chord);
                        }}
                        className="text-xs font-black tracking-wide text-zinc-100 text-center truncate mt-1 hover:underline cursor-pointer"
                        title="Clique duplo para editar a cifra"
                      >
                        {chord}
                      </span>
                    )}

                    {/* Rótulo e botão excluir no rodapé do bloco */}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[9px] font-bold text-zinc-500">{`0${idx + 1}`}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromProgression(idx);
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition"
                        title="Remover da linha do tempo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-850 rounded-2xl text-zinc-500 text-xs italic bg-zinc-950/20 gap-2">
            <Music className="h-6 w-6 text-zinc-650 animate-bounce" />
            <span>Digite sua cadência na caixa superior para iniciar a Timeline Track!</span>
          </div>
        )}
      </div>
    </div>
  );
}
