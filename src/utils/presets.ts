import { CageShape } from "./voicingGenerator";

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
    cageShape: CageShape.A,
    description: "Acorde maior básico em formato A (Tônica na 5ª corda)"
  },
  {
    chordName: "C7",
    frets: [null, 3, 2, 3, 1, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Sétima dominante aberta"
  },
  {
    chordName: "Cmaj7",
    frets: [null, 3, 2, 0, 0, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Sétima maior aberta límpida"
  },
  {
    chordName: "A",
    frets: [null, 0, 2, 2, 2, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Acorde maior aberto de Lá"
  },
  {
    chordName: "Am",
    frets: [null, 0, 2, 2, 1, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Acorde menor aberto clássico"
  },
  {
    chordName: "Am7",
    frets: [null, 0, 2, 0, 1, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Lá menor com sétima aberto"
  },
  {
    chordName: "A7",
    frets: [null, 0, 2, 0, 2, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Lá dominante com sétima"
  },
  {
    chordName: "Amaj7",
    frets: [null, 0, 2, 1, 2, 0],
    category: "open",
    cageShape: CageShape.A,
    description: "Lá com sétima maior"
  },
  {
    chordName: "G",
    frets: [3, 2, 0, 0, 0, 3],
    category: "open",
    cageShape: CageShape.G,
    description: "Sol maior aberto tradicional"
  },
  {
    chordName: "G7",
    frets: [3, 2, 0, 0, 0, 1],
    category: "open",
    cageShape: CageShape.G,
    description: "Sol dominante aberto"
  },
  {
    chordName: "E",
    frets: [0, 2, 2, 1, 0, 0],
    category: "open",
    cageShape: CageShape.E,
    description: "Mi maior aberto - a forma mais ressonante"
  },
  {
    chordName: "Em",
    frets: [0, 2, 2, 0, 0, 0],
    category: "open",
    cageShape: CageShape.E,
    description: "Mi menor aberto clássico"
  },
  {
    chordName: "Em7",
    frets: [0, 2, 2, 0, 3, 0],
    category: "open",
    cageShape: CageShape.E,
    description: "Mi menor com sétima aberto"
  },
  {
    chordName: "E7",
    frets: [0, 2, 0, 1, 0, 0],
    category: "open",
    cageShape: CageShape.E,
    description: "Mi dominante com sétima"
  },
  {
    chordName: "Emaj7",
    frets: [0, 2, 1, 1, 0, 0],
    category: "open",
    cageShape: CageShape.E,
    description: "Mi maior com sétima maior"
  },
  {
    chordName: "D",
    frets: [null, null, 0, 2, 3, 2],
    category: "open",
    cageShape: CageShape.D,
    description: "Ré maior aberto clássico"
  },
  {
    chordName: "Dm",
    frets: [null, null, 0, 2, 3, 1],
    category: "open",
    cageShape: CageShape.D,
    description: "Ré menor aberto"
  },
  {
    chordName: "Dm7",
    frets: [null, null, 0, 2, 1, 1],
    category: "open",
    cageShape: CageShape.D,
    description: "Ré menor com sétima aberto"
  },
  {
    chordName: "D7",
    frets: [null, null, 0, 2, 1, 2],
    category: "open",
    cageShape: CageShape.D,
    description: "Ré dominante aberto"
  },
  {
    chordName: "Dmaj7",
    frets: [null, null, 0, 2, 2, 2],
    category: "open",
    cageShape: CageShape.D,
    description: "Ré com sétima maior aberto"
  },
  
  // --- JAZZ SHELLS (3 NOTAS - ESSENCIAIS) ---
  {
    chordName: "Cmaj7",
    frets: [8, null, 9, 9, null, null],
    category: "shell",
    cageShape: CageShape.E,
    description: "Shell voicing clássico de jazz, tônica na 6ª corda"
  },
  {
    chordName: "C7",
    frets: [8, null, 8, 9, null, null],
    category: "shell",
    cageShape: CageShape.E,
    description: "Shell dominante na 6ª corda"
  },
  {
    chordName: "Cm7",
    frets: [8, null, 8, 8, null, null],
    category: "shell",
    cageShape: CageShape.E,
    description: "Shell menor de jazz na 6ª corda"
  },
  {
    chordName: "Cmaj7",
    frets: [null, 3, null, 4, 5, null],
    category: "shell",
    cageShape: CageShape.A,
    description: "Shell voicing clássico, tônica na 5ª corda"
  },
  {
    chordName: "C7",
    frets: [null, 3, null, 2, 5, null],
    category: "shell",
    cageShape: CageShape.A,
    description: "Shell dominante na 5ª corda"
  },
  {
    chordName: "Cm7",
    frets: [null, 3, null, 1, 4, null],
    category: "shell",
    cageShape: CageShape.A,
    description: "Shell menor de jazz na 5ª corda"
  },

  // --- DROP 2 (TÔNICA NA 5ª E 6ª CORDA) ---
  {
    chordName: "Cmaj7",
    frets: [null, 3, 5, 4, 5, null],
    category: "drop2",
    cageShape: CageShape.A,
    description: "Drop 2 básico na 5ª corda"
  },
  {
    chordName: "Cm7",
    frets: [null, 3, 5, 3, 4, null],
    category: "drop2",
    cageShape: CageShape.A,
    description: "Drop 2 menor na 5ª corda"
  },
  {
    chordName: "C7",
    frets: [null, 3, 5, 3, 5, null],
    category: "drop2",
    cageShape: CageShape.A,
    description: "Drop 2 dominante na 5ª corda"
  },
  {
    chordName: "Cmaj7",
    frets: [8, null, 9, 9, 8, null],
    category: "drop2",
    cageShape: CageShape.E,
    description: "Drop 2 na 6ª corda"
  },
  {
    chordName: "Cm7",
    frets: [8, null, 8, 8, 8, null],
    category: "drop2",
    cageShape: CageShape.E,
    description: "Drop 2 menor na 6ª corda"
  },
  {
    chordName: "C7",
    frets: [8, null, 8, 9, 8, null],
    category: "drop2",
    cageShape: CageShape.E,
    description: "Drop 2 dominante na 6ª corda"
  },

  // --- DROP 3 (TÔNICA NA 6ª E 5ª CORDA) ---
  {
    chordName: "Cmaj7",
    frets: [8, null, 9, 9, 8, null],
    category: "drop3",
    cageShape: CageShape.E,
    description: "Drop 3 na 6ª corda"
  },
  {
    chordName: "Cm7",
    frets: [8, null, 8, 8, 8, null],
    category: "drop3",
    cageShape: CageShape.E,
    description: "Drop 3 menor na 6ª corda"
  },
  {
    chordName: "C7",
    frets: [8, null, 8, 9, 8, null],
    category: "drop3",
    cageShape: CageShape.E,
    description: "Drop 3 dominante na 6ª corda"
  }
];

/**
 * Filtra e retorna presets correspondentes a um acorde.
 * Adapta a tônica de forma inteligente transpondo os formatos conhecidos!
 */
export function getPresetVoicingsForChord(chordName: string): PresetVoicing[] {
  // Parsing simples para separar tônica de qualidade
  const match = chordName.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return [];
  
  const root = match[1];
  let quality = match[2];
  
  // Limpar qualificadores complexos ou slash chords para fazer correspondência com os presets principais
  if (quality.includes("/")) {
    quality = quality.split("/")[0];
  }
  
  // Caso contenha (no5) removemos temporariamente para correspondência de forma
  const cleanQuality = quality.replace("(no5)", "");

  // Notas clássicas de C e do acorde atual
  const pitchClasses: Record<string, number> = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
  };
  
  const currentRootPC = pitchClasses[root] ?? 0;
  
  // Encontrar os presets catalogados para esse padrão ou em C
  return PRESET_VOICINGS.filter(v => {
    // Tenta encontrar correspondência exata de qualidade
    const vMatch = v.chordName.match(/^([A-G][b#]?)(.*)$/);
    if (!vMatch) return false;
    const vQuality = vMatch[2].replace("(no5)", "");
    return vQuality === cleanQuality;
  }).map(v => {
    const vMatch = v.chordName.match(/^([A-G][b#]?)(.*)$/);
    const vRoot = vMatch ? vMatch[1] : "C";
    const vRootPC = pitchClasses[vRoot] ?? 0;
    
    // Calcular a distância de transposição em semitons
    let shift = currentRootPC - vRootPC;
    if (shift < 0) shift += 12;
    
    // Transpor os trastes fisicamente
    const transposedFrets = v.frets.map(f => {
      if (f === null) return null;
      const newFret = f + shift;
      // Garante que não passa de 24 e não fica menor que 0
      if (newFret > 24) return newFret - 12; // Transpõe uma oitava abaixo se passar de 24
      return newFret;
    });

    return {
      chordName: chordName,
      frets: transposedFrets,
      category: v.category,
      cageShape: v.cageShape,
      description: `${v.description || ""} (Transposto para ${root})`
    };
  }).filter(v => {
    // Remove voicings transpostos com trastes impossíveis (< 0)
    return v.frets.every(f => f === null || f >= 0);
  });
}
