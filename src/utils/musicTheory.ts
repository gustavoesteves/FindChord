import { Note as TonalNote, Scale as TonalScale, Interval as TonalInterval } from "tonal";
import type { FretPosition, ChordCandidate } from "../store/useChordStore";

// Dicionário de equivalências enarmônicas para simplificação visual
const PREFERRED_SPELLINGS: Record<string, string> = {
  "E#": "F",
  "B#": "C",
  "Cb": "B",
  "Fb": "E",
  "Fx": "G",
  "Cx": "D"
};

// Qualidades de Acordes Estritas (DSL Musical)
export type ChordQuality =
  // Tríades Básicas
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "power"
  // Suspensos
  | "sus4"
  | "sus2"
  // Sextas
  | "major6th"
  | "minor6th"
  // Sétimas
  | "dominant7th"
  | "major7th"
  | "minor7th"
  | "minorMajor7th"
  | "halfDiminished"
  | "diminished7th"
  | "dominant7sus4"
  // Nonas (add9, madd9, 69 e estendidos com 7ª)
  | "add9"
  | "minorAdd9"
  | "69"
  | "dominant9th"
  | "major9th"
  | "minor9th"
  // Décimas Primeiras (com 7ª e 9ª)
  | "dominant11th"
  | "minor11th"
  // Décimas Terceiras (com 7ª, 9ª e 11ª)
  | "dominant13th"
  | "major13th"
  | "minor13th"
  // Tensões e Alterações Jazzísticas
  | "dominant7b9"
  | "dominant7#9"
  | "dominant7#11"
  | "dominant7b13"
  | "major7#11";

// Definição de Acorde na DSL
export interface ChordDefinition {
  quality: ChordQuality;
  semitones: number[];           // Semitons em relação à tônica (0)
  intervals: string[];           // Abreviações dos intervalos (ex: ["1P", "3M", "5P"])
  notation: {
    jazz: string;                // ex: "maj7"
    brazilian: string;           // ex: "7M"
    academic: string;            // ex: "Δ7"
  };
}

// Registry Pattern - Fonte Única da Verdade para Fórmulas de Acordes
export const CHORD_REGISTRY: Record<ChordQuality, ChordDefinition> = {
  major: {
    quality: "major",
    semitones: [0, 4, 7],
    intervals: ["1P", "3M", "5P"],
    notation: { jazz: "", brazilian: "", academic: "" }
  },
  minor: {
    quality: "minor",
    semitones: [0, 3, 7],
    intervals: ["1P", "3m", "5P"],
    notation: { jazz: "m", brazilian: "m", academic: "-" }
  },
  diminished: {
    quality: "diminished",
    semitones: [0, 3, 6],
    intervals: ["1P", "3m", "5d"],
    notation: { jazz: "dim", brazilian: "dim", academic: "o" }
  },
  augmented: {
    quality: "augmented",
    semitones: [0, 4, 8],
    intervals: ["1P", "3M", "5A"],
    notation: { jazz: "aug", brazilian: "aug", academic: "+" }
  },
  power: {
    quality: "power",
    semitones: [0, 7],
    intervals: ["1P", "5P"],
    notation: { jazz: "5", brazilian: "5", academic: "5" }
  },
  sus4: {
    quality: "sus4",
    semitones: [0, 5, 7],
    intervals: ["1P", "4P", "5P"],
    notation: { jazz: "sus4", brazilian: "sus4", academic: "sus4" }
  },
  sus2: {
    quality: "sus2",
    semitones: [0, 2, 7],
    intervals: ["1P", "2M", "5P"],
    notation: { jazz: "sus2", brazilian: "sus2", academic: "sus2" }
  },
  major6th: {
    quality: "major6th",
    semitones: [0, 4, 7, 9],
    intervals: ["1P", "3M", "5P", "6M"],
    notation: { jazz: "6", brazilian: "6", academic: "6" }
  },
  minor6th: {
    quality: "minor6th",
    semitones: [0, 3, 7, 9],
    intervals: ["1P", "3m", "5P", "6M"],
    notation: { jazz: "m6", brazilian: "m6", academic: "-6" }
  },
  dominant7th: {
    quality: "dominant7th",
    semitones: [0, 4, 7, 10],
    intervals: ["1P", "3M", "5P", "7m"],
    notation: { jazz: "7", brazilian: "7", academic: "7" }
  },
  major7th: {
    quality: "major7th",
    semitones: [0, 4, 7, 11],
    intervals: ["1P", "3M", "5P", "7M"],
    notation: { jazz: "maj7", brazilian: "7M", academic: "Δ7" }
  },
  minor7th: {
    quality: "minor7th",
    semitones: [0, 3, 7, 10],
    intervals: ["1P", "3m", "5P", "7m"],
    notation: { jazz: "m7", brazilian: "m7", academic: "-7" }
  },
  minorMajor7th: {
    quality: "minorMajor7th",
    semitones: [0, 3, 7, 11],
    intervals: ["1P", "3m", "5P", "7M"],
    notation: { jazz: "minorMajor7", brazilian: "m(7M)", academic: "-Δ7" }
  },
  halfDiminished: {
    quality: "halfDiminished",
    semitones: [0, 3, 6, 10],
    intervals: ["1P", "3m", "5d", "7m"],
    notation: { jazz: "m7b5", brazilian: "m7(b5)", academic: "ø7" }
  },
  diminished7th: {
    quality: "diminished7th",
    semitones: [0, 3, 6, 9],
    intervals: ["1P", "3m", "5d", "7d"],
    notation: { jazz: "dim7", brazilian: "dim7", academic: "o7" }
  },
  dominant7sus4: {
    quality: "dominant7sus4",
    semitones: [0, 5, 7, 10],
    intervals: ["1P", "4P", "5P", "7m"],
    notation: { jazz: "7sus4", brazilian: "7sus4", academic: "7sus4" }
  },
  add9: {
    quality: "add9",
    semitones: [0, 4, 7, 14],
    intervals: ["1P", "3M", "5P", "9M"],
    notation: { jazz: "add9", brazilian: "(add9)", academic: "add9" }
  },
  minorAdd9: {
    quality: "minorAdd9",
    semitones: [0, 3, 7, 14],
    intervals: ["1P", "3m", "5P", "9M"],
    notation: { jazz: "madd9", brazilian: "m(add9)", academic: "-add9" }
  },
  69: {
    quality: "69",
    semitones: [0, 4, 7, 9, 14],
    intervals: ["1P", "3M", "5P", "6M", "9M"],
    notation: { jazz: "6/9", brazilian: "6/9", academic: "6/9" }
  },
  dominant9th: {
    quality: "dominant9th",
    semitones: [0, 4, 7, 10, 14],
    intervals: ["1P", "3M", "5P", "7m", "9M"],
    notation: { jazz: "9", brazilian: "7(9)", academic: "9" }
  },
  major9th: {
    quality: "major9th",
    semitones: [0, 4, 7, 11, 14],
    intervals: ["1P", "3M", "5P", "7M", "9M"],
    notation: { jazz: "maj9", brazilian: "7M(9)", academic: "Δ9" }
  },
  minor9th: {
    quality: "minor9th",
    semitones: [0, 3, 7, 10, 14],
    intervals: ["1P", "3m", "5P", "7m", "9M"],
    notation: { jazz: "m9", brazilian: "m7(9)", academic: "-9" }
  },
  dominant11th: {
    quality: "dominant11th",
    semitones: [0, 4, 7, 10, 14, 17],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P"],
    notation: { jazz: "11", brazilian: "7(11)", academic: "11" }
  },
  minor11th: {
    quality: "minor11th",
    semitones: [0, 3, 7, 10, 14, 17],
    intervals: ["1P", "3m", "5P", "7m", "9M", "11P"],
    notation: { jazz: "m11", brazilian: "m7(11)", academic: "-11" }
  },
  dominant13th: {
    quality: "dominant13th",
    semitones: [0, 4, 7, 10, 14, 17, 21],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P", "13M"],
    notation: { jazz: "13", brazilian: "7(13)", academic: "13" }
  },
  major13th: {
    quality: "major13th",
    semitones: [0, 4, 7, 11, 14, 17, 21],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11P", "13M"],
    notation: { jazz: "maj13", brazilian: "7M(13)", academic: "Δ13" }
  },
  minor13th: {
    quality: "minor13th",
    semitones: [0, 3, 7, 10, 14, 17, 21],
    intervals: ["1P", "3m", "5P", "7m", "9M", "11P", "13M"],
    notation: { jazz: "m13", brazilian: "m7(13)", academic: "-13" }
  },
  dominant7b9: {
    quality: "dominant7b9",
    semitones: [0, 4, 7, 10, 13],
    intervals: ["1P", "3M", "5P", "7m", "9m"],
    notation: { jazz: "7b9", brazilian: "7(b9)", academic: "7b9" }
  },
  "dominant7#9": {
    quality: "dominant7#9",
    semitones: [0, 4, 7, 10, 15],
    intervals: ["1P", "3M", "5P", "7m", "9A"],
    notation: { jazz: "7#9", brazilian: "7(#9)", academic: "7#9" }
  },
  "dominant7#11": {
    quality: "dominant7#11",
    semitones: [0, 4, 7, 10, 14, 18],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11A"],
    notation: { jazz: "7#11", brazilian: "7(#11)", academic: "7#11" }
  },
  dominant7b13: {
    quality: "dominant7b13",
    semitones: [0, 4, 7, 10, 14, 20],
    intervals: ["1P", "3M", "5P", "7m", "9M", "13m"],
    notation: { jazz: "7b13", brazilian: "7(b13)", academic: "7b13" }
  },
  "major7#11": {
    quality: "major7#11",
    semitones: [0, 4, 7, 11, 14, 18],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11A"],
    notation: { jazz: "maj7#11", brazilian: "7M(#11)", academic: "Δ7#11" }
  }
};

export interface ScaleInfo {
  name: string;
  type: string;
  intervals: string[];
  notes: string[];
}

export interface ProgressionTemplate {
  name: string;
  romanNumerals: string[];
  description: string;
  degrees: number[];
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
    degrees: [1, 6, 3, 7]
  },
  {
    name: "ii - bII7 - I (Tritone Sub)",
    romanNumerals: ["ii", "subV", "I"],
    description: "Substituição de trítono clássica do acorde dominante (V) por um bII7.",
    degrees: [2, 2, 1]
  }
];

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

export function getNoteAt(baseNote: string, fret: number): string {
  const transposed = TonalNote.transpose(baseNote, TonalInterval.fromSemitones(fret));
  return simplifyNote(transposed);
}

export function simplifyNote(noteName: string): string {
  const scientific = TonalNote.get(noteName);
  if (scientific.empty) return noteName;
  
  const pitchClass = scientific.pc;
  const octave = scientific.oct !== undefined ? scientific.oct : "";
  
  if (PREFERRED_SPELLINGS[pitchClass]) {
    return PREFERRED_SPELLINGS[pitchClass] + octave;
  }
  
  return TonalNote.simplify(noteName);
}

export function getPitchClass(noteName: string): number {
  const note = TonalNote.get(noteName);
  return note.empty ? -1 : note.chroma ?? -1;
}

export function getOctave(noteName: string): number {
  const note = TonalNote.get(noteName);
  return note.empty ? 4 : note.oct ?? 4;
}

export function getLowestNote(positions: FretPosition[]): FretPosition | null {
  if (positions.length === 0) return null;
  return [...positions].reduce((lowest, current) => {
    const currentFreq = current.octave * 12 + current.pitchClass;
    const lowestFreq = lowest.octave * 12 + lowest.pitchClass;
    return currentFreq < lowestFreq ? current : lowest;
  });
}

// Converte intervalos semitones para abreviações legíveis de UI
export function getFriendlyInterval(interval: string): string {
  const mapping: Record<string, string> = {
    "1P": "Fundamental (1)",
    "1d": "Fundamental (1)",
    "2m": "Segunda menor (b9)",
    "2M": "Segunda Maior (9)",
    "2A": "Segunda Aumentada (#2)",
    "3m": "Terça menor (b3)",
    "3M": "Terça Maior (3)",
    "4P": "Quarta Justa (11)",
    "4A": "Quarta Aumentada (#11)",
    "5d": "Quinta Diminuta (b5)",
    "5P": "Quinta Justa (5)",
    "5A": "Quinta Aumentada (#5)",
    "6m": "Sexta menor (b13)",
    "6M": "Sexta Maior (13)",
    "7d": "Sétima Diminuta (bb7)",
    "7m": "Sétima menor (b7)",
    "7M": "Sétima Maior (7)",
    "8P": "Oitava (8)",
    "9m": "Nona menor (b9)",
    "9M": "Nona Maior (9)",
    "9A": "Nona Aumentada (#9)",
    "11P": "Quarta/11 (11)",
    "11A": "Quarta Aum/#11 (#11)",
    "13m": "Sexta menor/b13 (b13)",
    "13M": "Sexta/13 (13)"
  };
  return mapping[interval] || interval;
}

// Converte semitones do motor para formato de Tonal Interval
export function getIntervalSymbol(semitones: number): string {
  const mapping: Record<number, string> = {
    0: "1P", 1: "2m", 2: "2M", 3: "3m", 4: "3M", 5: "4P", 6: "5d", 7: "5P", 
    8: "6m", 9: "6M", 10: "7m", 11: "7M", 12: "8P", 13: "9m", 14: "9M", 
    15: "9A", 17: "11P", 18: "11A", 20: "13m", 21: "13M"
  };
  return mapping[semitones] || `${semitones} semitones`;
}

export function correctChordSpelling(chordName: string, root: string): string {
  if (PREFERRED_SPELLINGS[root]) {
    const newRoot = PREFERRED_SPELLINGS[root];
    return chordName.replace(root, newRoot);
  }
  return chordName;
}

// Formatador Limpo e Centralizado de Nomenclatura baseada na DSL
export function formatChordName(
  root: string,
  quality: ChordQuality,
  omissions: string[],
  bass?: string,
  style: "Jazz" | "Brazilian" | "Academic" = "Jazz"
): string {
  const def = CHORD_REGISTRY[quality];
  if (!def) return `${root}${quality}`;

  let qualityString = "";
  if (style === "Brazilian") {
    qualityString = def.notation.brazilian;
  } else if (style === "Academic") {
    qualityString = def.notation.academic;
  } else {
    qualityString = def.notation.jazz;
  }

  let finalName = `${root}${qualityString}`;

  // Se houver omissão da Quinta e não for Power Chord
  if (omissions.includes("5") && !omissions.includes("3") && !omissions.includes("1") && quality !== "power") {
    if (!finalName.includes("(no5)")) {
      finalName = `${finalName}(no5)`;
    }
  }

  // Baixo invertido
  if (bass) {
    finalName = `${finalName}/${bass}`;
  }

  return correctChordSpelling(finalName, root);
}

// Parser Proprietário de Cifras
export interface CustomChord {
  empty: boolean;
  root: string;
  quality: ChordQuality;
  notes: string[];
  intervals: string[];
  symbol: string;
}

export function parseChord(symbol: string): CustomChord {
  const match = symbol.match(/^([A-G][b#]?)(.*)$/);
  if (!match) {
    return { empty: true, root: "", quality: "major", notes: [], intervals: [], symbol };
  }
  const root = simplifyNote(match[1]).replace(/\d/, "");
  let qualityString = match[2];

  // Tratar baixo invertido
  if (qualityString.includes("/")) {
    const parts = qualityString.split("/");
    qualityString = parts[0];
  }

  // Remover redundância de omissão para fins de mapeamento de qualidade
  qualityString = qualityString.replace(/\(no5\)/, "");

  // Mapear aliases dinamicamente para as qualidades estritas
  let detectedQuality: ChordQuality | null = null;
  
  // Buscar no registro correspondências exatas
  for (const q in CHORD_REGISTRY) {
    const def = CHORD_REGISTRY[q as ChordQuality];
    if (
      def.notation.jazz === qualityString ||
      def.notation.brazilian === qualityString ||
      def.notation.academic === qualityString ||
      q === qualityString
    ) {
      detectedQuality = q as ChordQuality;
      break;
    }
  }

  // Fallback e apelidos comuns
  if (!detectedQuality) {
    const fallbackMap: Record<string, ChordQuality> = {
      "": "major",
      "major": "major",
      "m": "minor",
      "minor": "minor",
      "7M": "major7th",
      "7+": "major7th",
      "7M(9)": "major9th",
      "7M(#11)": "major7#11",
      "m7(11)": "minor11th",
      "m7(9)": "minor9th",
      "7(9)": "dominant9th",
      "7(11)": "dominant11th",
      "7(13)": "dominant13th",
      "7(b9)": "dominant7b9",
      "7(#9)": "dominant7#9",
      "7(#11)": "dominant7#11",
      "7(b13)": "dominant7b13",
      "m7(b5)": "halfDiminished",
      "m(7M)": "minorMajor7th",
      "M": "major",
      "min": "minor",
      "maj": "major",
      "diminished": "diminished",
      "augmented": "augmented"
    };
    detectedQuality = fallbackMap[qualityString] || "major";
  }

  const def = CHORD_REGISTRY[detectedQuality];
  const notes = def.semitones.map(s => {
    return simplifyNote(TonalNote.transpose(root, TonalInterval.fromSemitones(s))).replace(/\d/, "");
  });

  return {
    empty: false,
    root,
    quality: detectedQuality,
    notes,
    intervals: def.intervals,
    symbol
  };
}

// Motor de Análise Harmônica 100% Proprietário
export function analyzeChords(positions: FretPosition[]): ChordCandidate[] {
  if (positions.length === 0) return [];

  // 1. Obter Pitch Classes e nomes de notas ÚNICAS (removendo duplicações de oitava)
  const uniquePitchClasses = Array.from(new Set(positions.map(p => p.pitchClass)));
  const uniqueNoteNames = Array.from(new Set(positions.map(p => simplifyNote(p.noteName).replace(/\d/, ""))));

  // 2. Localizar Baixo Físico
  const bassFret = getLowestNote(positions);
  const bassNote = bassFret ? simplifyNote(bassFret.noteName).replace(/\d/, "") : "";

  const candidates: ChordCandidate[] = [];

  // 3. Testar CADA Pitch Class ativa como possível tônica
  uniquePitchClasses.forEach(rootPC => {
    // Transpor para o nome da nota da tônica
    const rootFretPosition = positions.find(p => p.pitchClass === rootPC);
    const chordRoot = rootFretPosition ? simplifyNote(rootFretPosition.noteName).replace(/\d/, "") : "";
    if (!chordRoot) return;

    // 4. Testar todas as qualidades oficiais da DSL do CHORD_REGISTRY
    (Object.keys(CHORD_REGISTRY) as ChordQuality[]).forEach(quality => {
      const def = CHORD_REGISTRY[quality];
      
      // Notas absolutas da hipótese teórica
      const formulaPitchClasses = def.semitones.map(s => (rootPC + s) % 12);
      
      let score = 0;
      const omissions: string[] = [];
      const additions: string[] = [];

      // --- ALGORITMO DE SCORING PROFISSIONAL ---

      // A. TÔNICA PRESENT (Peso: +20 ou -25)
      const rootPresent = uniquePitchClasses.includes(rootPC);
      if (rootPresent) {
        score += 20;
      } else {
        score -= 25; // Rootless voicing (Jazz)
        omissions.push("1");
      }

      // B. TERÇA PRESENTE (Peso: +15 ou -15)
      const hasThird = def.semitones.some(s => s % 12 === 3 || s % 12 === 4);
      if (hasThird) {
        const thirdPCIndex = def.semitones.findIndex(s => s % 12 === 3 || s % 12 === 4);
        const thirdPC = formulaPitchClasses[thirdPCIndex];
        if (uniquePitchClasses.includes(thirdPC)) {
          score += 15;
        } else {
          score -= 15; // Perde definição modal
          omissions.push(def.semitones[thirdPCIndex] === 3 ? "b3" : "3");
        }
      }

      // C. SÉTIMA PRESENTE (Peso: +10 ou -5)
      const hasSeventh = def.semitones.some(s => s % 12 === 9 || s % 12 === 10 || s % 12 === 11);
      if (hasSeventh) {
        const seventhPCIndex = def.semitones.findIndex(s => s % 12 === 9 || s % 12 === 10 || s % 12 === 11);
        const seventhPC = formulaPitchClasses[seventhPCIndex];
        if (uniquePitchClasses.includes(seventhPC)) {
          score += 10;
        } else {
          score -= 5;
          const sem = def.semitones[seventhPCIndex];
          omissions.push(sem === 9 ? "6" : sem === 10 ? "b7" : "7");
        }
      }

      // D. QUINTA PRESENTE (Peso: +0 ou -1)
      const hasFifth = def.semitones.some(s => s % 12 === 6 || s % 12 === 7 || s % 12 === 8);
      if (hasFifth) {
        const fifthPCIndex = def.semitones.findIndex(s => s % 12 === 6 || s % 12 === 7 || s % 12 === 8);
        const fifthPC = formulaPitchClasses[fifthPCIndex];
        if (uniquePitchClasses.includes(fifthPC)) {
          // Presente
        } else {
          score -= 1; // Quinta omitida tem penalidade insignificante na guitarra
          const sem = def.semitones[fifthPCIndex];
          omissions.push(sem === 6 ? "b5" : sem === 7 ? "5" : "#5");
        }
      }

      // E. BAIXO (Bass Note) (Peso: +15, +5 ou -10)
      const bassIsRoot = bassNote === chordRoot;
      if (bassIsRoot) {
        score += 15;
      } else {
        const bassPC = getPitchClass(bassNote);
        if (formulaPitchClasses.includes(bassPC)) {
          score += 5; // Inversão legítima (Slash chord)
        } else {
          score -= 10; // Baixo incoerente fora do acorde
        }
      }

      // F. PENALIDADE DE NOTAS ÓRFÃS (Notas completamente fora da fórmula e tensões) (Peso: -10 por nota)
      let orphanCount = 0;
      uniquePitchClasses.forEach(pc => {
        if (!formulaPitchClasses.includes(pc)) {
          orphanCount++;
          score -= 10; // Penalidade estrita
          const noteName = uniqueNoteNames[uniquePitchClasses.indexOf(pc)];
          additions.push(noteName);
        }
      });

      // Ignorar ruídos absolutos
      if (score < 5) return;

      const isIncomplete = omissions.includes("3") || omissions.includes("b3") || (omissions.includes("1") && uniquePitchClasses.length < 3);

      // Calcular o Baixo / Barra se for invertido
      const bassValue = bassIsRoot ? undefined : bassNote;

      candidates.push({
        root: chordRoot,
        quality: quality,
        intervals: def.semitones.map(s => getFriendlyInterval(getIntervalSymbol(s))),
        omissions,
        additions,
        bass: bassValue,
        score,
        confidence: 0, // Definido na normalização
        notationJazz: formatChordName(chordRoot, quality, omissions, bassValue, "Jazz"),
        notationBrazilian: formatChordName(chordRoot, quality, omissions, bassValue, "Brazilian"),
        notationAcademic: formatChordName(chordRoot, quality, omissions, bassValue, "Academic"),
        isIncomplete
      });
    });
  });

  if (candidates.length === 0) return [];

  // Ordenar por score descrescente
  candidates.sort((a, b) => b.score - a.score);

  // Normalização do Confidence Score (UX) separado do Score absoluto
  const bestScore = candidates[0].score;
  const maxConfidence = 96;

  const mappedCandidates = candidates.map(c => {
    let conf = Math.round((c.score / bestScore) * maxConfidence);
    // Acordes com muitas notas órfãs ou sem terça perdem confiança rapidamente
    if (c.isIncomplete) conf = Math.max(5, conf - 15);
    conf = Math.max(5, Math.min(98, conf));
    return {
      ...c,
      confidence: conf
    };
  });

  // Remover duplicatas de nomes na cifragem Jazz ativa
  const seenNames = new Set<string>();
  return mappedCandidates.filter(c => {
    if (seenNames.has(c.notationJazz)) return false;
    seenNames.add(c.notationJazz);
    return true;
  }).slice(0, 8);
}

// Escalas compatíveis com base em qualidade DSL proprietária
export function getCompatibleScales(chord: ChordCandidate): ScaleInfo[] {
  const root = chord.root;
  const quality = chord.quality;
  
  const compatibleTypes: string[] = [];
  
  if (quality === "major" || quality === "major7th" || quality === "major6th" || quality === "major9th" || quality === "major13th") {
    compatibleTypes.push("major", "lydian", "pentatonic", "bebop major");
  } else if (quality === "minor" || quality === "minor7th" || quality === "minor6th" || quality === "minor9th" || quality === "minor11th" || quality === "minor13th") {
    compatibleTypes.push("dorian", "aeolian", "phrygian", "minor pentatonic", "blues", "melodic minor");
  } else if (quality === "dominant7th" || quality === "dominant9th" || quality === "dominant11th" || quality === "dominant13th" || quality === "dominant7sus4") {
    compatibleTypes.push("mixolydian", "blues", "bebop", "phrygian dominant", "altered", "lydian dominant");
  } else if (quality === "halfDiminished") {
    compatibleTypes.push("locrian", "half-whole diminished");
  } else if (quality === "diminished" || quality === "diminished7th") {
    compatibleTypes.push("diminished", "locrian");
  } else {
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
export function getNotesForChord(root: string, type: string): string[] {
  const chordDef = CHORD_REGISTRY[type as ChordQuality];
  if (!chordDef) return [];
  return chordDef.semitones.map(s => {
    return simplifyNote(TonalNote.transpose(root, TonalInterval.fromSemitones(s))).replace(/\d/, "");
  });
}
