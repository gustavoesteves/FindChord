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
    const withoutThird = analyzeChords(positions(["A", "D", "F#", "G#"]));

    expect(withEleventh[0]?.notationInternational).toBe("Amaj7(add11)");
    expect(withThirteenth[0]?.notationInternational).toBe("Amaj13");
    expect(withoutThird[0]?.notationInternational).not.toBe("Amaj13");
    expect(withoutThird[0]?.omissions).not.toContain("3");
  });

  it("nao usa nomes dominantes estendidos sem setima estrutural", () => {
    const sharpNineWithoutFlatSeven = analyzeChords(positions(["A", "C", "C#", "E"]));
    const eleventhWithoutFlatSeven = analyzeChords(positions(["A", "C#", "D", "E"]));

    expect(sharpNineWithoutFlatSeven[0]?.notationInternational).not.toBe("A7#9");
    expect(eleventhWithoutFlatSeven[0]?.notationInternational).not.toBe("A11");
  });

  it("nao usa suspensao quando a nota suspensa nao esta presente", () => {
    const withoutSuspendedFourth = analyzeChords(positions(["A", "E", "G", "G#"]));

    expect(withoutSuspendedFourth[0]?.notationInternational).not.toBe("A7sus4(addmaj7)");
  });
});
