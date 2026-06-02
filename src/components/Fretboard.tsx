import { useState } from "react";
import { useChordStore } from "../store/useChordStore";
import { getPitchClass } from "../utils/music/core/pitch";
import { getNoteAt } from "../utils/music/core/notes";
import { CHORD_REGISTRY } from "../utils/music/constants/chordRegistry";
import { playGuitarNote } from "../utils/audioSynth";
import { Volume2, Save, RotateCcw, PlusCircle, Sparkles, Info } from "lucide-react";
import { CageShape } from "../utils/music/models/VoicingShape";
import type { VoicingShape } from "../utils/music/models/VoicingShape";

export default function Fretboard() {
  const {
    tuning,
    selectedFrets,
    toggleFret,
    muteString,
    detectedChords,
    selectedChordIndex,
    activeScale,
    fretboardExplorerMode,
    activeTimelineIndex,
    notationStyle,
    saveCustomVoicingToTimeline,
    clearFretboard,
    setFretboardExplorerMode,
    addToProgression,
    setVoicingSelectorOpen,
    setScaleSelectorOpen,
    setChordDetailsOpen
  } = useChordStore();

  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>(Array(6).fill(false));

  // Acorde ativo para o Explorer Mode
  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  const activeChordRootPC = activeChord ? getPitchClass(activeChord.root) : -1;

  // Notas e pitch classes do acorde ativo usando o registro formal do motor proprietário
  const activeChordPCs = activeChord
    ? CHORD_REGISTRY[activeChord.quality].semitones.map(s => (activeChordRootPC + s) % 12)
    : [];

  const getDrawnChordName = () => {
    if (!activeChord) return "";
    if (notationStyle === "Brazilian") return activeChord.notationBrazilian;
    if (notationStyle === "Academic") return activeChord.notationAcademic;
    return activeChord.notationJazz;
  };

  const handleSaveToTimeline = () => {
    const chordName = getDrawnChordName();
    if (activeTimelineIndex !== null && chordName) {
      const activeFrets = selectedFrets.filter(f => f !== null && f > 0) as number[];
      const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 0;
      
      let rootString = -1;
      selectedFrets.forEach((f, idx) => {
        if (f !== null) {
          const noteName = getNoteAt(tuning[idx], f);
          if (getPitchClass(noteName) === activeChordRootPC) {
            rootString = idx;
          }
        }
      });

      const customVoicing: VoicingShape = {
        chordName,
        frets: [...selectedFrets],
        rootString,
        cageShape: CageShape.E,
        positionFret: minFret,
        notes: selectedFrets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x")
      };

      saveCustomVoicingToTimeline(activeTimelineIndex, customVoicing, chordName);
    }
  };

  // Dispara a vibração física de uma corda ao tocar áudio
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

  // Toca o acorde completo (dedilhado) do braço atual
  const playCurrentFretboard = () => {
    let delay = 0;
    // Toca da corda mais grave (5) para a mais aguda (0)
    for (let i = 5; i >= 0; i--) {
      const fret = selectedFrets[i];
      if (fret !== null) {
        const noteName = getNoteAt(tuning[i], fret);
        const currentString = i;
        setTimeout(() => {
          triggerStringPlay(currentString, noteName);
        }, delay);
        delay += 50; // 50ms stagger
      }
    }
  };

  // Mapear marcadores clássicos de escala no braço
  const FRET_MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_FRET_MARKERS = [12, 24];

  // Geometria do Braço SVG
  const width = 1360;  // Comprimento total do braço
  const height = 220;  // Altura total
  const fretCount = 24;
  const fretWidth = (width - 60) / fretCount; // Espaço horizontal por traste
  const nutWidth = 40; // Largura do traste 0 / pestana

  // Retorna a cor correspondente ao grau relativo de um pitch class em formato HEX para SVG Fills
  const getNoteColor = (notePC: number, rootPC: number): string => {
    if (notePC === rootPC) return "#FF4D4D"; // Tônica (Coral Neon)
    
    // Distância em semitons da tônica
    const intervalDist = (notePC - rootPC + 12) % 12;
    switch (intervalDist) {
      case 3: // Terça menor
      case 4: // Terça Maior
        return "#00F0FF"; // Terça (Ciano Elétrico)
      case 5: // Quarta justa
      case 6: // Quinta diminuta
      case 7: // Quinta Justa
      case 8: // Quinta aumentada / sexta menor
        return "#00FF88"; // Quinta (Verde Esmeralda)
      case 10: // Sétima menor
      case 11: // Sétima Maior
        return "#BD00FF"; // Sétima (Roxo/Violeta)
      default: // Extensões
        return "#FF9900"; // Extensões (Laranja Âmbar)
    }
  };

  // Retorna o grau simplificado relativo à tônica
  const getDegreeLabel = (notePC: number, rootPC: number): string => {
    if (notePC === rootPC) return "R";
    const dist = (notePC - rootPC + 12) % 12;
    const mapping: Record<number, string> = {
      1: "b9", 2: "9", 3: "b3", 4: "3", 5: "11", 6: "#11", 7: "5", 8: "b13", 9: "13", 10: "b7", 11: "7"
    };
    return mapping[dist] || `${dist}`;
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Controles do Braço */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wider uppercase text-zinc-400">Braço da Guitarra (SVG)</span>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
        
        {/* Ações do Braço */}
        <div className="flex items-center gap-2">
          {/* Play Button */}
          <button
            onClick={playCurrentFretboard}
            disabled={selectedFrets.every(f => f === null)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Tocar Acorde do Braço
          </button>

          {/* Limpar Braço */}
          <button
            onClick={() => {
              clearFretboard();
              setFretboardExplorerMode(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 hover:text-white text-zinc-400 cursor-pointer transition active:scale-95 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar Braço
          </button>
        </div>
      </div>

      {/* Container com scroll horizontal em mobile */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800/80 glass-panel p-4 shadow-2xl relative select-none">
        
        {/* Braço Principal em SVG */}
        <div className="min-w-[1360px] relative fretboard-wood">
          <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="overflow-visible"
          >
            {/* Definições de gradiente e estilos */}
            <defs>
              {/* Jacarandá escuro para a madeira do braço */}
              <linearGradient id="fretboard-wood-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E1A24" />
                <stop offset="50%" stopColor="#17141C" />
                <stop offset="100%" stopColor="#110E14" />
              </linearGradient>
              {/* Gradiente metálico brilhante para trastes */}
              <linearGradient id="fret-metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8E8D93" />
                <stop offset="30%" stopColor="#E2E2E2" />
                <stop offset="70%" stopColor="#8E8D93" />
                <stop offset="100%" stopColor="#4A4A4F" />
              </linearGradient>
              {/* Gradiente da pestana (Nut) */}
              <linearGradient id="nut-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#555" />
                <stop offset="50%" stopColor="#DDD" />
                <stop offset="100%" stopColor="#222" />
              </linearGradient>
              {/* Glow perolado para inlays */}
              <radialGradient id="inlay-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#E5E5DB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#B5B5A5" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* 1. Madeira do Braço (Madeira jacarandá de traste 0 a 24) */}
            <rect 
              x={nutWidth} 
              y="10" 
              width={width - nutWidth} 
              height={height - 20} 
              fill="url(#fretboard-wood-grad)"
              rx="4"
            />

            {/* 2. Marcadores de Traste (Fret Inlays) em madrepérola */}
            {FRET_MARKERS.map(fret => {
              const x = nutWidth + (fret - 0.5) * fretWidth;
              return (
                <circle 
                  key={`inlay-${fret}`}
                  cx={x} 
                  cy={height / 2} 
                  r="8" 
                  fill="url(#inlay-glow)"
                  filter="drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.4))"
                />
              );
            })}

            {/* Marcadores Duplos (casas 12 e 24) */}
            {DOUBLE_FRET_MARKERS.map(fret => {
              const x = nutWidth + (fret - 0.5) * fretWidth;
              return (
                <g key={`inlay-double-${fret}`}>
                  <circle cx={x} cy={height / 2 - 40} r="7" fill="url(#inlay-glow)" />
                  <circle cx={x} cy={height / 2 + 40} r="7" fill="url(#inlay-glow)" />
                </g>
              );
            })}

            {/* 3. Trastes Metálicos */}
            {/* Pestana / Traste 0 (Nut) */}
            <rect 
              x={nutWidth - 8} 
              y="6" 
              width="8" 
              height={height - 12} 
              fill="url(#nut-grad)"
              rx="1.5"
            />
            {/* Trastes 1 a 24 */}
            {Array.from({ length: fretCount }).map((_, idx) => {
              const x = nutWidth + (idx + 1) * fretWidth;
              return (
                <rect 
                  key={`fret-${idx + 1}`}
                  x={x - 1.5} 
                  y="8" 
                  width="3" 
                  height={height - 16} 
                  fill="url(#fret-metal-grad)"
                />
              );
            })}

            {/* 4. Cordas de Guitarra (Gauges crescentes de 0 a 5) */}
            {Array.from({ length: 6 }).map((_, idx) => {
              const y = 20 + idx * 36;
              const gauge = 1 + idx * 0.6; // A 6ª corda é fisicamente mais grossa que a 1ª
              
              // Se a corda está vibrando devido à síntese de áudio, aplica animação de vibração
              const isVibrating = vibratingStrings[idx];
              
              return (
                <line 
                  key={`string-${idx}`}
                  x1="0" 
                  y1={y} 
                  x2={width} 
                  y2={y} 
                  stroke={isVibrating ? "#FFFFFF" : "#8A898E"} 
                  strokeWidth={gauge} 
                  opacity={isVibrating ? 1.0 : 0.8 - idx * 0.05}
                  className={isVibrating ? "animate-vibrate" : ""}
                />
              );
            })}

            {/* 5. Área de Clique Interativa invisível sobreposta no braço */}
            {/* Linhas das cordas de 1 a 24 trastes */}
            {Array.from({ length: 6 }).map((_, stringIdx) => {
              const y = 20 + stringIdx * 36;

              return (
                <g key={`click-row-${stringIdx}`}>
                  {/* Pestana / Casa 0 Solta (Interativa) */}
                  <rect 
                    x="0" 
                    y={y - 18} 
                    width={nutWidth} 
                    height="36" 
                    fill="transparent" 
                    className="cursor-pointer hover:fill-zinc-800/10"
                    onClick={() => {
                      const isCurrentlyFretted = selectedFrets[stringIdx] === 0;
                      if (!isCurrentlyFretted) {
                        const noteName = getNoteAt(tuning[stringIdx], 0);
                        triggerStringPlay(stringIdx, noteName);
                      }
                      toggleFret(stringIdx, 0);
                    }}
                  />

                  {/* Casas 1 a 24 (Interativas) */}
                  {Array.from({ length: fretCount }).map((_, fretIdx) => {
                    const fret = fretIdx + 1;
                    const xStart = nutWidth + fretIdx * fretWidth;
                    
                    return (
                      <rect 
                        key={`click-${stringIdx}-${fret}`}
                        x={xStart} 
                        y={y - 18} 
                        width={fretWidth} 
                        height="36" 
                        fill="transparent" 
                        className="cursor-pointer hover:fill-zinc-400/5 transition-colors"
                        onClick={() => {
                          const isCurrentlyFretted = selectedFrets[stringIdx] === fret;
                          if (!isCurrentlyFretted) {
                            const noteName = getNoteAt(tuning[stringIdx], fret);
                            triggerStringPlay(stringIdx, noteName);
                          }
                          toggleFret(stringIdx, fret);
                        }}
                      >
                        <title>{`${getNoteAt(tuning[stringIdx], fret)} - Traste ${fret}`}</title>
                      </rect>
                    );
                  })}
                </g>
              );
            })}

            {/* 6. Renderização dos Marcadores de Notas no SVG */}
            {Array.from({ length: 6 }).map((_, stringIdx) => {
              const y = 20 + stringIdx * 36;
              const baseNote = tuning[stringIdx];
              const selectedFret = selectedFrets[stringIdx];

              // Desenhar as notas do braço baseado no modo ativo
              return (
                <g key={`marks-row-${stringIdx}`}>
                  {/* Trastes 0 a 24 */}
                  {Array.from({ length: fretCount + 1 }).map((_, fret) => {
                    const noteName = getNoteAt(baseNote, fret);
                    const notePC = getPitchClass(noteName);
                    
                    // Posição x centralizada no traste
                    const x = fret === 0 
                      ? nutWidth / 2 
                      : nutWidth + (fret - 0.5) * fretWidth;

                    const isFretted = selectedFret === fret;

                    // --- 1. MODO FRETBOARD EXPLORER (Highlights do acorde ativo) ---
                    if (fretboardExplorerMode && activeChord && activeChordPCs.includes(notePC)) {
                      // Se além de estar no acorde, o traste está ativado, desenhamos com maior brilho
                      const opacity = isFretted ? "opacity-100" : "opacity-40 hover:opacity-90";
                      const size = isFretted ? 14 : 11;

                      return (
                        <g key={`explorer-${stringIdx}-${fret}`} className={`transition-all duration-300 pointer-events-none ${opacity}`}>
                          <circle 
                            cx={x} 
                            cy={y} 
                            r={size} 
                            className="stroke-2 stroke-zinc-900 shadow-lg"
                            style={{ 
                              fill: getNoteColor(notePC, activeChordRootPC),
                              filter: "drop-shadow(0 0 6px rgba(255,255,255,0.2))" 
                            }}
                          />
                          <text 
                            x={x} 
                            y={y + 3.5} 
                            textAnchor="middle" 
                            fontSize={isFretted ? "10" : "8.5"} 
                            fontWeight="800" 
                            fill="#FFFFFF"
                          >
                            {getDegreeLabel(notePC, activeChordRootPC)}
                          </text>
                        </g>
                      );
                    }

                    // --- 2. MODO SCALE OVERLAY (Notas da escala selecionada acesas) ---
                    if (activeScale && activeScale.notes.map(n => getPitchClass(n)).includes(notePC)) {
                      const scaleRootPC = getPitchClass(activeScale.notes[0]);
                      const opacity = isFretted ? "opacity-100" : "opacity-45 hover:opacity-95";
                      const size = isFretted ? 14 : 11;

                      return (
                        <g key={`scale-${stringIdx}-${fret}`} className={`transition-all duration-300 pointer-events-none ${opacity}`}>
                          <circle 
                            cx={x} 
                            cy={y} 
                            r={size} 
                            className="stroke-2 stroke-zinc-900"
                            style={{ fill: getNoteColor(notePC, scaleRootPC) }}
                          />
                          <text 
                            x={x} 
                            y={y + 3.5} 
                            textAnchor="middle" 
                            fontSize={isFretted ? "10" : "8.5"} 
                            fontWeight="800" 
                            fill="#FFFFFF"
                          >
                            {getDegreeLabel(notePC, scaleRootPC)}
                          </text>
                        </g>
                      );
                    }

                    // --- 3. MODO DE ENTRADA LIVRE (Desenha apenas a nota ativada fisicamente) ---
                    if (isFretted) {
                      // Se houver um acorde ativo detectado, colorimos com base no intervalo harmônico do acorde principal
                      // Caso contrário, usamos cor padrão (tônica genérica vermelha)
                      const circleColor = activeChord 
                        ? getNoteColor(notePC, activeChordRootPC) 
                        : "#FF4D4D";

                      const displayNoteName = activeChord
                        ? activeChord.notes.find(n => getPitchClass(n) === notePC) || noteName.replace(/\d/, "")
                        : noteName.replace(/\d/, "");

                      return (
                        <g 
                          key={`fretted-${stringIdx}-${fret}`} 
                          className="pointer-events-none"
                        >
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="13.5" 
                            className="stroke-2 stroke-zinc-900 animate-scale-up"
                            style={{ 
                              fill: circleColor,
                              filter: `drop-shadow(0 0 8px ${circleColor})` 
                            }}
                          />
                          <text 
                            x={x} 
                            y={y + 4} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fontWeight="900" 
                            fill="#FFFFFF"
                          >
                            {displayNoteName}
                          </text>
                        </g>
                      );
                    }

                    return null;
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 7. Coluna lateral de Controle do Nut (Mute / Open string) */}
        {/* Renderiza painel flutuante esquerdo com botões rápidos */}
        <div className="absolute left-1 top-[20px] bottom-[20px] flex flex-col justify-between py-1 bg-[#121216]/90 border-r border-zinc-800/80 px-2 rounded-l-lg pointer-events-auto">
          {Array.from({ length: 6 }).map((_, idx) => {
            const isMuted = selectedFrets[idx] === null;
            const isOpen = selectedFrets[idx] === 0;

            return (
              <div key={`nut-control-${idx}`} className="flex flex-col items-center justify-center h-9">
                <button
                  onClick={() => {
                    if (isMuted) {
                      // Se mutado, passa para Aberto (0)
                      toggleFret(idx, 0);
                    } else if (isOpen) {
                      // Se aberto, muta (null)
                      muteString(idx);
                    } else {
                      // Se tiver pressionado uma casa física, muta a corda inteira
                      muteString(idx);
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

      {/* 8. Contextual Composer Dock */}
      {activeChord && (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 rounded-2xl border border-purple-500/20 bg-purple-950/10 backdrop-blur-md shadow-xl animate-scale-up mt-1">
          {/* Lado Esquerdo: Identificador Harmônico */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Acorde Detectado:
            </span>
            <span className="text-xl font-black text-white tracking-tight">
              {getDrawnChordName()}
            </span>
          </div>

          {/* Lado Direito: Ações de Composição */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Análise Detalhada */}
            <button
              onClick={() => setChordDetailsOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200 text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer"
              title={`Ver análise detalhada, equivalências e intervalos de ${getDrawnChordName()}`}
            >
              <Info className="h-3.5 w-3.5 text-purple-400" />
              🔍 Análise Detalhada
            </button>

            {/* Explorar Voicings */}
            <button
              onClick={() => setVoicingSelectorOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-950/20 active:scale-95 cursor-pointer"
              title={`Ver outros formatos para tocar ${getDrawnChordName()}`}
            >
              📖 Explorar Voicings
            </button>

            {/* Escalas Compatíveis (Modal Toggle) */}
            <button
              onClick={() => setScaleSelectorOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200 text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer"
              title={`Ver escalas compatíveis para improvisar sobre ${getDrawnChordName()}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              🎵 Escalas Compatíveis
            </button>

            {/* Incluir na Progressão ou Salvar no Compasso */}
            {activeTimelineIndex !== null ? (
              <button
                onClick={handleSaveToTimeline}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg active:scale-95 cursor-pointer"
                title={`Salvar o dedilhado no compasso ${activeTimelineIndex + 1}`}
              >
                <Save className="h-4 w-4" />
                Salvar no Compasso {activeTimelineIndex + 1}
              </button>
            ) : (
              <button
                onClick={() => addToProgression(getDrawnChordName())}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg active:scale-95 cursor-pointer"
                title={`Adicionar ${getDrawnChordName()} no final da timeline`}
              >
                <PlusCircle className="h-4 w-4" />
                + Incluir {getDrawnChordName()}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
