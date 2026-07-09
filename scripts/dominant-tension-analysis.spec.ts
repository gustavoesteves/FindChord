import { describe, expect, it } from "vitest";
import {
  analyzeDominantTension,
  compareDominantTension,
  describeDominantTension
} from "../src/utils/music/analysis/strategies/DominantTensionAnalysis";

describe("Dominant tension analysis", () => {
  it("grades dominant tension from stable dominant to highly altered dominant", () => {
    expect(analyzeDominantTension("G7")).toMatchObject({
      isDominant: true,
      level: "diatonic",
      score: 1,
      expectation: "stable-dominant"
    });

    expect(analyzeDominantTension("G13")).toMatchObject({
      isDominant: true,
      level: "color",
      score: 2,
      tensions: ["9", "13"],
      expectation: "color-dominant"
    });

    expect(analyzeDominantTension("G7(b9)")).toMatchObject({
      isDominant: true,
      level: "altered",
      score: 3,
      alteredTensions: ["b9"],
      expectation: "heightened-resolution"
    });

    expect(analyzeDominantTension("G7(b13,b9)")).toMatchObject({
      isDominant: true,
      level: "high-altered",
      score: 4,
      alteredTensions: ["b9", "b13"],
      expectation: "maximum-resolution"
    });

    expect(analyzeDominantTension("G7alt")).toMatchObject({
      isDominant: true,
      level: "high-altered",
      score: 4
    });

    expect(analyzeDominantTension("Cmaj7")).toMatchObject({
      isDominant: false,
      level: "none",
      score: 0
    });
  });

  it("keeps color dominants distinct from altered dominants", () => {
    expect(analyzeDominantTension("Db7(#11)")).toMatchObject({
      level: "color",
      score: 2,
      tensions: ["#11"]
    });

    expect(compareDominantTension("G7alt", "G13")).toBeGreaterThan(0);
    expect(describeDominantTension("G7(b13,b9)")).toBe("G7(b13,b9): dominante altamente alterada");
  });
});
