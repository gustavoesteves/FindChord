import type { HarmonicFunction } from "./HSMKState";

export interface HarmonicTopology {
  // roleMapping: Maps a CandidateRole in a given HarmonicFunction to an array of valid roman numerals.
  roleMapping: Record<HarmonicFunction, Record<string, string[]>>;
}

export const HarmonicWorld: HarmonicTopology = {
  roleMapping: {
    "T": {
      "PRIMARY": ["I"],
      "SECONDARY": ["vi", "iii"]
    },
    "PD": {
      "PRIMARY": ["IV", "ii"],
      "SECONDARY": ["vi"] // vi can sometimes act as a weak PD substitute
    },
    "D": {
      "PRIMARY": ["V"],
      "APPROACH": ["vii°", "V7/V", "ii°"] // vii° or secondary dominants prepare the next region (T)
    }
  }
};
