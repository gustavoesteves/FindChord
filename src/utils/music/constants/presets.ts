import type { CageShape } from "../models/VoicingShape";

export interface PresetVoicing {
  chordName: string;
  frets: (number | null)[]; // 6 cordas: index 0 (6ª corda) a index 5 (1ª corda)
  category: "open" | "caged" | "drop2" | "drop3" | "shell";
  cageShape?: CageShape;
  description?: string;
}

export const PRESET_VOICINGS: PresetVoicing[] = [
  // --- ACORDES ABERTOS (OPEN CHORDS) ---
  {
    chordName: "C",
    frets: [null, 3, 2, 0, 1, 0],
    category: "open",
    cageShape: "A",
    description: "Acorde maior básico em formato A (Tônica na 5ª corda)"
  },
  {
    chordName: "C7",
    frets: [null, 3, 2, 3, 1, 0],
    category: "open",
    cageShape: "A",
    description: "Sétima dominante aberta"
  },
  {
    chordName: "Cmaj7",
    frets: [null, 3, 2, 0, 0, 0],
    category: "open",
    cageShape: "A",
    description: "Sétima maior aberta límpida"
  },
  {
    chordName: "A",
    frets: [null, 0, 2, 2, 2, 0],
    category: "open",
    cageShape: "A",
    description: "Acorde maior aberto de Lá"
  },
  {
    chordName: "Am",
    frets: [null, 0, 2, 2, 1, 0],
    category: "open",
    cageShape: "A",
    description: "Acorde menor aberto clássico"
  },
  {
    chordName: "Am7",
    frets: [null, 0, 2, 0, 1, 0],
    category: "open",
    cageShape: "A",
    description: "Lá menor com sétima aberto"
  },
  {
    chordName: "A7",
    frets: [null, 0, 2, 0, 2, 0],
    category: "open",
    cageShape: "A",
    description: "Lá dominante com sétima"
  },
  {
    chordName: "Amaj7",
    frets: [null, 0, 2, 1, 2, 0],
    category: "open",
    cageShape: "A",
    description: "Lá com sétima maior"
  },
  {
    chordName: "G",
    frets: [3, 2, 0, 0, 0, 3],
    category: "open",
    cageShape: "G",
    description: "Sol maior aberto tradicional"
  },
  {
    chordName: "G7",
    frets: [3, 2, 0, 0, 0, 1],
    category: "open",
    cageShape: "G",
    description: "Sol dominante aberto"
  },
  {
    chordName: "E",
    frets: [0, 2, 2, 1, 0, 0],
    category: "open",
    cageShape: "E",
    description: "Mi maior aberto - a forma mais ressonante"
  },
  {
    chordName: "Em",
    frets: [0, 2, 2, 0, 0, 0],
    category: "open",
    cageShape: "E",
    description: "Mi menor aberto clássico"
  },
  {
    chordName: "Em7",
    frets: [0, 2, 2, 0, 3, 0],
    category: "open",
    cageShape: "E",
    description: "Mi menor com sétima aberto"
  },
  {
    chordName: "E7",
    frets: [0, 2, 0, 1, 0, 0],
    category: "open",
    cageShape: "E",
    description: "Mi dominante com sétima"
  },
  {
    chordName: "Emaj7",
    frets: [0, 2, 1, 1, 0, 0],
    category: "open",
    cageShape: "E",
    description: "Mi maior com sétima maior"
  },
  {
    chordName: "D",
    frets: [null, null, 0, 2, 3, 2],
    category: "open",
    cageShape: "D",
    description: "Ré maior aberto clássico"
  },
  {
    chordName: "Dm",
    frets: [null, null, 0, 2, 3, 1],
    category: "open",
    cageShape: "D",
    description: "Ré menor aberto"
  },
  {
    chordName: "Dm7",
    frets: [null, null, 0, 2, 1, 1],
    category: "open",
    cageShape: "D",
    description: "Ré menor com sétima aberto"
  },
  {
    chordName: "D7",
    frets: [null, null, 0, 2, 1, 2],
    category: "open",
    cageShape: "D",
    description: "Ré dominante aberto"
  },
  {
    chordName: "Dmaj7",
    frets: [null, null, 0, 2, 2, 2],
    category: "open",
    cageShape: "D",
    description: "Ré com sétima maior aberto"
  },
  
  // --- JAZZ SHELLS (3 NOTAS - ESSENCIAIS) ---
  {
    chordName: "Cmaj7",
    frets: [8, null, 9, 9, null, null],
    category: "shell",
    cageShape: "E",
    description: "Shell voicing clássico de jazz, tônica na 6ª corda"
  },
  {
    chordName: "C7",
    frets: [8, null, 8, 9, null, null],
    category: "shell",
    cageShape: "E",
    description: "Shell dominante na 6ª corda"
  },
  {
    chordName: "Cm7",
    frets: [8, null, 8, 8, null, null],
    category: "shell",
    cageShape: "E",
    description: "Shell menor de jazz na 6ª corda"
  },
  {
    chordName: "Cmaj7",
    frets: [null, 3, null, 4, 5, null],
    category: "shell",
    cageShape: "A",
    description: "Shell voicing clássico, tônica na 5ª corda"
  },
  {
    chordName: "C7",
    frets: [null, 3, null, 2, 5, null],
    category: "shell",
    cageShape: "A",
    description: "Shell dominante na 5ª corda"
  },
  {
    chordName: "Cm7",
    frets: [null, 3, null, 1, 4, null],
    category: "shell",
    cageShape: "A",
    description: "Shell menor de jazz na 5ª corda"
  },

  // --- DROP 2 (TÔNICA NA 5ª E 6ª CORDA) ---
  {
    chordName: "Cmaj7",
    frets: [null, 3, 5, 4, 5, null],
    category: "drop2",
    cageShape: "A",
    description: "Drop 2 básico na 5ª corda"
  },
  {
    chordName: "Cm7",
    frets: [null, 3, 5, 3, 4, null],
    category: "drop2",
    cageShape: "A",
    description: "Drop 2 menor na 5ª corda"
  },
  {
    chordName: "C7",
    frets: [null, 3, 5, 3, 5, null],
    category: "drop2",
    cageShape: "A",
    description: "Drop 2 dominante na 5ª corda"
  },
  {
    chordName: "Cmaj7",
    frets: [8, null, 9, 9, 8, null],
    category: "drop2",
    cageShape: "E",
    description: "Drop 2 na 6ª corda"
  },
  {
    chordName: "Cm7",
    frets: [8, null, 8, 8, 8, null],
    category: "drop2",
    cageShape: "E",
    description: "Drop 2 menor na 6ª corda"
  },
  {
    chordName: "C7",
    frets: [8, null, 8, 9, 8, null],
    category: "drop2",
    cageShape: "E",
    description: "Drop 2 dominante na 6ª corda"
  },

  // --- DROP 3 (TÔNICA NA 6ª E 5ª CORDA) ---
  {
    chordName: "Cmaj7",
    frets: [8, null, 9, 9, 8, null],
    category: "drop3",
    cageShape: "E",
    description: "Drop 3 na 6ª corda"
  },
  {
    chordName: "Cm7",
    frets: [8, null, 8, 8, 8, null],
    category: "drop3",
    cageShape: "E",
    description: "Drop 3 menor na 6ª corda"
  },
  {
    chordName: "C7",
    frets: [8, null, 8, 9, 8, null],
    category: "drop3",
    cageShape: "E",
    description: "Drop 3 dominante na 6ª corda"
  }
];
