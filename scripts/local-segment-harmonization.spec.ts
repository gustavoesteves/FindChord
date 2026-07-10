import { describe, expect, it } from "vitest";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { buildLocalSegmentHarmonizations } from "../src/domains/harmonizer/services/localSegmentHarmonization";

function anchor(measureIndex: number, pitch: string): MelodicAnchor {
  return { measureIndex, pitch, duration: 1920 };
}

function harmony(measure: number, symbol: string): ScoreHarmonyEvent {
  return {
    measure,
    beat: 1,
    harmony: symbol,
    tickStart: measure * 1920,
    tickEnd: measure * 1920 + 1920,
    durationTicks: 1920
  };
}

describe("buildLocalSegmentHarmonizations", () => {
  it("returns secondary local segments without replacing the primary window", () => {
    const anchors = [
      anchor(1, "C"),
      anchor(2, "E"),
      anchor(3, "G"),
      anchor(4, "C"),
      anchor(5, "D"),
      anchor(6, "F"),
      anchor(7, "G"),
      anchor(8, "C"),
      anchor(9, "A"),
      anchor(10, "G"),
      anchor(11, "F"),
      anchor(12, "C")
    ];
    const referenceHarmonies = [
      harmony(1, "C"),
      harmony(2, "C"),
      harmony(5, "Dm7"),
      harmony(6, "G7"),
      harmony(7, "C"),
      harmony(8, "C"),
      harmony(9, "F"),
      harmony(10, "G7"),
      harmony(11, "C")
    ];

    const segments = buildLocalSegmentHarmonizations({
      anchors,
      referenceHarmonies,
      primaryMeasures: [1, 2, 3, 4, 5, 6, 7, 8],
      keySignature: "C",
      maxSegments: 2
    });

    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].measureIndexes).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(segments[0].primaryProposal.measures.length).toBeGreaterThan(0);
    expect(segments[0].reasonLabel).toBe("Boa referência");
  });
});
