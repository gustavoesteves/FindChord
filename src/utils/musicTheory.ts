import { Chord as TonalChord, Note as TonalNote, Scale as TonalScale, Interval as TonalInterval } from "tonal";
import type { FretPosition, ChordCandidate } from "../store/useChordStore";

// Dicionário de equivalências enarmônicas para simplificação visual
const PREFERRED_SPELLINGS: Record<string, string> = {
  "A#": "Bb",
  "D#": "Eb",
  "G#": "Ab",
  "C#": "Db",
  "E#": "F",
  "B#": "C",
  "Cb": "B",
  "Fb": "E",
  "Fx": "G", // Fá dobrado sustenido -> Sol
  "Cx": "D"
};

// Escalas suportadas na biblioteca profunda
export interface ScaleInfo {
  name: string;
  type: string;
  intervals: string[];
  notes: string[];
}

// Progressões comuns para o Progression Explorer
export interface ProgressionTemplate {
  name: string;
  romanNumerals: string[];
  description: string;
  degrees: number[]; // 1-based diatonic degrees, ex: [2, 5, 1] para ii-V-I
}

export const COMMON_PROGRESSIONS: ProgressionTemplate[] = [
  {
    name: "ii - V - I (Jazz)",
    romanNumerals: ["ii", "V", "I"],
    description: "A cadência mais famosa do Jazz e Bossa Nova, resolvendo na tônica.",
    degrees: [2, 5, 1]
  },
  {
    name: "I - vi - ii - V (Pop/Jazz)",
    romanNumerals: ["I", "vi", "ii", "V"],
    description: "Progressão circular clássica usada em centenas de clássicos dos anos 50 e jazz standard.",
    degrees: [1, 6, 2, 5]
  },
  {
    name: "I - V - vi - IV (Pop Standard)",
    romanNumerals: ["I", "V", "vi", "IV"],
    description: "A progressão pop mais famosa do mundo (ex: Let It Be, No Woman No Cry).",
    degrees: [1, 5, 6, 4]
  },
  {
    name: "i - bVI - bIII - bVII (Rock/Epic)",
    romanNumerals: ["i", "VI", "III", "VII"],
    description: "Progressão menor muito comum no Rock e trilhas épicas (ex: Zombie).",
    degrees: [1, 6, 3, 7] // No contexto menor
  },
  {
    name: "ii - bII7 - I (Tritone Sub)",
    romanNumerals: ["ii", "subV", "I"],
    description: "Substituição de trítono clássica do acorde dominante (V) por um bII7.",
    degrees: [2, 2, 1] // Trítono sub (ex: Dm7 -> Db7 -> Cmaj7)
  }
];

// Dicionário de escalas com suporte estendido
export const SCALE_CATEGORIES = {
  greek: [
    { name: "Jônio (Maior)", key: "major" },
    { name: "Dórico", key: "dorian" },
    { name: "Frígio", key: "phrygian" },
    { name: "Lídio", key: "lydian" },
    { name: "Mixolídio", key: "mixolydian" },
    { name: "Eólio (Menor Natural)", key: "aeolian" },
    { name: "Lócrio", key: "locrian" }
  ],
  minorModes: [
    { name: "Menor Harmônica", key: "harmonic minor" },
    { name: "Frígio Dominante (5º grau Harm.)", key: "phrygian dominant" },
    { name: "Menor Melódica", key: "melodic minor" },
    { name: "Lídio Dominante (4º grau Melód.)", key: "lydian dominant" },
    { name: "Escala Alterada (Superlócria)", key: "altered" }
  ],
  symmetrical: [
    { name: "Diminuta Tom/Semitom", key: "diminished" },
    { name: "Diminuta Semitom/Tom", key: "half-whole diminished" },
    { name: "Tons Inteiros (Whole Tone)", key: "augmented" }
  ],
  jazzPop: [
    { name: "Pentatônica Maior", key: "pentatonic" },
    { name: "Pentatônica Menor", key: "minor pentatonic" },
    { name: "Escala de Blues", key: "blues" },
    { name: "Bebop Dominante", key: "bebop" },
    { name: "Bebop Maior", key: "bebop major" }
  ]
};

/**
 * Transpõe uma nota base por um número de semitons e simplifica enarmônicos bizarros.
 */
export function getNoteAt(baseNote: string, fret: number): string {
  const transposed = TonalNote.transpose(baseNote, TonalInterval.fromSemitones(fret));
  return simplifyNote(transposed);
}

/**
 * Corrige grafias enarmônicas complexas para melhorar a legibilidade.
 */
export function simplifyNote(noteName: string): string {
  const scientific = TonalNote.get(noteName);
  if (scientific.empty) return noteName;
  
  const pitchClass = scientific.pc;
  const octave = scientific.oct !== undefined ? scientific.oct : "";
  
  if (PREFERRED_SPELLINGS[pitchClass]) {
    return PREFERRED_SPELLINGS[pitchClass] + octave;
  }
  
  // Tonal.js simplify pode ajudar
  const simplified = TonalNote.simplify(noteName);
  return simplified;
}

/**
 * Retorna a classe de altura (Pitch Class: 0 a 11) de uma nota.
 */
export function getPitchClass(noteName: string): number {
  const note = TonalNote.get(noteName);
  return note.empty ? -1 : note.chroma ?? -1;
}

/**
 * Retorna a oitava de uma nota.
 */
export function getOctave(noteName: string): number {
  const note = TonalNote.get(noteName);
  return note.empty ? 4 : note.oct ?? 4;
}

/**
 * Retorna as notas absolutas de um acorde a partir de sua tônica e tipo.
 */
export function getNotesForChord(root: string, type: string): string[] {
  const chord = TonalChord.get(`${root}${type}`);
  return chord.notes.map(n => simplifyNote(n));
}

/**
 * Retorna o baixo físico (a nota mais grave de menor frequência).
 */
export function getLowestNote(positions: FretPosition[]): FretPosition | null {
  if (positions.length === 0) return null;
  
  // Ordena por string index descendente (cordas mais graves têm maior index físico: 5 é a 6ª corda, 0 é a 1ª)
  // E também por nota absoluta (oitava e pitch class)
  return [...positions].reduce((lowest, current) => {
    // Frequência física aproximada baseada na oitava e pitch class
    const currentFreq = current.octave * 12 + current.pitchClass;
    const lowestFreq = lowest.octave * 12 + lowest.pitchClass;
    return currentFreq < lowestFreq ? current : lowest;
  });
}

/**
 * Mapeia um intervalo formal (ex: "3M", "5P", "7m") para nomes amigáveis.
 */
export function getFriendlyInterval(interval: string): string {
  const mapping: Record<string, string> = {
    "1P": "Fundamental (1)",
    "1d": "Fundamental (1)",
    "2m": "Segunda menor (b2)",
    "2M": "Segunda Maior (2)",
    "2A": "Segunda Aumentada (#2)",
    "3m": "Terça menor (b3)",
    "3M": "Terça Maior (3)",
    "4P": "Quarta Justa (4)",
    "4A": "Quarta Aumentada (#4)",
    "5d": "Quinta Diminuta (b5)",
    "5P": "Quinta Justa (5)",
    "5A": "Quinta Aumentada (#5)",
    "6m": "Sexta menor (b6)",
    "6M": "Sexta Maior (6)",
    "7d": "Sétima Diminuta (bb7)",
    "7m": "Sétima menor (b7)",
    "7M": "Sétima Maior (7)",
    "8P": "Oitava (8)",
    "9m": "Nona menor (b9)",
    "9M": "Nona Maior (9)",
    "9A": "Nona Aumentada (#9)",
    "11P": "Décima Primeira (11)",
    "11A": "Décima Primeira Aumentada (#11)",
    "13m": "Décima Terceira menor (b13)",
    "13M": "Décima Terceira (13)"
  };
  return mapping[interval] || interval;
}

/**
 * Converte notas em uma armadura de clave recomendada ou corrige enarmônicos do acorde
 */
export function correctChordSpelling(chordName: string, root: string): string {
  if (PREFERRED_SPELLINGS[root]) {
    const newRoot = PREFERRED_SPELLINGS[root];
    return chordName.replace(root, newRoot);
  }
  return chordName;
}

/**
 * Algoritmo robusto de detecção de acordes com Confidence Score e suporte a incompletos (no5)
 */
export function analyzeChords(positions: FretPosition[]): ChordCandidate[] {
  if (positions.length === 0) return [];

  // Extrair notas únicas (classes de altura únicas) e nomes
  const uniqueNoteNames = Array.from(new Set(positions.map(p => simplifyNote(p.noteName).replace(/\d/, ""))));
  const uniquePitchClasses = Array.from(new Set(positions.map(p => p.pitchClass)));
  
  // Encontrar o baixo físico
  const bassFret = getLowestNote(positions);
  const bassNote = bassFret ? simplifyNote(bassFret.noteName).replace(/\d/, "") : "";

  // 1. Usar o Tonal.js como primeira peneira
  let tonalCandidates = TonalChord.detect(uniqueNoteNames);
  
  // Se não encontrar nada e tivermos 2 ou 3 notas, tentamos forçar quintas ou tríades básicas
  if (tonalCandidates.length === 0 && uniqueNoteNames.length > 0) {
    // Adiciona caminhos para power chords ou intervalos simples
    if (uniquePitchClasses.length === 2) {
      // Ex: C e G -> C5 (power chord)
      const p1 = uniquePitchClasses[0];
      const p2 = uniquePitchClasses[1];
      const dist = Math.abs(p1 - p2);
      if (dist === 7 || dist === 5) {
        // Quinta justa
        const root = dist === 7 ? (p1 < p2 ? uniqueNoteNames[0] : uniqueNoteNames[1]) : (p1 < p2 ? uniqueNoteNames[1] : uniqueNoteNames[0]);
        tonalCandidates.push(`${root}5`);
      }
    }
  }

  const candidates: ChordCandidate[] = [];

  // 2. Avaliar todas as notas selecionadas como possíveis tônicas (especialmente para no5 e rootless)
  const candidatePool = new Set<string>(tonalCandidates);
  
  // Gerar hipóteses extras a partir de cada nota ativa no braço
  uniqueNoteNames.forEach(root => {
    // Testamos qualidades comuns
    ["", "m", "7", "maj7", "m7", "5", "sus4", "sus2", "add9", "madd9", "6", "m6", "dim", "aug", "m7b5", "dim7"].forEach(quality => {
      candidatePool.add(`${root}${quality}`);
    });
  });

  candidatePool.forEach(chordSymbol => {
    const chord = TonalChord.get(chordSymbol);
    if (chord.empty) return;

    // Notas clássicas que formam o acorde na teoria
    const formulaNotes = chord.notes.map(n => simplifyNote(n).replace(/\d/, ""));
    const formulaPitchClasses = formulaNotes.map(n => getPitchClass(n));
    const chordRoot = simplifyNote(chord.tonic || chordSymbol.substring(0, 1)).replace(/\d/, "");
    const chordRootPC = getPitchClass(chordRoot);

    // Mapear intervalos do acorde
    const chordIntervals = chord.intervals;

    let score = 0;
    const omissions: string[] = [];
    const additions: string[] = [];

    // --- CRITÉRIOS DE PONTUAÇÃO ---
    
    // 1. Tônica (Root) Presente
    const rootPresent = uniquePitchClasses.includes(chordRootPC);
    if (rootPresent) {
      score += 20;
    } else {
      score -= 25; // Penalidade grave: rootless voicing
      omissions.push("1");
    }

    // 2. Terça Presente (Maior ou menor)
    const hasThird = chordIntervals.some(i => i.startsWith("3"));
    if (hasThird) {
      const thirdPC = formulaPitchClasses[chordIntervals.findIndex(i => i.startsWith("3"))];
      if (uniquePitchClasses.includes(thirdPC)) {
        score += 15;
      } else {
        score -= 15; // Penalidade severa: perde definição modal
        omissions.push(chordIntervals.find(i => i.startsWith("3")) || "3");
      }
    }

    // 3. Sétima Presente
    const hasSeventh = chordIntervals.some(i => i.startsWith("7"));
    if (hasSeventh) {
      const seventhPC = formulaPitchClasses[chordIntervals.findIndex(i => i.startsWith("7"))];
      if (uniquePitchClasses.includes(seventhPC)) {
        score += 10;
      } else {
        // Omitir a sétima em um acorde que a exige
        score -= 5;
        omissions.push(chordIntervals.find(i => i.startsWith("7")) || "7");
      }
    }

    // 4. Quinta Presente / Omitida
    const hasFifth = chordIntervals.some(i => i.startsWith("5"));
    if (hasFifth) {
      const fifthPC = formulaPitchClasses[chordIntervals.findIndex(i => i.startsWith("5"))];
      if (uniquePitchClasses.includes(fifthPC)) {
        // Quinta presente não altera positivamente, mas...
      } else {
        score -= 1; // Quinta omitida tem penalidade baixíssima (muito comum)
        omissions.push("5");
      }
    }

    // 5. Baixo = Tônica
    const bassIsRoot = bassNote === chordRoot;
    if (bassIsRoot) {
      score += 15;
    } else {
      // Inversão aceitável, mas pontua menos se o baixo não for a tônica
      // Se o baixo estiver na fórmula, é uma inversão real (ex: C/E)
      const bassPC = getPitchClass(bassNote);
      if (formulaPitchClasses.includes(bassPC)) {
        score += 5; // Inversão legítima
      } else {
        score -= 10; // Baixo estranho (nota estranha no baixo)
      }
    }

    // 6. Notas selecionadas que NÃO pertencem à fórmula (Notas Órfãs)
    let orphanNotesCount = 0;
    uniquePitchClasses.forEach(pc => {
      if (!formulaPitchClasses.includes(pc)) {
        orphanNotesCount++;
        score -= 10; // Penalidade severa por nota estranha
        // Identificar se a nota estranha é uma extensão óbvia (ex: 9ª, 11ª)
        const noteName = uniqueNoteNames[uniquePitchClasses.indexOf(pc)];
        additions.push(noteName);
      }
    });

    // Ignorar acordes com pontuação excessivamente baixa (ruído harmônico)
    if (score < 5) return;

    // Calcular o flag de incompleto
    const isIncomplete = omissions.includes("3") || (omissions.includes("1") && uniquePitchClasses.length < 3);

    // Ajustar nome do acorde se houver omissões importantes como "no5"
    let finalChordName = chord.name || chordSymbol;
    // Traduzir termos do Tonal.js se necessário
    if (finalChordName.includes("major seventh")) finalChordName = finalChordName.replace("major seventh", "maj7");
    if (finalChordName.includes("minor seventh")) finalChordName = finalChordName.replace("minor seventh", "m7");
    if (finalChordName.includes("dominant seventh")) finalChordName = finalChordName.replace("dominant seventh", "7");

    // Adicionar sufixo no5 se a quinta foi omitida em acordes comuns (tríades/tétrades)
    if (omissions.includes("5") && !omissions.includes("3") && !omissions.includes("1") && hasFifth && chordIntervals.length >= 3) {
      // Evitar colocar no5 em power chords (que são apenas a tônica e a quinta)
      if (chord.type !== "5") {
        finalChordName = `${chordRoot}${chord.type === "major" ? "" : chord.type}7`.replace("major", "").replace("77", "7") + "(no5)";
      }
    }

    // Adicionar baixo se for invertido
    if (!bassIsRoot && formulaNotes.includes(bassNote) && bassNote) {
      // Simplifica nome do acorde principal
      let baseSymbol = chordSymbol;
      if (omissions.includes("5") && baseSymbol.includes("7")) baseSymbol += "(no5)";
      finalChordName = `${baseSymbol}/${bassNote}`;
    }

    candidates.push({
      name: correctChordSpelling(finalChordName, chordRoot),
      root: chordRoot,
      quality: chord.type || "unknown",
      intervals: chordIntervals.map(i => getFriendlyInterval(i)),
      score: score,
      confidence: 0, // Calculado posteriormente na normalização
      omissions: omissions,
      additions: additions,
      bass: bassIsRoot ? undefined : bassNote,
      isIncomplete: isIncomplete
    });
  });

  // 3. Normalizar e ordenar candidatos
  if (candidates.length === 0) return [];

  // Ordenar por score absoluto descendo
  candidates.sort((a, b) => b.score - a.score);

  const bestScore = candidates[0].score;
  
  // Normaliza o melhor em 95-98% de confiança, e os outros proporcionalmente
  const maxConfidence = 96;
  const mappedCandidates = candidates.map(c => {
    let conf = Math.round((c.score / bestScore) * maxConfidence);
    // Garantir que fique entre 5% e 98%
    conf = Math.max(5, Math.min(98, conf));
    return {
      ...c,
      confidence: conf
    };
  });

  // Remover duplicatas de nomes de acordes
  const seenNames = new Set<string>();
  return mappedCandidates.filter(c => {
    if (seenNames.has(c.name)) return false;
    seenNames.add(c.name);
    return true;
  }).slice(0, 8); // Retornar top 8 candidatos mais prováveis
}

/**
 * Retorna uma lista de escalas compatíveis com um acorde e a categoria
 */
export function getCompatibleScales(chord: ChordCandidate): ScaleInfo[] {
  const root = chord.root;
  const quality = chord.quality.toLowerCase();
  
  const compatibleTypes: string[] = [];
  
  // Mapeamento simples de acordes para escalas compatíveis
  if (quality.includes("major7") || quality.includes("maj7") || quality === "major" || quality === "") {
    compatibleTypes.push("major", "lydian", "pentatonic", "bebop major");
  } else if (quality.includes("minor7") || quality.includes("m7") || quality === "minor" || quality === "m") {
    compatibleTypes.push("dorian", "aeolian", "phrygian", "minor pentatonic", "blues", "melodic minor");
  } else if (quality === "7" || quality.includes("dominant") || quality.includes("7(no5)")) {
    compatibleTypes.push("mixolydian", "blues", "bebop", "phrygian dominant", "altered", "lydian dominant");
  } else if (quality.includes("m7b5") || quality.includes("half-diminished")) {
    compatibleTypes.push("locrian", "half-whole diminished");
  } else if (quality.includes("dim") || quality.includes("diminished")) {
    compatibleTypes.push("diminished", "locrian");
  } else {
    // Fallback padrão
    compatibleTypes.push("major", "minor pentatonic");
  }

  const results: ScaleInfo[] = [];

  compatibleTypes.forEach(scaleType => {
    const scale = TonalScale.get(`${root} ${scaleType}`);
    if (!scale.empty) {
      results.push({
        name: `${root} ${scale.name || scaleType}`,
        type: scaleType,
        intervals: scale.intervals,
        notes: scale.notes.map(n => simplifyNote(n))
      });
    }
  });

  return results;
}

/**
 * Retorna as notas diatônicas de um campo harmônico baseado em um tom (Key)
 */
export function getDiatonicChords(keyRoot: string, isMajor: boolean = true): { degree: string; chord: string }[] {
  const mode = isMajor ? "major" : "minor";
  const scale = TonalScale.get(`${keyRoot} ${mode}`);
  if (scale.empty) return [];

  const degrees = isMajor 
    ? ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
    : ["i", "ii°", "bIII", "iv", "v", "bVI", "bVII"];
    
  const suffixes = isMajor
    ? ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"]
    : ["m7", "m7b5", "maj7", "m7", "m7", "maj7", "7"];

  return scale.notes.map((note, index) => {
    const simplifiedNote = simplifyNote(note);
    const suffix = suffixes[index] || "";
    return {
      degree: degrees[index] || `${index + 1}`,
      chord: `${simplifiedNote}${suffix}`
    };
  });
}
