import { describe, expect, it } from "vitest";
import {
  resolveMaterialChordQuality,
  weightedMelodyNotesFromContext
} from "../src/utils/music/theory/contextualMaterialChordContext";

describe("F206 contexto de acorde para materiais", () => {
  it("resolve cifras reais para a qualidade interna do motor", () => {
    expect(resolveMaterialChordQuality("G7")?.quality).toBe("dominant7th");
    expect(resolveMaterialChordQuality("Bm7b5")).toEqual({ root: "B", quality: "halfDiminished" });
    expect(resolveMaterialChordQuality("Cmaj7")?.quality).toBe("major7th");
  });

  it.each([
    ["G7(#5)", "dominant7b13"],
    ["G7(#9,b13)", "dominant7#9"],
    ["G9(b5)", "dominant7b5"],
    ["G9(#5)", "dominant7b13"],
    ["G9(#9)", "dominant7#9"],
    ["G9(#11)", "dominant7#11"],
    ["G13(b9)", "dominant7b9"],
    ["G13(#11)", "dominant7#11"],
    ["G13(b9,#11)", "dominant7b9"]
  ] as const)("mantem %s como qualidade dominante interna", (symbol, quality) => {
    expect(resolveMaterialChordQuality(symbol)).toEqual({
      root: "G",
      quality
    });
  });

  it("recusa cifras ambiguas que o parser legado leria como maior por fallback", () => {
    expect(resolveMaterialChordQuality("G(#75)")).toBeNull();
  });

  it("normaliza a melodia com peso ritmico quando existe duracao", () => {
    expect(weightedMelodyNotesFromContext([
      "Bb",
      { pitch: "F#4", duration: 960 }
    ])).toEqual([
      { pitch: "Bb", weight: 1 },
      { pitch: "F#", weight: 2 }
    ]);
  });
});
