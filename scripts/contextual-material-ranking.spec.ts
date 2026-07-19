import { describe, expect, it } from "vitest";
import {
  melodicFitFor,
  scoreMaterialCandidate
} from "../src/utils/music/theory/contextualMaterialRanking";

describe("F203 ranking contextual de material", () => {
  it("mede cobertura melodica ponderada", () => {
    const scored = scoreMaterialCandidate(
      { name: "C major", type: "major", intervals: [], notes: ["C", "D", "E", "F", "G", "A", "B"] },
      "C",
      ["C", "E", "G"],
      [{ pitch: "E", weight: 2 }, { pitch: "Bb", weight: 1 }],
      "tonic",
      undefined,
      0
    );

    expect(scored.melodyCoverage).toBeCloseTo(2 / 3);
  });

  it("marca cuidado quando uma nota da melodia cai em avoid note", () => {
    expect(melodicFitFor({
      avoidNotes: ["F"],
      linearFragments: [],
      melodyCoverage: 1,
      melodyNotes: ["F"]
    })).toBe("caution");
  });
});
