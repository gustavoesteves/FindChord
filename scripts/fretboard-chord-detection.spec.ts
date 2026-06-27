import { describe, expect, it } from "vitest";
import { analyzeChords } from "../src/utils/music/analysis/chordAnalyzer";
import { getPitchClass } from "../src/utils/music/core/pitch";
import { getNoteAt, getOctave } from "../src/utils/music/core/notes";
import type { FretPosition } from "../src/utils/music/models/FretPosition";

const STANDARD_TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"];

function positionsFor(notes: string[]): FretPosition[] {
  return notes.map((noteName, index) => ({
    stringIndex: index,
    fret: index + 1,
    noteName: `${noteName}3`,
    pitchClass: getPitchClass(noteName),
    octave: 3
  }));
}

function pitchClassSet(notes: string[]): string {
  return [...new Set(notes.map(getPitchClass))].sort((a, b) => a - b).join("-");
}

function findVoicingsFor(notes: string[]): FretPosition[][] {
  const target = pitchClassSet(notes);
  const stringOptions = STANDARD_TUNING.map((baseNote, stringIndex) => (
    Array.from({ length: 13 }, (_, fret) => {
      const noteName = getNoteAt(baseNote, fret);
      return {
        stringIndex,
        fret,
        noteName,
        pitchClass: getPitchClass(noteName),
        octave: getOctave(noteName)
      };
    }).filter(position => notes.map(getPitchClass).includes(position.pitchClass))
  ));

  const voicings: FretPosition[][] = [];
  for (let a = 0; a < stringOptions.length; a++) {
    for (let b = a + 1; b < stringOptions.length; b++) {
      for (let c = b + 1; c < stringOptions.length; c++) {
        for (let d = c + 1; d < stringOptions.length; d++) {
          for (const pa of stringOptions[a]) {
            for (const pb of stringOptions[b]) {
              for (const pc of stringOptions[c]) {
                for (const pd of stringOptions[d]) {
                  const voicing = [pa, pb, pc, pd];
                  if (pitchClassSet(voicing.map(position => position.noteName)) === target) {
                    voicings.push(voicing);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return voicings;
}

describe("Fretboard chord detection", () => {
  it("does not collapse Ab F B Eb and Ab F B E into the same chord label", () => {
    const withEb = analyzeChords(positionsFor(["Ab", "F", "B", "Eb"]));
    const withE = analyzeChords(positionsFor(["Ab", "F", "B", "E"]));

    expect(withEb[0]?.notationInternational).toBeTruthy();
    expect(withE[0]?.notationInternational).toBeTruthy();
    expect(withEb[0]?.notationInternational).not.toBe(withE[0]?.notationInternational);
    expect(withE[0]?.notationInternational).not.toBe("Abm6");
    expect(withE[0]?.notationInternational).not.toContain("no5");
  });

  it("does not label any standard-guitar Ab F B E voicing as Abm6", () => {
    const voicings = findVoicingsFor(["Ab", "F", "B", "E"]);
    const mislabeled = voicings
      .map(voicing => ({
        voicing,
        chord: analyzeChords(voicing)[0]?.notationInternational
      }))
      .filter(result => result.chord === "Abm6");
    const visibleInternalOmissions = voicings
      .map(voicing => analyzeChords(voicing)[0]?.notationInternational || "")
      .filter(chord => chord.includes("no5"));

    expect(voicings.length).toBeGreaterThan(0);
    expect(mislabeled).toHaveLength(0);
    expect(visibleInternalOmissions).toHaveLength(0);
  });
});
