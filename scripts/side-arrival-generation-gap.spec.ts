import { describe, expect, it } from "vitest";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { UnresolvedDominantMelodyCase } from "./audit-unresolved-dominant-melody";
import { analyzeSideArrivalGenerationGap } from "./audit-side-arrival-generation-gap";

const referenceCase: UnresolvedDominantMelodyCase = {
  file: "fixture.musicxml",
  title: "Fixture",
  measure: 2,
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

function proposal(id: string, chords: string[]): ReharmonizationProposal {
  return {
    id,
    kind: "controlled-reharmonization",
    name: id,
    measures: chords.map((chord, index) => ({
      measureIndex: index + 1,
      chords: [chord]
    })),
    explanation: [],
    bassLine: chords.map(chord => chord.match(/^[A-G](?:#|b)?/)?.[0] || chord)
  };
}

describe("Side-arrival generation gap audit", () => {
  it("detects when a covered reference side arrival has no generated candidate", () => {
    const row = analyzeSideArrivalGenerationGap(
      referenceCase,
      [proposal("ordinary", ["Cmaj7", "G7", "Cmaj7"])],
      [1, 2, 3]
    );

    expect(row.windowStatus).toBe("covered-by-window");
    expect(row.matchingProposalCount).toBe(0);
    expect(row.diagnosis).toBe("A janela cobre o caso, mas o gerador nao produziu a chegada lateral.");
  });

  it("detects generated side-arrival candidates near the reference measure", () => {
    const row = analyzeSideArrivalGenerationGap(
      referenceCase,
      [proposal("side-arrival", ["Cmaj7", "G7alt", "Bmaj7"])],
      [1, 2, 3]
    );

    expect(row.matchingProposalCount).toBe(1);
    expect(row.matchingExamples[0]).toContain("side-arrival");
  });
});
