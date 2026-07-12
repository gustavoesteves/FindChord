import { describe, expect, it } from "vitest";
import { analyzeChords } from "../src/utils/music/analysis/chordAnalyzer";
import { getPitchClass } from "../src/utils/music/core/pitch";
import type { FretPosition } from "../src/utils/music/models/FretPosition";

function positions(notes: string[]): FretPosition[] {
  return notes.map((noteName, index) => ({
    stringIndex: index,
    fret: index + 1,
    noteName,
    pitchClass: getPitchClass(noteName),
    octave: index === 0 ? 2 : 3
  }));
}

describe("regressao de nomenclatura de cifras", () => {
  it("nao nomeia duas colecoes distintas como o mesmo Amaj13", () => {
    const withEleventh = analyzeChords(positions(["A", "D", "C#", "G#"]));
    const withThirteenth = analyzeChords(positions(["A", "F#", "C#", "G#"]));

    expect(withEleventh[0]?.notationInternational).toBe("Amaj7(add11)");
    expect(withThirteenth[0]?.notationInternational).toBe("Amaj13");
  });
});
