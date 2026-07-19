import { Note } from "tonal";
import type { ChordQuality } from "../constants/chordRegistry";
import { resolveChordSymbol } from "./ChordSymbolResolver";
import { parseChord } from "./chordParser";
import type { MaterialContext, WeightedMelodyNote } from "./contextualMaterialTypes";

const RESOLVER_TO_DSL_QUALITY: Partial<Record<ReturnType<typeof resolveChordSymbol>["quality"], ChordQuality>> = {
  maj: "major",
  "5": "power",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
  m: "minor",
  maj7: "major7th",
  m7: "minor7th",
  mMaj7: "minorMajor7th",
  m9: "minor9th",
  m11: "minor11th",
  m13: "minor13th",
  "6": "major6th",
  m6: "minor6th",
  "6_9": "69",
  m6_9: "minor6th",
  madd9: "minorAdd9",
  "7": "dominant7th",
  "9": "dominant9th",
  "11": "dominant11th",
  "13": "dominant13th",
  "7sus4": "dominant7sus4",
  "9sus4": "dominant7sus4",
  "13sus4": "dominant7sus4",
  dim: "diminished",
  dim7: "diminished7th",
  aug: "augmented",
  maj_b5: "major7#11",
  m7b5: "halfDiminished",
  "7alt": "dominant7#9",
  "7_sharp5": "augmented",
  "7_b5": "dominant7b5",
  "7_b9": "dominant7b9",
  "7_sharp9": "dominant7#9",
  "7_sharp11": "dominant7#11",
  "7_b13": "dominant7b13",
  "7_sharp9_b13": "dominant7#9",
  "9_b5": "dominant7b5",
  "9_sharp5": "dominant7#9",
  "9_sharp9": "dominant7#9",
  "9_sharp11": "dominant7#11",
  "13_b9": "dominant7b9",
  "13_sharp11": "dominant7#11",
  "13_b9_sharp11": "dominant7b9",
  maj7_sharp11: "major7#11"
};

export interface MaterialChordQuality {
  root: string;
  quality: ChordQuality;
}

export function resolveMaterialChordQuality(symbol: string): MaterialChordQuality | null {
  const resolved = resolveChordSymbol(symbol, "plain");
  const resolvedQuality = resolved.root ? RESOLVER_TO_DSL_QUALITY[resolved.quality] : undefined;
  if (resolved.root && resolved.confidence !== "ambiguous" && resolvedQuality) {
    return { root: resolved.root, quality: resolvedQuality };
  }

  const parsed = parseChord(symbol);
  if (parsed.empty) return null;

  // O parser legado usa maior como fallback. Esse resultado so e aceitavel
  // para uma cifra que seja explicitamente uma triade maior.
  if (resolved.confidence === "ambiguous" && parsed.quality === "major" && !/^[A-G](?:#|b)?$/.test(symbol.trim())) {
    return null;
  }

  return { root: parsed.root, quality: parsed.quality };
}

export function weightedMelodyNotesFromContext(melody: MaterialContext["melody"]): WeightedMelodyNote[] {
  if (!melody) return [];
  return melody
    .map(note => {
      if (typeof note === "string") return { pitch: Note.pitchClass(note), weight: 1 };
      return {
        pitch: Note.pitchClass(note.pitch),
        weight: note.duration ? Math.max(1, note.duration / 480) : 1
      };
    })
    .filter(note => note.pitch);
}
