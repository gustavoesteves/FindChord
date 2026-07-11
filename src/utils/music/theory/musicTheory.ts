import { Note as TonalNote, Scale as TonalScale } from "tonal";
import { simplifyNote } from "../core/pitch";
import type { ChordQuality } from "../constants/chordRegistry";
import type { ChordCandidate } from "../models/ChordCandidate";

export interface ScaleInfo {
  name: string;
  type: string;
  intervals: string[];
  notes: string[];
}

const CUSTOM_SCALE_TYPES: Record<string, { intervals: string[]; label: string }> = {
  "bebop dominant": {
    label: "bebop dominant",
    intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7m", "7M"]
  }
};

/**
 * Ordem pedagógica das escalas para cada qualidade explícita da DSL.
 *
 * Isto ainda é um adaptador sem contexto tonal: a primeira opção é a leitura
 * mais estável do acorde isolado e as seguintes são cores possíveis. A
 * escolha contextual (função, melodia e resolução) pertence ao Harmonizar.
 */
const COMPATIBLE_SCALE_TYPES: Partial<Record<ChordQuality, string[]>> = {
  major: ["major", "lydian", "major pentatonic", "bebop major"],
  major6th: ["major", "lydian", "major pentatonic"],
  major7th: ["major", "lydian", "major pentatonic", "bebop major"],
  major9th: ["major", "lydian", "major pentatonic"],
  major13th: ["major", "lydian", "major pentatonic"],
  "major7#11": ["lydian", "major", "lydian dominant"],
  add9: ["major", "major pentatonic"],
  "69": ["major", "major pentatonic", "lydian"],

  minor: ["dorian", "aeolian", "minor pentatonic"],
  minor6th: ["dorian", "melodic minor", "minor pentatonic"],
  minor7th: ["dorian", "aeolian", "minor pentatonic", "phrygian"],
  minor9th: ["dorian", "aeolian", "minor pentatonic"],
  minor11th: ["dorian", "aeolian", "minor pentatonic"],
  minor13th: ["dorian", "aeolian", "minor pentatonic"],
  minorAdd9: ["dorian", "aeolian", "minor pentatonic"],
  minorMajor7th: ["melodic minor", "harmonic minor"],

  dominant7th: ["mixolydian", "bebop dominant", "lydian dominant", "altered"],
  dominant9th: ["mixolydian", "bebop dominant", "lydian dominant", "altered"],
  dominant11th: ["mixolydian", "bebop dominant", "lydian dominant", "altered"],
  dominant13th: ["mixolydian", "bebop dominant", "lydian dominant", "altered"],
  dominant7sus4: ["mixolydian", "lydian dominant"],
  dominant7b5: ["altered", "lydian dominant", "half-whole diminished"],
  dominant7b9: ["phrygian dominant", "altered", "half-whole diminished"],
  "dominant7#9": ["altered", "half-whole diminished", "mixolydian"],
  "dominant7#11": ["lydian dominant", "altered", "mixolydian"],
  dominant7b13: ["phrygian dominant", "altered", "half-whole diminished"],

  halfDiminished: ["locrian #2", "locrian"],
  diminished: ["half-whole diminished"],
  diminished7th: ["whole-half diminished"],
  augmented: ["whole tone"],

  sus4: ["mixolydian", "major pentatonic"],
  sus2: ["major pentatonic", "dorian"],
  power: ["major pentatonic", "minor pentatonic"]
};

export function getCompatibleScaleTypes(quality: ChordQuality): string[] {
  return COMPATIBLE_SCALE_TYPES[quality] ?? ["major", "minor pentatonic"];
}

function scaleInfoFor(root: string, scaleType: string): ScaleInfo | null {
  const customScale = CUSTOM_SCALE_TYPES[scaleType];
  if (customScale) {
    return {
      name: `${root} ${customScale.label}`,
      type: scaleType,
      intervals: customScale.intervals,
      notes: customScale.intervals.map(interval => simplifyNote(TonalNote.transpose(root, interval)))
    };
  }

  const scale = TonalScale.get(`${root} ${scaleType}`);
  if (scale.empty) return null;

  const rawName = scale.name || scaleType;
  const startsWithRoot = rawName.toLowerCase().startsWith(`${root.toLowerCase()} `) || rawName.toLowerCase() === root.toLowerCase();
  const displayName = startsWithRoot ? rawName : `${root} ${rawName}`;

  return {
    name: displayName,
    type: scaleType,
    intervals: scale.intervals,
    notes: scale.notes.map(n => simplifyNote(n))
  };
}

export function getCompatibleScalesForQuality(root: string, quality: ChordQuality): ScaleInfo[] {
  return getCompatibleScaleTypes(quality)
    .map(scaleType => scaleInfoFor(root, scaleType))
    .filter((scale): scale is ScaleInfo => scale !== null);
}

// Escalas compatíveis com base em qualidade DSL proprietária.
export function getCompatibleScales(chord: ChordCandidate): ScaleInfo[] {
  return getCompatibleScalesForQuality(chord.root, chord.quality);
}
