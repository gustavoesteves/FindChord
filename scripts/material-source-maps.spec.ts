import { describe, expect, it } from "vitest";
import {
  getCompatibleScales,
  getMaterialSourceMaps,
  getMaterialSourceMapsForQuality,
  getMaterialSourceMapTypes
} from "../src/utils/music/theory/musicTheory";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";

function chord(quality: ChordCandidate["quality"]): ChordCandidate {
  return {
    root: "C",
    quality,
    intervals: [],
    notes: [],
    drawnNotes: [],
    score: 1,
    confidence: 1,
    omissions: [],
    additions: [],
    notationInternational: "C",
    notationBrazilian: "C",
    notationAcademic: "C",
    isIncomplete: false
  };
}

describe("F302 mapas-fonte de material por qualidade", () => {
  it.each([
    ["dominant7b9", "phrygian dominant"],
    ["dominant7b13", "phrygian dominant"],
    ["dominant7#9", "altered"],
    ["dominant7#11", "lydian dominant"],
    ["halfDiminished", "locrian #2"],
    ["diminished7th", "whole-half diminished"],
    ["augmented", "whole tone"]
  ] as const)("prioriza %s com %s", (quality, expectedType) => {
    expect(getMaterialSourceMaps(chord(quality)).at(0)?.type).toBe(expectedType);
  });

  it("nao devolve mapas genericos para dominantes alteradas reconhecidas", () => {
    for (const quality of ["dominant7b5", "dominant7b9", "dominant7#9", "dominant7#11", "dominant7b13"] as const) {
      const types = getMaterialSourceMaps(chord(quality)).map(source => source.type);

      expect(types).not.toContain("major");
      expect(types).not.toContain("minor pentatonic");
    }
  });

  it("nao trata meio-diminuto como diminuto de tons inteiros", () => {
    const types = getMaterialSourceMaps(chord("halfDiminished")).map(source => source.type);

    expect(types).toContain("locrian #2");
    expect(types).not.toContain("half-whole diminished");
  });

  it("inclui bebop dominant como vocabulario linear para dominantes naturais", () => {
    const types = getMaterialSourceMaps(chord("dominant7th")).map(source => source.type);
    const bebop = getMaterialSourceMaps(chord("dominant7th")).find(source => source.type === "bebop dominant");

    expect(types.slice(0, 2)).toEqual(["mixolydian", "bebop dominant"]);
    expect(bebop?.notes).toEqual(["C", "D", "E", "F", "G", "A", "Bb", "B"]);
  });

  it("mantem o mesmo mapa pelo adaptador legado de escalas compativeis", () => {
    expect(getCompatibleScales(chord("dominant7th")).map(source => source.type)).toEqual(
      getMaterialSourceMaps(chord("dominant7th")).map(source => source.type)
    );
  });

  it("expoe tipos e mapas pelo contrato material-first", () => {
    expect(getMaterialSourceMapTypes("dominant7th").slice(0, 2)).toEqual(["mixolydian", "bebop dominant"]);
    expect(getMaterialSourceMapsForQuality("C", "major7th").map(source => source.type)).toEqual([
      "major",
      "lydian",
      "major pentatonic",
      "bebop major"
    ]);
  });
});
