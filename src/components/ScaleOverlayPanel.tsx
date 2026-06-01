import { useChordStore } from "../store/useChordStore";
import { getCompatibleScales } from "../utils/music/theory/musicTheory";
import { EyeOff, Sparkles } from "lucide-react";

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
    setActiveScale
  } = useChordStore();

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  if (!activeChord) return null;

  // Encontra as escalas compatíveis teóricas
  const compatibleScales = getCompatibleScales(activeChord);

  const toggleScaleOverlay = (scaleName: string, notes: string[]) => {
    if (activeScale && activeScale.name === scaleName) {
      setActiveScale(null); // Desativa se já estiver ativa
    } else {
      setActiveScale({ name: scaleName, notes });
    }
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Painel Único de Escalas Compatíveis para Improviso (Full Width) */}
      <div className="w-full flex flex-col gap-4 p-5 rounded-2xl border border-zinc-850 glass-panel shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Escalas Compatíveis para Improviso</h2>
          </div>
          {activeScale && (
            <button
              onClick={() => setActiveScale(null)}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 cursor-pointer transition"
            >
              <EyeOff className="h-3 w-3" />
              Limpar Overlay
            </button>
          )}
        </div>

        {compatibleScales.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {compatibleScales.map(scale => {
                const isActive = activeScale && activeScale.name === scale.name;
                
                return (
                  <div
                    key={scale.name}
                    onClick={() => toggleScaleOverlay(scale.name, scale.notes)}
                    className={`flex flex-col p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isActive 
                        ? "bg-purple-950/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)]" 
                        : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900/40 hover:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-zinc-200">{scale.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider transition-colors ${
                        isActive 
                          ? "bg-purple-650 text-white" 
                          : "bg-zinc-850 text-zinc-400"
                      }`}>
                        {isActive ? "Overlay Ativo" : "Ver no Braço"}
                      </span>
                    </div>

                    {/* Notas da Escala */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {scale.notes.map((note, idx) => (
                        <span
                          key={`${note}-${idx}`}
                          className={`text-[10px] font-semibold w-5 h-5 rounded flex items-center justify-center transition-all ${
                            idx === 0 
                              ? "bg-rose-950 border border-rose-800 text-rose-300 font-black" 
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

            {/* Guia de Improvisação da Escala Selecionada */}
            {activeScale && (() => {
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
                <div className="p-4 rounded-xl border border-purple-500/25 bg-purple-950/15 text-zinc-300 shadow-inner flex flex-col gap-2.5 animate-scale-up">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#c084fc]"></div>
                      <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                        🎸 Guia do Improvisador: {activeScale.name}
                      </span>
                    </div>
                    
                    {/* Badge da Tônica */}
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-zinc-400">
                      <span>Tônica Principal:</span>
                      <span className="text-rose-400 font-extrabold">{activeScale.notes[0]}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-0.5">
                    <p className="text-sm font-extrabold text-zinc-100 leading-snug">
                      {info.desc}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2.5 pt-2.5 border-t border-zinc-800/30">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-purple-400/80 uppercase tracking-wider">Mood / Clima Harmonioso</span>
                        <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                          ✨ {info.mood}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-purple-400/80 uppercase tracking-wider">Segredo do Solo</span>
                        <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                          💡 {info.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="text-zinc-500 text-xs py-6 text-center">
            Nenhuma escala compatível óbvia para esta qualidade de acorde.
          </div>
        )}
      </div>
    </div>
  );
}
