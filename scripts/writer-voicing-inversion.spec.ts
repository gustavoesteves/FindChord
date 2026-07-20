import { describe, expect, it } from "vitest";
import { getNoteAt } from "../src/utils/music/core/notes";
import { getPitchClass } from "../src/utils/music/core/pitch";
import { noteToMidi } from "../src/utils/music/core/midi";
import { clearVoicingCache, generateVoicings } from "../src/utils/music/generation/voicingGenerator";
import type { VoicingShape } from "../src/utils/music/models/VoicingShape";

const standardTuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

function physicalBassPC(shape: VoicingShape): number {
  let minMidi = Infinity;
  let bassPC = -1;

  shape.frets.forEach((fret, stringIndex) => {
    if (fret === null) return;
    const noteName = getNoteAt(standardTuning[stringIndex], fret);
    const midi = noteToMidi(noteName);
    if (midi < minMidi) {
      minMidi = midi;
      bassPC = getPitchClass(noteName);
    }
  });

  return bassPC;
}

describe("writer voicing inversion search", () => {
  it("preserves the requested physical bass for alternate voicings", () => {
    clearVoicingCache();

    const cMajorPCs = ["C", "E", "G"].map(getPitchClass);
    const eBass = getPitchClass("E");

    const results = generateVoicings(
      "C/E",
      "C",
      cMajorPCs,
      standardTuning,
      "major",
      eBass,
      cMajorPCs
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(shape => physicalBassPC(shape) === eBass)).toBe(true);
  });

  it("does not reuse a root-agnostic cache entry for an inversion-specific search", () => {
    clearVoicingCache();

    const cMajorPCs = ["C", "E", "G"].map(getPitchClass);
    const eBass = getPitchClass("E");

    generateVoicings("C", "C", cMajorPCs, standardTuning, "major", null, cMajorPCs);

    const inversionResults = generateVoicings(
      "C",
      "C",
      cMajorPCs,
      standardTuning,
      "major",
      eBass,
      cMajorPCs
    );

    expect(inversionResults.length).toBeGreaterThan(0);
    expect(inversionResults.every(shape => physicalBassPC(shape) === eBass)).toBe(true);
  });
});
