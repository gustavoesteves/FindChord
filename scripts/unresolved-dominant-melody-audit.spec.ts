import { describe, expect, it } from "vitest";
import type { ScoreHarmonyEvent, ScoreNoteEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { collectUnresolvedDominantMelodyCasesFromScore } from "./audit-unresolved-dominant-melody";

function harmony(harmonySymbol: string, index: number): ScoreHarmonyEvent {
  return {
    measure: index + 1,
    beat: 1,
    harmony: harmonySymbol,
    tickStart: index * 480,
    tickEnd: (index + 1) * 480,
    durationTicks: 480
  };
}

function note(step: string, alter: number, index: number): ScoreNoteEvent {
  return {
    id: `n_${index}_${step}`,
    step,
    alter,
    octave: 4,
    voice: 1,
    staff: 1,
    measure: index + 1,
    tickStart: index * 480,
    tickEnd: (index + 1) * 480,
    durationTicks: 480
  };
}

function collect(chords: string[], notes: ScoreNoteEvent[]) {
  return collectUnresolvedDominantMelodyCasesFromScore(chords.map(harmony), notes, {
    file: "fixture.musicxml",
    title: "Fixture"
  });
}

describe("Unresolved dominant melody audit", () => {
  it("detects melody support for the unresolved dominant itself", () => {
    const cases = collect(["Cmaj7", "G7alt", "Bmaj7"], [
      note("B", 0, 1),
      note("F", 0, 1)
    ]);

    expect(cases[0]).toMatchObject({
      chord: "G7alt",
      reviewClass: "melody-supports-dominant",
      dominantCoverage: 1
    });
  });

  it("detects melody support for the side arrival", () => {
    const cases = collect(["Cmaj7", "G7alt", "Bmaj7"], [
      note("D", 1, 1),
      note("F", 1, 1)
    ]);

    expect(cases[0]).toMatchObject({
      reviewClass: "melody-supports-side-arrival",
      sideArrivalRoot: "B",
      sideArrivalRelation: "target-lower-chromatic-neighbor",
      sideArrivalCoverage: 1,
      targetRootCoverage: 0
    });
  });

  it("labels plagal side arrival relative to the expected target", () => {
    const cases = collect(["Cmaj7", "G7alt", "Fmaj7"], [
      note("A", 0, 1),
      note("C", 0, 1)
    ]);

    expect(cases[0]).toMatchObject({
      sideArrivalRoot: "F",
      sideArrivalRelation: "target-plagal-region"
    });
  });

  it("keeps weak melodic evidence separated from supported lateral motion", () => {
    const cases = collect(["Cmaj7", "G7alt", "Bmaj7"], [
      note("A", 0, 1)
    ]);

    expect(cases[0]).toMatchObject({
      reviewClass: "melody-weak-evidence"
    });
  });
});
