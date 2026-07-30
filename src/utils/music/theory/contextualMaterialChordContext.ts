import { Note } from "tonal";
import type { ChordQuality } from "../constants/chordRegistry";
import { resolveChordSymbol } from "./ChordSymbolResolver";
import { parseChord } from "./chordParser";
import type { MaterialContext, WeightedMelodyNote } from "./contextualMaterialTypes";
import { materialChordIdentityFromResolvedSymbol } from "./materialChordIdentity";

export interface MaterialChordQuality {
  root: string;
  quality: ChordQuality;
}

export function resolveMaterialChordQuality(symbol: string): MaterialChordQuality | null {
  const resolved = resolveChordSymbol(symbol, "plain");
  const identity = materialChordIdentityFromResolvedSymbol(resolved, "score-written");
  if (identity && resolved.confidence !== "ambiguous") {
    return { root: identity.root, quality: identity.quality };
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
