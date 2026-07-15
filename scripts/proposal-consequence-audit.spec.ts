import { describe, expect, it } from "vitest";
import { collectNearEquivalentPairsForFile } from "./audit-proposal-consequence-similarity";

describe("proposal consequence audit", () => {
  it("uses the post-curation visible cards by default", () => {
    const visibleRows = collectNearEquivalentPairsForFile("exemplo.musicxml");
    const rawRows = collectNearEquivalentPairsForFile("exemplo.musicxml", {
      includeGroupedVariants: true
    });

    expect(rawRows.length).toBeGreaterThan(visibleRows.length);
    expect(visibleRows).toHaveLength(0);
  });

  it("only reports conservative near-equivalent pairs", () => {
    const rows = collectNearEquivalentPairsForFile("asa branca.musicxml");

    expect(rows.every(row => row.functionAgreement === 1)).toBe(true);
    expect(rows.every(row => row.rootAgreement === 1)).toBe(true);
    expect(rows.every(row => row.bassAgreement === 1)).toBe(true);
    expect(rows.every(row => row.sonorityAgreement >= 0.6)).toBe(true);
  });
});
