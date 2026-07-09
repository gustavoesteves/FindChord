import { describe, expect, it } from "vitest";
import type { UnresolvedDominantMelodyCase } from "./audit-unresolved-dominant-melody";
import { analyzeForcedSideArrivalWindow } from "./audit-side-arrival-forced-windows";

const referenceCase: UnresolvedDominantMelodyCase = {
  file: "fixture.musicxml",
  title: "Fixture",
  measure: 4,
  chord: "G7alt",
  expectedTarget: "C",
  sideArrivalRoot: "B",
  sideArrivalRelation: "target-lower-chromatic-neighbor",
  nextChords: ["Bmaj7"],
  melodyPitches: ["D#", "F#"],
  dominantCoverage: 0,
  sideArrivalCoverage: 1,
  targetRootCoverage: 0,
  reviewClass: "melody-supports-side-arrival",
  notes: "fixture"
};

function note(measure: number, pitch: string) {
  return {
    step: pitch[0],
    alter: pitch.includes("#") ? 1 : pitch.includes("b") ? -1 : 0,
    measure,
    durationTicks: 480,
    tickStart: measure * 480,
    tickEnd: measure * 480 + 480
  };
}

describe("Forced side-arrival window audit", () => {
  it("uses a melodic window containing the target measure", () => {
    const row = analyzeForcedSideArrivalWindow(referenceCase, {
      metadata: { keySignature: "C" },
      harmonies: [],
      notes: [
        note(1, "C"),
        note(2, "D"),
        note(3, "E"),
        note(4, "D#"),
        note(4, "F#"),
        note(5, "G")
      ]
    });

    expect(row.windowMeasures.split(" ")).toContain("4");
    expect(row.proposalCount).toBeGreaterThan(0);
  });
});
