import { Scale as TonalScale } from "tonal";
import { simplifyNote } from "../core/pitch";
import type { ChordCandidate } from "../models/ChordCandidate";

export interface ScaleInfo {
  name: string;
  type: string;
  intervals: string[];
  notes: string[];
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
      const rawName = scale.name || scaleType;
      const startsWithRoot = rawName.toLowerCase().startsWith(`${root.toLowerCase()} `) || rawName.toLowerCase() === root.toLowerCase();
      const displayName = startsWithRoot ? rawName : `${root} ${rawName}`;

      results.push({
        name: displayName,
        type: scaleType,
        intervals: scale.intervals,
        notes: scale.notes.map(n => simplifyNote(n))
      });
    }
  });

  return results;
}
