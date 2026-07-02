import { describe, expect, it } from "vitest";
import { classifyHarmonicIdiom } from "../src/utils/music/analysis/strategies/HarmonicIdiomClassifier";

describe("F32 Harmonic Idiom Classifier", () => {
  it("classifies minor-functional harmony from tonic minor and dominant resolution", () => {
    const classification = classifyHarmonicIdiom(["E7", "Am", "Dm", "E7", "Am"], "A");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "minor-functional",
      confidence: "strong"
    }));
    expect(classification.evidence).toEqual(expect.arrayContaining([
      "centro aparece como acorde menor",
      "dominante maior resolve em tônica menor"
    ]));
  });

  it("reports natural and harmonic minor colors inside minor-functional harmony", () => {
    const classification = classifyHarmonicIdiom(["Am", "G", "F", "E7", "Am"], "A");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "minor-functional",
      confidence: "strong"
    }));
    expect(classification.evidence).toEqual(expect.arrayContaining([
      "menor natural aparece por bVI e bVII",
      "sensível sustenta menor harmônico"
    ]));
  });

  it("reports melodic minor color without creating a separate idiom", () => {
    const classification = classifyHarmonicIdiom(["Am6", "Bm7(b5)", "E7", "Am6"], "A");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "minor-functional",
      confidence: "strong"
    }));
    expect(classification.evidence).toEqual(expect.arrayContaining([
      "ii meio-diminuto prepara dominante menor",
      "sexta maior sugere cor de menor melódico"
    ]));
  });

  it("uses the chord symbol resolver for half-diminished and altered aliases", () => {
    const classification = classifyHarmonicIdiom(["Am6", "Bø", "E7(b13)", "Am6"], "A");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "minor-functional",
      confidence: "strong"
    }));
    expect(classification.evidence).toEqual(expect.arrayContaining([
      "ii meio-diminuto prepara dominante menor",
      "sensível sustenta menor harmônico"
    ]));
  });

  it("classifies blues when I7 and IV7 behave as stable sonorities", () => {
    const classification = classifyHarmonicIdiom(["C7", "F7", "C7", "G7", "F7", "C7"], "C");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "blues",
      confidence: "medium"
    }));
    expect(classification.evidence).toEqual(expect.arrayContaining([
      "I7 aparece como estabilidade local",
      "IV7 aparece como estabilidade local"
    ]));
  });

  it("classifies modal loops by center recurrence, modal color and absent dominant cadence", () => {
    const classification = classifyHarmonicIdiom(["Dm", "C", "Bb", "C", "Dm"], "D");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "modal",
      confidence: "medium"
    }));
    expect(classification.evidence).toEqual(expect.arrayContaining([
      "centro recorrente com cor modal e sem cadência dominante",
      "bVII sustenta cor modal"
    ]));
  });

  it("keeps ordinary V-I tonal harmony as major-functional fallback", () => {
    const classification = classifyHarmonicIdiom(["C7M", "F^", "G7", "CΔ"], "C");

    expect(classification).toEqual(expect.objectContaining({
      idiom: "major-functional",
      confidence: "weak"
    }));
  });
});
