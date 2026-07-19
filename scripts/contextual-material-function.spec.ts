import { describe, expect, it } from "vitest";
import {
  determineContextualHarmonicFunction,
  guideToneResolutions,
  guideTonesFor
} from "../src/utils/music/theory/contextualMaterialFunction";

describe("F202 funcao contextual de material", () => {
  it("reconhece dominante resolvendo no centro tonal", () => {
    expect(determineContextualHarmonicFunction({
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "G")).toBe("dominant");
  });

  it("calcula notas-guia e resolucoes proximas", () => {
    const guideTones = guideTonesFor("G", "dominant7th");

    expect(guideTones).toEqual(["B", "F"]);
    expect(guideToneResolutions(guideTones, "C")).toEqual(["B->C", "F->E"]);
  });
});
