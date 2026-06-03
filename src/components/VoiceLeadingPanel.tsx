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
  Volume2,
  VolumeX
} from "lucide-react";


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




  // Clica manualmente em um slot da timeline
  const handleSlotClick = (idx: number) => {
    setActiveTimelineIndex(idx);
    playCurrentChordAudio(idx);
  };

  return (
    <div className="w-full flex flex-col gap-5 p-5 rounded-2xl border border-zinc-850 glass-panel shadow-2xl animate-scale-up">
      
      {/* 1. Barra Superior: Controle de Transporte (DAW Style) & Entrada */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-zinc-800/40">
        
        {/* Lado Esquerdo: Identidade do Painel */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <h2 className="text-sm font-black text-zinc-100 uppercase tracking-widest">Progression Timeline</h2>
        </div>

        {/* Lado Direito: Caixa de Entrada */}
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-3xl xl:justify-end">
          {/* Caixa de Entrada de Texto Livre */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cadenceInput}
              onChange={(e) => setCadenceInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadCadence()}
              placeholder="Digite acordes (ex: C Dm G7 ou C7M Am7)"
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-bold tracking-wide placeholder-zinc-600 focus:ring-1 focus:ring-purple-500/20 w-[180px]"
            />
            <button
              onClick={handleLoadCadence}
              className="px-4 py-2 text-xs font-black uppercase rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer shadow-md shadow-purple-900/20 active:scale-95 flex items-center gap-1"
            >
              Carregar
            </button>
          </div>
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
          <div className="relative w-full overflow-x-auto bg-zinc-950 p-4 rounded-2xl border border-zinc-900/60 scrollbar-thin flex flex-col gap-4">
            {/* Console de Transporte & Tempo Unificado (Alinhado à esquerda dentro do container da timeline) */}
            <div className="flex justify-start animate-scale-up">
              <div className="flex items-center bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-800 gap-3 text-xs shadow-inner">
                {/* Controles de Transporte (DAW Style) */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleRewind}
                    disabled={progressionChords.length === 0}
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-105 active:scale-95"
                    title="Voltar ao início"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={handlePlayToggle}
                    disabled={progressionChords.length === 0}
                    className={`p-1.5 rounded-lg transition cursor-pointer hover:scale-105 active:scale-95 ${
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
                    className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer hover:scale-105 active:scale-95"
                    title="Parar"
                  >
                    <Square className="h-4 w-4 fill-zinc-400" />
                  </button>
                </div>

                {/* Separador */}
                <div className="h-5 border-l border-zinc-800" />

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
                  {isMetronomeEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>

                {/* Separador */}
                <div className="h-5 border-l border-zinc-800" />

                {/* Ajuste de BPM */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider select-none mr-0.5">BPM</span>
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
                  <input
                    type="range"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-12 accent-purple-500 cursor-pointer h-0.5 rounded-lg bg-zinc-800 hover:accent-purple-400 transition-colors ml-1 hidden sm:block"
                  />
                </div>

                {/* Separador */}
                <div className="h-5 border-l border-zinc-800" />

                {/* Compasso e LEDs de Batida */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-wider select-none leading-none mb-0.5">SIGN</span>
                    <span className="font-extrabold text-[10px] text-zinc-400 leading-none">4/4</span>
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
            </div>

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
