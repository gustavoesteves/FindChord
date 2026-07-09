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
  | "dominant7b5"
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
  // Tensões e alterações cromáticas
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
    international: string;                // ex: "maj7"
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
    notation: { international: "", brazilian: "", academic: "" }
  },
  minor: {
    quality: "minor",
    semitones: [0, 3, 7],
    intervals: ["1P", "3m", "5P"],
    notation: { international: "m", brazilian: "m", academic: "-" }
  },
  diminished: {
    quality: "diminished",
    semitones: [0, 3, 6],
    intervals: ["1P", "3m", "5d"],
    notation: { international: "dim", brazilian: "dim", academic: "o" }
  },
  augmented: {
    quality: "augmented",
    semitones: [0, 4, 8],
    intervals: ["1P", "3M", "5A"],
    notation: { international: "aug", brazilian: "aug", academic: "+" }
  },
  power: {
    quality: "power",
    semitones: [0, 7],
    intervals: ["1P", "5P"],
    notation: { international: "5", brazilian: "5", academic: "5" }
  },
  sus4: {
    quality: "sus4",
    semitones: [0, 5, 7],
    intervals: ["1P", "4P", "5P"],
    notation: { international: "sus4", brazilian: "sus4", academic: "sus4" }
  },
  sus2: {
    quality: "sus2",
    semitones: [0, 2, 7],
    intervals: ["1P", "2M", "5P"],
    notation: { international: "sus2", brazilian: "sus2", academic: "sus2" }
  },
  major6th: {
    quality: "major6th",
    semitones: [0, 4, 7, 9],
    intervals: ["1P", "3M", "5P", "6M"],
    notation: { international: "6", brazilian: "6", academic: "6" }
  },
  minor6th: {
    quality: "minor6th",
    semitones: [0, 3, 7, 9],
    intervals: ["1P", "3m", "5P", "6M"],
    notation: { international: "m6", brazilian: "m6", academic: "-6" }
  },
  dominant7th: {
    quality: "dominant7th",
    semitones: [0, 4, 7, 10],
    intervals: ["1P", "3M", "5P", "7m"],
    notation: { international: "7", brazilian: "7", academic: "7" }
  },
  major7th: {
    quality: "major7th",
    semitones: [0, 4, 7, 11],
    intervals: ["1P", "3M", "5P", "7M"],
    notation: { international: "maj7", brazilian: "7M", academic: "Δ7" }
  },
  minor7th: {
    quality: "minor7th",
    semitones: [0, 3, 7, 10],
    intervals: ["1P", "3m", "5P", "7m"],
    notation: { international: "m7", brazilian: "m7", academic: "-7" }
  },
  minorMajor7th: {
    quality: "minorMajor7th",
    semitones: [0, 3, 7, 11],
    intervals: ["1P", "3m", "5P", "7M"],
    notation: { international: "minorMajor7", brazilian: "m(7M)", academic: "-Δ7" }
  },
  dominant7b5: {
    quality: "dominant7b5",
    semitones: [0, 4, 6, 10],
    intervals: ["1P", "3M", "5d", "7m"],
    notation: { international: "7b5", brazilian: "7(b5)", academic: "7♭5" }
  },
  halfDiminished: {
    quality: "halfDiminished",
    semitones: [0, 3, 6, 10],
    intervals: ["1P", "3m", "5d", "7m"],
    notation: { international: "m7b5", brazilian: "m7(b5)", academic: "ø7" }
  },
  diminished7th: {
    quality: "diminished7th",
    semitones: [0, 3, 6, 9],
    intervals: ["1P", "3m", "5d", "7d"],
    notation: { international: "dim7", brazilian: "dim7", academic: "o7" }
  },
  dominant7sus4: {
    quality: "dominant7sus4",
    semitones: [0, 5, 7, 10],
    intervals: ["1P", "4P", "5P", "7m"],
    notation: { international: "7sus4", brazilian: "7sus4", academic: "7sus4" }
  },
  add9: {
    quality: "add9",
    semitones: [0, 4, 7, 14],
    intervals: ["1P", "3M", "5P", "9M"],
    notation: { international: "add9", brazilian: "(add9)", academic: "add9" }
  },
  minorAdd9: {
    quality: "minorAdd9",
    semitones: [0, 3, 7, 14],
    intervals: ["1P", "3m", "5P", "9M"],
    notation: { international: "madd9", brazilian: "m(add9)", academic: "-add9" }
  },
  69: {
    quality: "69",
    semitones: [0, 4, 7, 9, 14],
    intervals: ["1P", "3M", "5P", "6M", "9M"],
    notation: { international: "6/9", brazilian: "6/9", academic: "6/9" }
  },
  dominant9th: {
    quality: "dominant9th",
    semitones: [0, 4, 7, 10, 14],
    intervals: ["1P", "3M", "5P", "7m", "9M"],
    notation: { international: "9", brazilian: "7(9)", academic: "9" }
  },
  major9th: {
    quality: "major9th",
    semitones: [0, 4, 7, 11, 14],
    intervals: ["1P", "3M", "5P", "7M", "9M"],
    notation: { international: "maj9", brazilian: "7M(9)", academic: "Δ9" }
  },
  minor9th: {
    quality: "minor9th",
    semitones: [0, 3, 7, 10, 14],
    intervals: ["1P", "3m", "5P", "7m", "9M"],
    notation: { international: "m9", brazilian: "m7(9)", academic: "-9" }
  },
  dominant11th: {
    quality: "dominant11th",
    semitones: [0, 4, 7, 10, 14, 17],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P"],
    notation: { international: "11", brazilian: "7(11)", academic: "11" }
  },
  minor11th: {
    quality: "minor11th",
    semitones: [0, 3, 7, 10, 14, 17],
    intervals: ["1P", "3m", "5P", "7m", "9M", "11P"],
    notation: { international: "m11", brazilian: "m7(11)", academic: "-11" }
  },
  dominant13th: {
    quality: "dominant13th",
    semitones: [0, 4, 7, 10, 14, 17, 21],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P", "13M"],
    notation: { international: "13", brazilian: "7(13)", academic: "13" }
  },
  major13th: {
    quality: "major13th",
    semitones: [0, 4, 7, 11, 14, 17, 21],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11P", "13M"],
    notation: { international: "maj13", brazilian: "7M(13)", academic: "Δ13" }
  },
  minor13th: {
    quality: "minor13th",
    semitones: [0, 3, 7, 10, 14, 17, 21],
    intervals: ["1P", "3m", "5P", "7m", "9M", "11P", "13M"],
    notation: { international: "m13", brazilian: "m7(13)", academic: "-13" }
  },
  dominant7b9: {
    quality: "dominant7b9",
    semitones: [0, 4, 7, 10, 13],
    intervals: ["1P", "3M", "5P", "7m", "9m"],
    notation: { international: "7b9", brazilian: "7(b9)", academic: "7b9" }
  },
  "dominant7#9": {
    quality: "dominant7#9",
    semitones: [0, 4, 7, 10, 15],
    intervals: ["1P", "3M", "5P", "7m", "9A"],
    notation: { international: "7#9", brazilian: "7(#9)", academic: "7#9" }
  },
  "dominant7#11": {
    quality: "dominant7#11",
    semitones: [0, 4, 7, 10, 14, 18],
    intervals: ["1P", "3M", "5P", "7m", "9M", "11A"],
    notation: { international: "7#11", brazilian: "7(#11)", academic: "7#11" }
  },
  dominant7b13: {
    quality: "dominant7b13",
    semitones: [0, 4, 7, 10, 14, 20],
    intervals: ["1P", "3M", "5P", "7m", "9M", "13m"],
    notation: { international: "7b13", brazilian: "7(b13)", academic: "7b13" }
  },
  "major7#11": {
    quality: "major7#11",
    semitones: [0, 4, 7, 11, 14, 18],
    intervals: ["1P", "3M", "5P", "7M", "9M", "11A"],
    notation: { international: "maj7#11", brazilian: "7M(#11)", academic: "Δ7#11" }
  }
};
