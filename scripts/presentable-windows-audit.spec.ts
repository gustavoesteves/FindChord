import { describe, expect, it } from "vitest";
import { collectPresentableWindowsForFile } from "./audit-presentable-windows";
import type { UnresolvedDominantMelodyCase } from "./audit-unresolved-dominant-melody";

const allOfYouCase: UnresolvedDominantMelodyCase = {
  file: "imported-real-book/a-027-All of you.musicxml",
  title: "All of you",
  measure: 16,
  chord: "E7(#9)",
  expectedTarget: "A",
  sideArrivalRoot: "Ab",
  sideArrivalRelation: "target-lower-chromatic-neighbor",
  nextChords: ["Ab"],
  melodyPitches: ["Eb"],
  dominantCoverage: 0,
  sideArrivalCoverage: 1,
  targetRootCoverage: 0,
  reviewClass: "melody-supports-side-arrival",
  notes: "fixture"
};

describe("Presentable windows audit", () => {
  it("finds windows that cover interesting reference events", () => {
    const rows = collectPresentableWindowsForFile(allOfYouCase.file, [allOfYouCase]);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some(row => row.reasons.includes("interesting-event"))).toBe(true);
    expect(rows.some(row => row.eventMeasures.includes("16"))).toBe(true);
  }, 15000);
});
