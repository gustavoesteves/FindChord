import { describe, expect, it } from "vitest";
import { inferFunctionalSubstitutionIdiom } from "../src/utils/music/analysis/strategies/FunctionalSubstitutionIdiomInference";

describe("F30.3 Functional Substitution Idiom Inference", () => {
  it("detects minor-functional phrases from tonic minor and dominant resolution", () => {
    const inference = inferFunctionalSubstitutionIdiom(["E7", "Am", "Dm", "E7", "Am"], "A");

    expect(inference).toEqual(expect.objectContaining({
      idiom: "minor-functional",
      confidence: "strong"
    }));
    expect(inference.evidence).toEqual(expect.arrayContaining([
      "centro aparece como acorde menor",
      "dominante maior resolve em tônica menor"
    ]));
  });

  it("detects minor-functional phrases from iiø-V-i grammar", () => {
    const inference = inferFunctionalSubstitutionIdiom(["Am", "Bm7(b5)", "E7", "Am"], "A");

    expect(inference.idiom).toBe("minor-functional");
    expect(inference.evidence).toContain("ii meio-diminuto prepara dominante menor");
  });

  it("detects blues without enabling tonal substitutions", () => {
    const inference = inferFunctionalSubstitutionIdiom(["C7", "F7", "C7", "G7", "F7", "C7"], "C");

    expect(inference).toEqual(expect.objectContaining({
      idiom: "blues",
      confidence: "medium"
    }));
  });

  it("detects modal loops without a dominant cadence", () => {
    const inference = inferFunctionalSubstitutionIdiom(["Dm", "C", "Bb", "C", "Dm"], "D");

    expect(inference).toEqual(expect.objectContaining({
      idiom: "modal",
      confidence: "medium"
    }));
  });

  it("falls back to major-functional when no stronger idiom is present", () => {
    const inference = inferFunctionalSubstitutionIdiom(["Cmaj7", "Fmaj7", "G7", "Cmaj7"], "C");

    expect(inference).toEqual(expect.objectContaining({
      idiom: "major-functional",
      confidence: "weak"
    }));
  });
});
