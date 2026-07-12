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

const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteName(pitchClass: number): string {
  return CHROMATIC_NOTES[pitchClass];
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

  it("nao gera a mesma cifra principal para tetrades distintas com o mesmo baixo", () => {
    for (let bassPc = 0; bassPc < CHROMATIC_NOTES.length; bassPc++) {
      const seen = new Map<string, string>();

      for (let b = 0; b < CHROMATIC_NOTES.length; b++) {
        for (let c = b + 1; c < CHROMATIC_NOTES.length; c++) {
          for (let d = c + 1; d < CHROMATIC_NOTES.length; d++) {
            const pitchClasses = [bassPc, b, c, d].filter((pc, index, all) => all.indexOf(pc) === index);
            if (pitchClasses.length !== 4) continue;

            const notes = pitchClasses.map(noteName);
            const signature = notes.join(" ");
            const topName = analyzeChords(positions(notes))[0]?.notationInternational;
            if (!topName) continue;

            expect(seen.get(topName), `${topName} duplicou ${seen.get(topName)} e ${signature}`).toBeUndefined();
            seen.set(topName, signature);
          }
        }
      }
    }
  });
});
