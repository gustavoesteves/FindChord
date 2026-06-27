import { useState } from "react";
import { useChordStore } from "../../../store/useChordStore";
import { getCompatibleScales } from "../../../utils/music/theory/musicTheory";
import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";
import { EyeOff, Sparkles, BookOpen } from "lucide-react";
import { getNoteAt } from "../../../utils/music/core/notes";
import { getPitchClass } from "../../../utils/music/core/pitch";
import { playGuitarNote } from "../../../utils/audioSynth";
import { Note as TonalNote } from "tonal";

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
    tip: "A 6ª maior é a nota de ouro aqui. Excelente para grooves modais no estilo de Miles Davis (So What) ou Santana."
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
    mood: "Intrigante, moderna, sofisticada e ambígua.",
    tip: "Muito usada para improvisar sobre acordes menor/maior ou para desenhar tensões modernas de fusão."
  },
  "phrygian dominant": {
    desc: "Frígio Dominante — O 5º modo da escala menor harmônica.",
    mood: "Árabe, cigano, exótico, altamente dramático e teatral.",
    tip: "Funciona incrivelmente sobre acordes dominantes secundários que resolvem em acordes menores (V7 ➔ im)."
  },
  "altered": {
    desc: "Escala Alterada — A escala superlócria (7º modo da menor melódica).",
    mood: "Tensa, cromática, sofisticada e direcional.",
    tip: "Derrame tensões agressivas (b9, #9, b5, #5) sobre dominantes alterados (ex: G7alt) antes de pousar e repousar na tônica do acorde de resolução."
  },
  "lydian dominant": {
    desc: "Lídio Dominante — Escala mixolídia com a 4ª aumentada (#11).",
    mood: "Moderna, sofisticada, brilhante e misteriosa.",
    tip: "Perfeita para solar sobre acordes dominantes não-funcionais (como o acorde de bVII7 em cadências pop)."
  },
  "bebop major": {
    desc: "Bebop Maior — Escala maior com uma nota de passagem cromática (#5/b6) adicionada.",
    mood: "Fluida, clássica de swing e improvisação tradicional.",
    tip: "A nota de passagem cromática garante que as notas de arpejo caiam sempre nas batidas fortes do tempo."
  },
  "bebop": {
    desc: "Bebop Dominante — Escala mixolídia com uma 7ª maior de passagem cromática.",
    mood: "Ágil, melódica, típica da linguagem bebop (Charlie Parker).",
    tip: "Use para descer linhas rápidas de semicolcheia sobre acordes dominantes mantendo o suingue impecável."
  },
  "diminished": {
    desc: "Diminuta Tom/Semitom — Escala simétrica de 8 notas alternando tons e semitons.",
    mood: "Suspense, misteriosa, cinematográfica e de forte tensão.",
    tip: "Aplique sobre acordes diminutos para criar desenhos simétricos rápidos que fluem horizontalmente de 3 em 3 trastes."
  },
  "half-whole diminished": {
    desc: "Diminuta Semitom/Tom (Dom-Dim) — Alterna semitons e tons a partir da tônica.",
    mood: "Altamente tensa, intrigante, sofisticada e simétrica.",
    tip: "Um recurso forte para improvisar sobre dominantes estáticos, gerando as tensões b9, #9 e #11 em uma única fôrma simétrica."
  }
};

export interface SuggestedLick {
  name: string;
  school: "Bebop" | "Chord-Scale" | "Linear" | "Modal";
  theoryDesc: string;
  intervals: string[];
}

const SUGGESTED_LICKS: Record<string, SuggestedLick> = {
  "major": {
    name: "Fraseado Linear (Bert Ligon Outline 1)",
    school: "Linear",
    theoryDesc: "Conecta a sétima maior (7) descendo linearmente até a terça (3), onde a nota de evitar (11) age rapidamente apenas como nota de passagem.",
    intervals: ["7M", "6M", "5P", "4P", "3M", "2M", "1P"]
  },
  "lydian": {
    name: "Gravidade Lídia (George Russell)",
    school: "Modal",
    theoryDesc: "Destaca a quarta aumentada (#11) como cor principal suspensa, subindo em direção à estabilidade da quinta justa (5) e tônica.",
    intervals: ["1P", "3M", "4A", "5P", "7M", "6M", "8P"]
  },
  "mixolydian": {
    name: "Fraseado Bebop Cromático (Barry Harris)",
    school: "Bebop",
    theoryDesc: "Cria balanço rítmico bebop conectando a sétima menor (b7) com a terça maior do acorde através de aproximações melódicas bop.",
    intervals: ["3M", "2M", "1P", "7m", "6M", "5P", "8P"]
  },
  "dorian": {
    name: "Dorian Swing (Miles Davis Style)",
    school: "Modal",
    theoryDesc: "Enfatiza a sexta maior (13) como a nota de assinatura dourada do modo, criando uma sonoridade modal sofisticada.",
    intervals: ["1P", "3m", "5P", "6M", "7m", "6M", "5P"]
  },
  "aeolian": {
    name: "Arpejo Menor Natural Dramático",
    school: "Chord-Scale",
    theoryDesc: "Desenha o contorno clássico da escala menor natural, marcando a tônica e terça antes de apoiar na carga dramática da sexta menor (b13).",
    intervals: ["1P", "3m", "5P", "6m", "5P", "3m", "1P"]
  },
  "phrygian": {
    name: "Linha Exótica Flamenca",
    school: "Bebop",
    theoryDesc: "Gera a tensão espanhola imediata ao iniciar o fraseado diretamente na segunda menor (b9), resolvendo passo a passo na tônica.",
    intervals: ["2m", "1P", "7m", "6m", "5P", "3m", "1P"]
  },
  "locrian": {
    name: "Tensão Meio-Diminuta (Berklee)",
    school: "Chord-Scale",
    theoryDesc: "Ideal sobre acordes m7b5. Contorna a quinta diminuta (b5) para criar forte tensão instável antes de preparar a resolução.",
    intervals: ["1P", "3m", "5d", "7m", "8P", "5d", "1P"]
  }
};

interface ScaleNoteClass {
  category: "root" | "chordTone" | "characteristic" | "tension" | "avoid";
  label: string;
  color: string;
  glow: string;
  tooltip: string;
}

function classifyScaleNote(
  noteName: string,
  chordRoot: string,
  chordNotes: string[],
  scaleType: string
): ScaleNoteClass {
  const notePC = getPitchClass(noteName);
  const rootPC = getPitchClass(chordRoot);
  const chordPCs = chordNotes.map(n => getPitchClass(n));
  const dist = (notePC - rootPC + 12) % 12;

  // 1. TÔNICA
  if (notePC === rootPC) {
    return {
      category: "root",
      label: "R (Tônica)",
      color: "#0165e7",
      glow: "shadow-[0_0_12px_#0165e7]",
      tooltip: "Tônica: O centro gravitacional absoluto do acorde. Nota de repouso perfeito."
    };
  }

  // 2. NOTA CARACTERÍSTICA (MODAL COLOR NOTE SIGNATURE)
  if (scaleType.includes("lydian") && dist === 6) {
    return {
      category: "characteristic",
      label: "#11 (Modal)",
      color: "#FCD34D",
      glow: "shadow-[0_0_15px_#FCD34D] border-2 border-amber-300 animate-pulse",
      tooltip: "Assinatura Lídia: A quarta aumentada (#11) dá a cor mística, flutuante e espacial característica do modo lídio."
    };
  }
  if (scaleType.includes("dorian") && dist === 9) {
    return {
      category: "characteristic",
      label: "13 (Modal)",
      color: "#FCD34D",
      glow: "shadow-[0_0_15px_#FCD34D] border-2 border-amber-300 animate-pulse",
      tooltip: "Assinatura Dórica: A sexta maior (13) é o intervalo dourado que dá o sabor modal e suingado ao modo dórico."
    };
  }
  if (scaleType.includes("mixolydian") && dist === 10) {
    return {
      category: "characteristic",
      label: "b7 (Modal)",
      color: "#FCD34D",
      glow: "shadow-[0_0_15px_#FCD34D] border-2 border-amber-300 animate-pulse",
      tooltip: "Assinatura Mixolídia: A sétima menor (b7) cria o tempero clássico do rock sulista, blues e MPB."
    };
  }
  if (scaleType.includes("phrygian") && dist === 1) {
    return {
      category: "characteristic",
      label: "b9 (Modal)",
      color: "#FCD34D",
      glow: "shadow-[0_0_15px_#FCD34D] border-2 border-amber-300 animate-pulse",
      tooltip: "Assinatura Frígia: A segunda menor (b9) gera a sonoridade exótica, sombria, espanhola e flamenca típica."
    };
  }
  if (scaleType.includes("locrian") && dist === 6) {
    return {
      category: "characteristic",
      label: "b5 (Modal)",
      color: "#FCD34D",
      glow: "shadow-[0_0_15px_#FCD34D] border-2 border-amber-300 animate-pulse",
      tooltip: "Assinatura Lócria: A quinta diminuta (b5) é a nota de forte instabilidade, tensão e mistério do modo."
    };
  }

  // 3. CHORD TONE (Notas do Acorde)
  if (chordPCs.includes(notePC)) {
    const labels: Record<number, string> = {
      3: "3ª (Acorde)", 4: "3ª (Acorde)",
      5: "5ª (Acorde)", 6: "5ª (Acorde)", 7: "5ª (Acorde)", 8: "5ª (Acorde)",
      9: "7ª (Acorde)", 10: "7ª (Acorde)", 11: "7ª (Acorde)"
    };
    return {
      category: "chordTone",
      label: labels[dist] || "Acorde",
      color: "#ff4e8c",
      glow: "shadow-[0_0_8px_#ff4e8c]",
      tooltip: "Nota do Acorde: Ponto de ancoragem harmônica ultra-estável. Excelente para repousar e finalizar frases."
    };
  }

  // 4. AVOID NOTE (Notas de Evitar / Fricção Crítica)
  const isAvoid4th = (scaleType === "major" || scaleType.includes("bebop") || scaleType.includes("mixolydian")) && dist === 5;
  const isAvoid6th = (scaleType.includes("aeolian") || scaleType.includes("phrygian")) && dist === 8;
  const isAvoid2nd = scaleType.includes("locrian") && dist === 1;

  if (isAvoid4th || isAvoid6th || isAvoid2nd) {
    const labels: Record<number, string> = { 1: "b9 (Evitar)", 5: "11 (Evitar)", 8: "b13 (Evitar)" };
    return {
      category: "avoid",
      label: labels[dist] || "Evitar",
      color: "#EF4444",
      glow: "shadow-[0_0_10px_rgba(239,68,68,0.4)] border border-dashed border-red-500",
      tooltip: "Nota de Evitar (Avoid Note): Cria forte tensão de semitônio com a terça ou quinta. Não repouse nela; use preferencialmente como nota rápida de passagem."
    };
  }

  // 5. TENSION NOTE (Extensões de Cor Estáveis)
  const labels: Record<number, string> = {
    1: "b9", 2: "9", 5: "11", 6: "#11", 8: "b13", 9: "13"
  };
  return {
    category: "tension",
    label: labels[dist] || `${dist}`,
    color: "#FF9900",
    glow: "shadow-[0_0_6px_rgba(255,153,0,0.3)]",
    tooltip: "Tensão Estável: Nota de cor melódica rica que adiciona sofisticação e tempero ao fraseado."
  };
}

export default function ScaleOverlayPanel() {
  const {
    detectedChords,
    selectedChordIndex,
    notationStyle,
    tuning
  } = useChordStore();

  const [localActiveScale, setLocalActiveScale] = useState<ScaleInfo | null>(null);
  const [labelMode, setLabelMode] = useState<"position" | "note">("position");
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    root: true,
    chordTone: true,
    characteristic: true,
    tension: true,
    avoid: true
  });

  const toggleCategoryVisibility = (category: string) => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const playLickSequence = (intervals: string[]) => {
    if (!activeChord) return;
    intervals.forEach((interval, idx) => {
      const note = TonalNote.simplify(TonalNote.transpose(`${activeChord.root}4`, interval));
      playGuitarNote(note, idx * 280);
    });
  };

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  if (!activeChord) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border border-dashed border-zinc-800 text-center">
        <Sparkles className="h-8 w-8 text-zinc-600" />
        <div>
          <p className="text-sm font-bold text-zinc-500">Nenhum acorde detectado</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs">
            Pressione casas no braço virtual (aba "Captura &amp; Fretboard") para identificar um acorde e ver as escalas compatíveis.
          </p>
        </div>
      </div>
    );
  }
  if (!activeChord) return null;

  // Encontra as escalas compatíveis teóricas
  const compatibleScales = getCompatibleScales(activeChord);

  const getChordName = (chord: typeof detectedChords[0]) => {
    if (notationStyle === "Brazilian") return chord.notationBrazilian;
    if (notationStyle === "Academic") return chord.notationAcademic;
    return chord.notationInternational;
  };

  const toggleScaleOverlay = (scale: ScaleInfo) => {
    if (localActiveScale && localActiveScale.name === scale.name) {
      setLocalActiveScale(null); // Desativa se já estiver ativa
    } else {
      setLocalActiveScale(scale);
    }
  };

  // --- RENDERIZADOR DO BRAÇO INTERATIVO DA ESCALA ---
  const renderScaleFretboard = () => {
    if (!localActiveScale) return null;

    const scaleType = localActiveScale.type;

    // Geometria compacta do Braço SVG
    const width = 1360;  
    const height = 32 + (tuning.length - 1) * 30;  
    const fretCount = 24;
    const fretWidth = (width - 60) / fretCount; 
    const nutWidth = 40; 

    // Marcadores clássicos
    const FRET_MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
    const DOUBLE_FRET_MARKERS = [12, 24];

    return (
      <div className="w-full flex flex-col gap-2.5 mt-3 pt-3.5 border-t border-zinc-850 animate-fade-in">
        <div className="flex items-center justify-between px-1 select-none flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-purple-400">
                Mapa Harmônico da Escala (Pressione para ouvir)
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></div>
            </div>

            {/* Toggle Notas / Posição */}
            <div className="flex items-center bg-zinc-900 border border-zinc-850 p-0.5 rounded-lg text-[9px] font-bold">
              <button
                onClick={() => setLabelMode("position")}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  labelMode === "position" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-250"
                }`}
                title="Mostrar Graus/Intervalos do campo harmônico (R, 3ª, 5ª, b7...)"
              >
                Posição
              </button>
              <button
                onClick={() => setLabelMode("note")}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  labelMode === "note" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-250"
                }`}
                title="Mostrar notas absolutas no braço (C, D, E...)"
              >
                Notas
              </button>
            </div>
          </div>
          
          {/* Legenda de Cores Interativa */}
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 flex-wrap select-none">
            <button
              onClick={() => toggleCategoryVisibility("root")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                visibleCategories.root
                  ? "bg-[#0165e7]/10 border-[#0165e7]/45 text-zinc-200 shadow-[0_0_6px_rgba(1,101,231,0.06)]"
                  : "bg-zinc-950/40 border-zinc-900/50 text-zinc-500 opacity-45"
              }`}
              title="Alternar visibilidade das tônicas"
            >
              <span className={`w-2 h-2 rounded-full transition-transform ${visibleCategories.root ? "bg-[#0165e7] shadow-[0_0_5px_#0165e7]" : "bg-zinc-700"}`}></span>
              <span>Tônica</span>
            </button>

            <button
              onClick={() => toggleCategoryVisibility("chordTone")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                visibleCategories.chordTone
                  ? "bg-[#ff4e8c]/10 border-[#ff4e8c]/45 text-zinc-200 shadow-[0_0_6px_rgba(255,78,140,0.06)]"
                  : "bg-zinc-950/40 border-zinc-900/50 text-zinc-500 opacity-45"
              }`}
              title="Alternar visibilidade das notas do acorde"
            >
              <span className={`w-2 h-2 rounded-full transition-transform ${visibleCategories.chordTone ? "bg-[#ff4e8c] shadow-[0_0_5px_#ff4e8c]" : "bg-zinc-700"}`}></span>
              <span>Acorde</span>
            </button>

            <button
              onClick={() => toggleCategoryVisibility("characteristic")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                visibleCategories.characteristic
                  ? "bg-[#FCD34D]/10 border-[#FCD34D]/45 text-zinc-200 shadow-[0_0_6px_rgba(252,211,77,0.06)]"
                  : "bg-zinc-950/40 border-zinc-900/50 text-zinc-500 opacity-45"
              }`}
              title="Alternar visibilidade das notas de assinatura modal"
            >
              <span className={`w-2 h-2 rounded-full transition-transform ${visibleCategories.characteristic ? "bg-[#FCD34D] shadow-[0_0_8px_#FCD34D] animate-pulse" : "bg-zinc-700"}`}></span>
              <span>Nota Modal</span>
            </button>

            <button
              onClick={() => toggleCategoryVisibility("tension")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                visibleCategories.tension
                  ? "bg-[#FF9900]/10 border-[#FF9900]/45 text-zinc-200 shadow-[0_0_6px_rgba(255,153,0,0.06)]"
                  : "bg-zinc-950/40 border-zinc-900/50 text-zinc-500 opacity-45"
              }`}
              title="Alternar visibilidade das tensões admissíveis"
            >
              <span className={`w-2 h-2 rounded-full transition-transform ${visibleCategories.tension ? "bg-[#FF9900] shadow-[0_0_5px_#FF9900]" : "bg-zinc-700"}`}></span>
              <span>Tensão</span>
            </button>

            <button
              onClick={() => toggleCategoryVisibility("avoid")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                visibleCategories.avoid
                  ? "bg-[#EF4444]/10 border-[#EF4444]/45 text-zinc-200 shadow-[0_0_6px_rgba(239,68,68,0.06)]"
                  : "bg-zinc-950/40 border-zinc-900/50 text-zinc-500 opacity-45"
              }`}
              title="Alternar visibilidade das notas de evitar"
            >
              <span className={`w-2 h-2 rounded-full transition-transform ${visibleCategories.avoid ? "bg-[#EF4444] shadow-[0_0_5px_#EF4444] border border-dashed border-red-500" : "bg-zinc-700"}`}></span>
              <span>Evitar (Avoid)</span>
            </button>
          </div>
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
                  <stop offset="0%" stopColor="#252528" />
                  <stop offset="50%" stopColor="#1a1a1c" />
                  <stop offset="100%" stopColor="#131315" />
                </linearGradient>
                <radialGradient id="modal-inlay-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#DEDECF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#B0B09E" stopOpacity="0.1" />
                </radialGradient>
              </defs>

              {/* Madeira do Braço */}
              <rect x={nutWidth} y="8" width={width - nutWidth} height={height - 16} fill="url(#modal-wood-grad)" rx="3" />

              {/* Marcadores de Traste */}
              {FRET_MARKERS.map(fret => {
                const x = nutWidth + (fret - 0.5) * fretWidth;
                return (
                  <circle key={`mod-inlay-${fret}`} cx={x} cy={height / 2} r="5" fill="url(#modal-inlay-glow)" />
                );
              })}

              {/* Marcadores Duplos (12 e 24) */}
              {DOUBLE_FRET_MARKERS.map(fret => {
                const x = nutWidth + (fret - 0.5) * fretWidth;
                return (
                  <g key={`mod-inlay-double-${fret}`}>
                    <circle cx={x} cy={height / 2 - 30} r="4.5" fill="url(#modal-inlay-glow)" />
                    <circle cx={x} cy={height / 2 + 30} r="4.5" fill="url(#modal-inlay-glow)" />
                  </g>
                );
              })}

              {/* Trastes (Linhas discretas como Fretastic) */}
              <rect x={nutWidth - 6} y="8" width="6" height={height - 16} fill="#444" rx="1" />
              {Array.from({ length: fretCount }).map((_, idx) => {
                const x = nutWidth + (idx + 1) * fretWidth;
                return (
                  <line 
                    key={`mod-fret-${idx + 1}`} 
                    x1={x} 
                    y1="8" 
                    x2={x} 
                    y2={height - 8} 
                    stroke="hsl(0, 0%, 27%)" 
                    strokeWidth="1.2" 
                  />
                );
              })}

              {/* Cordas de Guitarra */}
              {tuning.map((_, idx) => {
                const y = 16 + idx * 30;
                const gauge = 0.8 + idx * 0.5;
                return (
                  <line key={`mod-str-${idx}`} x1="0" y1={y} x2={width} y2={y} stroke="hsl(0, 0%, 37%)" strokeWidth={gauge} opacity="0.6" />
                );
              })}

              {/* Notas e cliques interativos da Escala */}
              {tuning.map((_, stringIdx) => {
                const y = 16 + stringIdx * 30;
                const baseNote = tuning[stringIdx];

                return (
                  <g key={`mod-int-row-${stringIdx}`}>
                    {Array.from({ length: fretCount + 1 }).map((_, fret) => {
                      const noteName = getNoteAt(baseNote, fret);
                      const notePC = getPitchClass(noteName);
                      
                      const isScaleNote = localActiveScale.notes.map(n => getPitchClass(n)).includes(notePC);
                      if (!isScaleNote) return null;

                      // Músico inteligente: Classificação teórica de graus
                      const noteClass = classifyScaleNote(
                        noteName, 
                        activeChord.root, 
                        activeChord.notes, 
                        scaleType
                      );

                      // Filtro de visibilidade interativo
                      if (!visibleCategories[noteClass.category]) return null;

                      const x = fret === 0 ? nutWidth / 2 : nutWidth + (fret - 0.5) * fretWidth;

                      return (
                        <g 
                          key={`mod-note-${stringIdx}-${fret}`} 
                          className="cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-95"
                          style={{ transformOrigin: `${x}px ${y}px` }}
                          onClick={() => playGuitarNote(noteName)}
                        >
                          {/* Área de Clique expandida */}
                          <circle cx={x} cy={y} r="18" fill="transparent" />
                          
                          {/* Bolinha Brilhante Classificada */}
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="11.5" 
                            className={`stroke-2 ${noteClass.category === "characteristic" ? "stroke-amber-300" : "stroke-zinc-950"}`} 
                            style={{ 
                              fill: noteClass.color,
                              filter: `drop-shadow(0 0 ${noteClass.category === "characteristic" ? "7px" : "4px"} ${noteClass.color})` 
                            }} 
                          />
                          {/* Nome da Nota ou Grau */}
                          <text x={x} y={y + 3} textAnchor="middle" fontSize="7.5" fontWeight="950" fill="#FFFFFF">
                            {labelMode === "note" ? noteName.replace(/\d/, "") : noteClass.label.split(" ")[0]}
                          </text>
                          {/* Tooltip Educacional Harmônico */}
                          <title>{`${noteName.replace(/\d/, "")} - ${noteClass.label}\n\n${noteClass.tooltip}`}</title>
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

  // ── Conteúdo compartilhado ─────────────────────────────────────
  const sharedContent = (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-4 gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <div>
            <h2 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider">Laboratório de Improviso &amp; Escalas Compatíveis</h2>
            <p className="text-[10px] text-zinc-400 font-medium">
              Acorde de referência: <span className="text-purple-300 font-bold">{getChordName(activeChord)}</span>
            </p>
          </div>
        </div>
        {localActiveScale && (
          <button
            onClick={() => setLocalActiveScale(null)}
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 cursor-pointer transition active:scale-95"
          >
            <EyeOff className="h-3 w-3" />
            Limpar Filtro do Braço
          </button>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col gap-4">
        {compatibleScales.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Lado Esquerdo: Lista de Escalas */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1 select-none">Opções Compatíveis</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {compatibleScales.map(scale => {
                    const isActive = localActiveScale && localActiveScale.name === scale.name;
                    return (
                      <div
                        key={scale.name}
                        onClick={() => toggleScaleOverlay(scale)}
                        className={`flex flex-col p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isActive
                            ? "bg-purple-950/20 border-purple-500/60 shadow-[0_0_15px_rgba(255,78,140,0.1)] scale-[1.01]"
                            : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900/40 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-zinc-200">{scale.name}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-colors ${
                            isActive ? "bg-purple-650 text-white" : "bg-zinc-850 text-zinc-400"
                          }`}>
                            {isActive ? "Filtro Ativo" : "Mapear"}
                          </span>
                        </div>
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

              {/* Lado Direito: Guia do Improvisador */}
              <div className="lg:col-span-5 h-full">
                {localActiveScale ? (() => {
                  const scaleType = localActiveScale.type;
                  let info = SCALE_DESCRIPTIONS[scaleType];
                  if (!info) {
                    const matchedKey = Object.keys(SCALE_DESCRIPTIONS).find(k => scaleType.includes(k));
                    if (matchedKey) info = SCALE_DESCRIPTIONS[matchedKey];
                  }
                  if (!info) {
                    info = {
                      desc: `Escala de improvisação sintonizada com a tônica e características do acorde.`,
                      mood: "Combinação harmônica fluida.",
                      tip: "Explore alternando entre notas estruturais e extensões cromáticas."
                    };
                  }
                  const lick = SUGGESTED_LICKS[scaleType];
                  return (
                    <div className="p-4 rounded-xl border border-purple-500/25 bg-purple-950/15 text-zinc-300 shadow-inner flex flex-col gap-3.5 animate-scale-up h-full justify-between select-none">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Guia do Improvisador</span>
                        </div>
                        <p className="text-xs font-extrabold text-zinc-100 leading-snug">{info.desc}</p>
                        <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-zinc-800/40 text-[10px]">
                          <div className="leading-tight">
                            <span className="font-black text-purple-400 uppercase tracking-wider">✨ Mood: </span>
                            <span className="text-zinc-300 font-semibold">{info.mood}</span>
                          </div>
                          <div className="leading-tight mt-1">
                            <span className="font-black text-purple-400 uppercase tracking-wider">💡 Segredo: </span>
                            <span className="text-zinc-300 font-semibold">{info.tip}</span>
                          </div>
                        </div>
                      </div>
                      {lick && (
                        <div className="flex flex-col gap-2 mt-2.5 pt-2.5 border-t border-purple-500/25 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Lick / Frase de Estudo ({lick.school})</span>
                            </div>
                            <button
                              onClick={() => playLickSequence(lick.intervals)}
                              className="flex items-center gap-1 text-[8.5px] font-black px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 transition cursor-pointer active:scale-95 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:scale-105"
                            >
                              ▶ Ouvir
                            </button>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-zinc-100 leading-tight">{lick.name}</span>
                            <p className="text-[9.5px] text-zinc-400 leading-relaxed font-semibold">{lick.theoryDesc}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lick.intervals.map((interval, idx) => {
                              const noteName = TonalNote.simplify(
                                TonalNote.transpose(`${activeChord.root}4`, interval)
                              ).replace(/\d/, "");
                              return (
                                <span key={`${interval}-${idx}`} className="text-[8.5px] font-black px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-amber-300">
                                  {noteName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

            {/* Fretboard da Escala */}
            {renderScaleFretboard()}
          </div>
        ) : (
          <div className="text-zinc-500 text-xs py-12 text-center border border-dashed border-zinc-850 rounded-xl select-none">
            Nenhuma escala compatível óbvia para esta qualidade de acorde.
          </div>
        )}
      </div>
    </div>
  );

  return <div className="w-full">{sharedContent}</div>;
}
