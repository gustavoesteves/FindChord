import { describe, expect, it } from "vitest";
import { evaluateVoicingErgonomics } from "../src/utils/music/scoring/voicingErgonomics";

describe("voicing ergonomics policy", () => {
  it("treats compact barre shapes as comfortable instead of penalizing barre categorically", () => {
    const compactBarre = evaluateVoicingErgonomics([1, 1, 1, 1, null, null]);
    const wideShape = evaluateVoicingErgonomics([1, 5, 6, null, null, null]);

    expect(compactBarre.hasBarre).toBe(true);
    expect(compactBarre.label).toBe("confortável");
    expect(compactBarre.score).toBeGreaterThan(wideShape.score);
    expect(wideShape.label).toBe("exige abertura");
  });

  it("keeps open strings maximally comfortable", () => {
    expect(evaluateVoicingErgonomics([0, 0, null, null, null, null])).toMatchObject({
      score: 100,
      label: "confortável",
      stretch: 0,
      hasBarre: false
    });
  });
});
