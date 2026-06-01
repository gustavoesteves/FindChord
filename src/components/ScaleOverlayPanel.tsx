import { useChordStore } from "../store/useChordStore";
import { getCompatibleScales } from "../utils/music/theory/musicTheory";
import { EyeOff, Sparkles, BookOpen } from "lucide-react";
import { getNoteAt } from "../utils/music/core/notes";
import { getPitchClass } from "../utils/music/core/pitch";
import { playGuitarNote } from "../utils/audioSynth";

const SCALE_DESCRIPTIONS: Record<string, { desc: string; mood: string; tip: string }> = {
  "major": {
    desc: "Jônio (Maior Padrão) — A base de toda a harmonia ocidental clássica.",
    mood: "Alegre, resoluto, brilhante, virtuoso e estável.",
    tip: "Perfeito para temas simples e melódicos. Dica de ouro: evite repousar muito tempo na 4ª justa (nota de evitar) para não chocar com a terça maior."
  },
  "lydian": {
    desc: "Lídio — O quarto modo da escala maior, com uma 4ª aumentada (#11).",
    mood: "Místico, flutuante, celestial, espacial e futurista.",
    tip: "Explore bastante a nota #11 (4ª aumentada). Ela gera tensão ultra-limpa e cinematográfica sem brigar com a terça maior."
  },
  "mixolydian": {
    desc: "Mixolídio — O quinto modo da escala maior, contendo a marcante 7ª menor (b7).",
    mood: "Festivo, forte, com pegada de Blues, Rock Clássico e MPB.",
    tip: "Acentue a 7ª menor (b7) ao solar sobre acordes dominantes para assinar o estilo clássico do rock sulista ou grooves de MPB."
  },
  "dorian": {
    desc: "Dórico — Segundo modo da escala maior, caracterizado pela 6ª maior (13).",
    mood: "Melancólico, sofisticado, moderno, misterioso e suingado.",
    tip: "A 6ª maior é a nota de ouro aqui. Excelente para grooves de Funk/Jazz no estilo de Miles Davis (So What) ou Santana."
  },
  "aeolian": {
    desc: "Eólio (Menor Natural) — O clássico modo menor natural da música tonal.",
    mood: "Triste, dramático, clássico, denso e expressivo.",
    tip: "Foque nos intervalos de 6ª menor para acentuar a carga dramática de solos de rock, baladas e metal melódico."
  },
  "phrygian": {
    desc: "Frígio — Terceiro modo da escala maior, caracterizado pela 2ª menor (b9).",
    mood: "Exótico, sombrio, espanhol (flamenco), místico e tenso.",
    tip: "A 2ª menor (b9) é o coração do modo frígio. Use-a logo na entrada do compasso para evocar texturas flamencas ou solos pesados de metal."
  },
  "locrian": {
    desc: "Lócrio — O sétimo modo da escala maior, tenso e instável devido à 5ª diminuta (b5).",
    mood: "Instável, tenso, sombrio e misterioso.",
    tip: "Ideal para improvisar sobre o acorde meio-diminuto (m7b5). Use-o como um excelente gerador de tensão que prepara a resolução."
  },
  "pentatonic": {
    desc: "Pentatônica Maior — A lendária escala de 5 notas sem intervalos de semitônios.",
    mood: "Agradável, fluida, natural, otimista e impossível de soar errada.",
    tip: "Como não possui notas de evitar, todas as notas soam bem. Abuse de bends, double-stops e fraseados de country/pop."
  },
  "minor pentatonic": {
    desc: "Pentatônica Menor — A rainha incontestável das escalas de guitarra.",
    mood: "Crua, direta, expressiva, enérgica e blueseira.",
    tip: "A fôrma definitiva para seus solos. Tente puxar bends de meio tom na terça menor para mirar na terça maior do acorde de fundo."
  },
  "blues": {
    desc: "Escala de Blues — A pentatônica menor enriquecida com a lendária 'Blue Note' (b5).",
    mood: "Sofrida, maliciosa, expressiva, clássica e autêntica.",
    tip: "Use a Blue Note (b5) principalmente como nota de passagem cromática ligando a 4ª justa e a 5ª justa para adicionar malícia clássica."
  },
  "melodic minor": {
    desc: "Menor Melódica — Escala menor com 6ª e 7ª maiores ascendentes.",
    mood: "Intrigante, moderna, sofisticada e jazzística.",
    tip: "Muito popular em jazz para solos sobre acordes menor/maior ou para desenhar tensões modernas de fusão."
  },
  "phrygian dominant": {
    desc: "Frígio Dominante — O 5º modo da escala menor harmônica.",
    mood: "Árabe, cigano, exótico, altamente dramático e teatral.",
    tip: "Funciona incrivelmente sobre acordes dominantes secundários que resolvem em acordes menores (V7 ➔ im)."
  },
  "altered": {
    desc: "Escala Alterada — A escala superlócria (7º modo da menor melódica).",
    mood: "Tensa, ultra-jazzística, cromática e sofisticada.",
    tip: "Derrame tensões agressivas (b9, #9, b5, #5) sobre dominantes alterados (ex: G7alt) antes de pousar e repousar na tônica do acorde de resolução."
  },
  "lydian dominant": {
    desc: "Lídio Dominante — Escala mixolídia com a 4ª aumentada (#11).",
    mood: "Moderna, sofisticada, brilhante e misteriosa.",
    tip: "Perfeita para solar sobre acordes dominantes não-funcionais (como o acorde de bVII7 em cadências pop)."
  },
  "bebop major": {
    desc: "Bebop Maior — Escala maior com uma nota de passagem cromática (#5/b6) adicionada.",
    mood: "Fluida, clássica de swing e do jazz tradicional.",
    tip: "A nota de passagem cromática garante que as notas de arpejo caiam sempre nas batidas fortes do tempo."
  },
  "bebop": {
    desc: "Bebop Dominante — Escala mixolídia com uma 7ª maior de passagem cromática.",
    mood: "Ágil, melódica, típica do jazz tradicional (Charlie Parker).",
    tip: "Use para descer linhas rápidas de semicolcheia sobre acordes dominantes mantendo o suingue impecável."
  },
  "diminished": {
    desc: "Diminuta Tom/Semitom — Escala simétrica de 8 notas alternando tons e semitons.",
    mood: "Suspense, misteriosa, cinematográfica e de forte tensão.",
    tip: "Aplique sobre acordes diminutos para criar desenhos simétricos rápidos que fluem horizontalmente de 3 em 3 trastes."
  },
  "half-whole diminished": {
    desc: "Diminuta Semitom/Tom (Dom-Dim) — Alterna semitons e tons a partir da tônica.",
    mood: "Altamente tensa, intrigante, sofisticada e jazzística.",
    tip: "O segredo definitivo dos jazzistas para solar sobre dominantes estáticos, gerando as tensões b9, #9 e #11 em uma única fôrma simétrica."
  }
};

export default function ScaleOverlayPanel() {
  const {
    detectedChords,
    selectedChordIndex,
    activeScale,
    setActiveScale,
    isScaleSelectorOpen,
    setScaleSelectorOpen,
    notationStyle,
    tuning
  } = useChordStore();

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  if (!activeChord || !isScaleSelectorOpen) return null;

  // Encontra as escalas compatíveis teóricas
  const compatibleScales = getCompatibleScales(activeChord);

  const getChordName = (chord: typeof detectedChords[0]) => {
    if (notationStyle === "Brazilian") return chord.notationBrazilian;
    if (notationStyle === "Academic") return chord.notationAcademic;
    return chord.notationJazz;
  };

  const toggleScaleOverlay = (scaleName: string, notes: string[]) => {
    if (activeScale && activeScale.name === scaleName) {
      setActiveScale(null); // Desativa se já estiver ativa
    } else {
      setActiveScale({ name: scaleName, notes });
    }
  };

  // --- RENDERIZADOR DO BRAÇO INTERATIVO DA ESCALA ---
  const renderScaleFretboard = () => {
    if (!activeScale) return null;

    const scaleRootPC = getPitchClass(activeScale.notes[0]);

    // Geometria compacta do Braço SVG
    const width = 1360;  
    const height = 180;  // Altura ligeiramente reduzida para caber no modal
    const fretCount = 24;
    const fretWidth = (width - 60) / fretCount; 
    const nutWidth = 40; 

    // Marcadores clássicos
    const FRET_MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
    const DOUBLE_FRET_MARKERS = [12, 24];

    // Mapeamento de cores da escala
    const getNoteColor = (notePC: number, rootPC: number): string => {
      if (notePC === rootPC) return "#FF4D4D"; // Tônica (Coral Neon)
      const intervalDist = (notePC - rootPC + 12) % 12;
      switch (intervalDist) {
        case 3: // Terça menor
        case 4: // Terça Maior
          return "#00F0FF"; // Terça (Ciano Elétrico)
        case 5: // Quarta justa
        case 6: // Quinta diminuta / #11
        case 7: // Quinta Justa
        case 8: // Quinta aumentada / b13
          return "#00FF88"; // Quinta (Verde Esmeralda)
        case 10: // Sétima menor
        case 11: // Sétima Maior
          return "#BD00FF"; // Sétima (Roxo/Violeta)
        default: // Extensões
          return "#FF9900"; // Extensões (Laranja Âmbar)
      }
    };

    const getDegreeLabel = (notePC: number, rootPC: number): string => {
      if (notePC === rootPC) return "R";
      const dist = (notePC - rootPC + 12) % 12;
      const mapping: Record<number, string> = {
        1: "b9", 2: "9", 3: "b3", 4: "3", 5: "11", 6: "#11", 7: "5", 8: "b13", 9: "13", 10: "b7", 11: "7"
      };
      return mapping[dist] || `${dist}`;
    };

    return (
      <div className="w-full flex flex-col gap-2.5 mt-3 pt-3.5 border-t border-zinc-800/40">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-purple-400">Mapa Visual da Escala (Clique nas Notas para ouvir)</span>
            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></div>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Escala: {activeScale.name}</span>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-zinc-800/70 p-3 bg-zinc-950/80 shadow-inner select-none scrollbar-thin">
          <div className="min-w-[1360px] relative">
            <svg 
              width={width} 
              height={height} 
              viewBox={`0 0 ${width} ${height}`} 
              className="overflow-visible"
            >
              <defs>
                <linearGradient id="modal-wood-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1B1720" />
                  <stop offset="50%" stopColor="#141118" />
                  <stop offset="100%" stopColor="#0E0B10" />
                </linearGradient>
                <linearGradient id="modal-fret-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7E7D83" />
                  <stop offset="50%" stopColor="#D5D5D5" />
                  <stop offset="100%" stopColor="#5E5E63" />
                </linearGradient>
                <radialGradient id="modal-inlay-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#DEDECF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#B0B09E" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {/* Madeira do Braço */}
              <rect x={nutWidth} y="8" width={width - nutWidth} height={height - 16} fill="url(#modal-wood-grad)" rx="3" />

              {/* Marcadores de Traste (Inlays) */}
              {FRET_MARKERS.map(fret => {
                const x = nutWidth + (fret - 0.5) * fretWidth;
                return (
                  <circle key={`mod-inlay-${fret}`} cx={x} cy={height / 2} r="6" fill="url(#modal-inlay-glow)" />
                );
              })}

              {/* Marcadores Duplos (12 e 24) */}
              {DOUBLE_FRET_MARKERS.map(fret => {
                const x = nutWidth + (fret - 0.5) * fretWidth;
                return (
                  <g key={`mod-inlay-double-${fret}`}>
                    <circle cx={x} cy={height / 2 - 30} r="5.5" fill="url(#modal-inlay-glow)" />
                    <circle cx={x} cy={height / 2 + 30} r="5.5" fill="url(#modal-inlay-glow)" />
                  </g>
                );
              })}

              {/* Trastes */}
              <rect x={nutWidth - 6} y="6" width="6" height={height - 12} fill="#444" rx="1" />
              {Array.from({ length: fretCount }).map((_, idx) => {
                const x = nutWidth + (idx + 1) * fretWidth;
                return (
                  <rect key={`mod-fret-${idx + 1}`} x={x - 1} y="8" width="2" height={height - 16} fill="url(#modal-fret-grad)" />
                );
              })}

              {/* Cordas de Guitarra */}
              {Array.from({ length: 6 }).map((_, idx) => {
                const y = 16 + idx * 30;
                const gauge = 0.8 + idx * 0.5;
                return (
                  <line key={`mod-str-${idx}`} x1="0" y1={y} x2={width} y2={y} stroke="#777" strokeWidth={gauge} opacity="0.6" />
                );
              })}

              {/* Notas e cliques interativos da Escala */}
              {Array.from({ length: 6 }).map((_, stringIdx) => {
                const y = 16 + stringIdx * 30;
                const baseNote = tuning[stringIdx];

                return (
                  <g key={`mod-int-row-${stringIdx}`}>
                    {Array.from({ length: fretCount + 1 }).map((_, fret) => {
                      const noteName = getNoteAt(baseNote, fret);
                      const notePC = getPitchClass(noteName);
                      
                      const isScaleNote = activeScale.notes.map(n => getPitchClass(n)).includes(notePC);
                      if (!isScaleNote) return null;

                      const x = fret === 0 ? nutWidth / 2 : nutWidth + (fret - 0.5) * fretWidth;
                      
                      return (
                        <g 
                          key={`mod-note-${stringIdx}-${fret}`} 
                          className="cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95"
                          onClick={() => playGuitarNote(noteName)}
                        >
                          {/* Área de Clique expandida */}
                          <circle cx={x} cy={y} r="18" fill="transparent" />
                          {/* Bolinha Brilhante */}
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="11" 
                            className="stroke-2 stroke-zinc-950" 
                            style={{ 
                              fill: getNoteColor(notePC, scaleRootPC),
                              filter: `drop-shadow(0 0 5px ${getNoteColor(notePC, scaleRootPC)})` 
                            }} 
                          />
                          {/* Nome da Nota ou Grau */}
                          <text x={x} y={y + 3.5} textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#FFFFFF">
                            {getDegreeLabel(notePC, scaleRootPC)}
                          </text>
                          {/* Tooltip HTML clássico */}
                          <title>{`${noteName.replace(/\d/, "")} (${getDegreeLabel(notePC, scaleRootPC)})`}</title>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      onClick={() => setScaleSelectorOpen(false)}
    >
      <div 
        className="bg-[#121216]/98 border border-zinc-800/85 rounded-2xl p-6 w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] glass-panel relative animate-scale-up"
        onClick={(e) => e.stopPropagation()} // Impede fechamento ao clicar dentro do modal
      >
        
        {/* Botão Fechar */}
        <button 
          onClick={() => setScaleSelectorOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold bg-zinc-900 hover:bg-zinc-850 w-8 h-8 rounded-full flex items-center justify-center transition border border-zinc-800 cursor-pointer hover:scale-105 active:scale-95"
          title="Fechar"
        >
          ×
        </button>

        {/* Header do Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-4 gap-3 pr-8 select-none">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider">Laboratório de Improviso & Escalas Compatíveis</h2>
              <p className="text-[10px] text-zinc-400 font-medium">
                Acorde de referência fretado no braço: <span className="text-purple-300 font-bold">{getChordName(activeChord)}</span>
              </p>
            </div>
          </div>
          {activeScale && (
            <button
              onClick={() => setActiveScale(null)}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 cursor-pointer transition active:scale-95"
            >
              <EyeOff className="h-3 w-3" />
              Limpar Filtro do Braço
            </button>
          )}
        </div>

        {/* Conteúdo Principal com scroll interno */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4 scrollbar-thin">
          {compatibleScales.length > 0 ? (
            <div className="flex flex-col gap-3">
              
              {/* Parte Superior: Lista e Detalhes Lado a Lado */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Lado Esquerdo (col-span-7): Lista de Escalas */}
                <div className="lg:col-span-7 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1 select-none">Opções Compatíveis</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {compatibleScales.map(scale => {
                      const isActive = activeScale && activeScale.name === scale.name;
                      
                      return (
                        <div
                          key={scale.name}
                          onClick={() => toggleScaleOverlay(scale.name, scale.notes)}
                          className={`flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isActive 
                              ? "bg-purple-950/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)] scale-[1.01]" 
                              : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900/40 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-zinc-200">{scale.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-colors ${
                              isActive 
                                ? "bg-purple-650 text-white" 
                                : "bg-zinc-850 text-zinc-400"
                            }`}>
                              {isActive ? "Filtro Ativo" : "Mapear"}
                            </span>
                          </div>

                          {/* Notas */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {scale.notes.map((note, idx) => (
                              <span
                                key={`${note}-${idx}`}
                                className={`text-[9px] font-black w-4.5 h-4.5 rounded flex items-center justify-center transition-all ${
                                  idx === 0 
                                    ? "bg-rose-950 border border-rose-800 text-rose-300" 
                                    : "bg-zinc-900 text-zinc-300 border border-zinc-800/40"
                                }`}
                              >
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lado Direito (col-span-5): Guia do Improvisador Contextual */}
                <div className="lg:col-span-5 h-full">
                  {activeScale ? (() => {
                    const scaleType = activeScale.name.replace(/^[A-G][b#]?\s+/, "").toLowerCase().trim();
                    let info = SCALE_DESCRIPTIONS[scaleType];
                    
                    if (!info) {
                      const matchedKey = Object.keys(SCALE_DESCRIPTIONS).find(k => scaleType.includes(k));
                      if (matchedKey) info = SCALE_DESCRIPTIONS[matchedKey];
                    }

                    if (!info) {
                      info = {
                        desc: `Escala de improvisação perfeitamente sintonizada com a tônica e características do acorde.`,
                        mood: "Combinação harmônica fluida que expande a paleta de cores musicais.",
                        tip: "Toque melodias explorando a alternância entre notas estruturais (tônica, terça e quinta) e extensões cromáticas."
                      };
                    }
                    
                    return (
                      <div className="p-4 rounded-xl border border-purple-500/25 bg-purple-950/15 text-zinc-300 shadow-inner flex flex-col gap-2.5 animate-scale-up h-full justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                            <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">
                              Guia do Improvisador
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-zinc-100 leading-snug mt-1.5">
                            {info.desc}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2.5 mt-2.5 pt-2.5 border-t border-zinc-850/60">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-purple-400/80 uppercase tracking-wider">✨ Mood</span>
                            <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                              {info.mood}
                            </p>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-purple-400/80 uppercase tracking-wider">💡 Segredo</span>
                            <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                              {info.tip}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="h-[220px] rounded-xl border border-dashed border-zinc-850 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs italic gap-1 select-none">
                      <Sparkles className="h-5 w-5 text-zinc-700 animate-pulse" />
                      <span>Selecione uma escala ao lado para acender as dicas harmônicas e o braço da guitarra abaixo!</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Parte Inferior: O Fretboard da Escala Ativa */}
              {renderScaleFretboard()}

            </div>
          ) : (
            <div className="text-zinc-500 text-xs py-12 text-center border border-dashed border-zinc-850 rounded-xl select-none">
              Nenhuma escala compatível óbvia para esta qualidade de acorde.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
