import { Note as TonalNote, Interval as TonalInterval } from "tonal";
import { simplifyNote } from "../core/pitch";
import type { ChordQuality } from "../constants/chordRegistry";
import { CHORD_REGISTRY } from "../constants/chordRegistry";

export interface CustomChord {
  empty: boolean;
  root: string;
  quality: ChordQuality;
  notes: string[];
  intervals: string[];
  symbol: string;
  bass?: string;
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

const PARSE_CACHE: Record<string, CustomChord> = {};

export function parseChord(symbol: string): CustomChord {
  if (!symbol) {
    return { empty: true, root: "", quality: "major" as ChordQuality, notes: [], intervals: [], symbol: String(symbol) };
  }
  if (PARSE_CACHE[symbol]) return PARSE_CACHE[symbol];

  const match = symbol.match(/^([A-G][b#]?)(.*)$/);
  if (!match) {
    const res = { empty: true, root: "", quality: "major" as ChordQuality, notes: [], intervals: [], symbol };
    PARSE_CACHE[symbol] = res;
    return res;
  }
  const root = simplifyNote(match[1]).replace(/\d/, "");
  let qualityString = match[2];
  let bass: string | undefined = undefined;

  // Tratar baixo invertido
  if (qualityString.includes("/")) {
    const parts = qualityString.split("/");
    qualityString = parts[0];
    if (parts[1]) {
      bass = simplifyNote(parts[1]).replace(/\d/, "");
    }
  }

  // Remover redundância de omissão para fins de mapeamento de qualidade
  qualityString = qualityString.replace(/\(no5\)/, "");

  // Mapear aliases dinamicamente para as qualidades estritas
  let detectedQuality: ChordQuality | null = null;
  
  // Buscar no registro correspondências exatas
  for (const q in CHORD_REGISTRY) {
    const def = CHORD_REGISTRY[q as ChordQuality];
    if (
      def.notation.international === qualityString ||
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
      "m(maj7)": "minorMajor7th",
      "minorMajor7": "minorMajor7th",
      "minormajor7": "minorMajor7th",
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

  if (bass && !notes.includes(bass)) {
    notes.push(bass);
  }

  const result: CustomChord = {
    empty: false,
    root,
    quality: detectedQuality,
    notes,
    intervals: def.intervals,
    symbol,
    bass
  };

  PARSE_CACHE[symbol] = result;
  return result;
}
