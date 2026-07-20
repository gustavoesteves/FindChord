import { describe, expect, it } from "vitest";
import {
  LOCAL_CHORD_VAMP_MATERIAL_CATALOG,
  buildLocalChordVampSupplementalCandidates,
  localChordVampCatalogEntriesForIntent,
  localChordVampCatalogEntriesForQuality
} from "../src/utils/music/theory/localChordVampMaterialCatalog";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";

function chord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return {
    root: "G",
    quality: "dominant7th",
    intervals: ["1P", "3M", "5P", "7m"],
    notes: ["G", "B", "D", "F"],
    drawnNotes: ["G", "B", "D", "F"],
    score: 1,
    confidence: 1,
    omissions: [],
    additions: [],
    notationInternational: "G7",
    notationBrazilian: "G7",
    notationAcademic: "G7",
    isIncomplete: false,
    ...partial
  };
}

describe("F325 catalogo versionavel de materiais locais", () => {
  it("mantem ids e sourceTypes unicos para consumo compartilhado", () => {
    const ids = LOCAL_CHORD_VAMP_MATERIAL_CATALOG.map(entry => entry.id);
    const sourceTypes = LOCAL_CHORD_VAMP_MATERIAL_CATALOG.map(entry => entry.sourceType);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sourceTypes).size).toBe(sourceTypes.length);
  });

  it("explicita qualidades e intencoes sem executar o builder", () => {
    expect(LOCAL_CHORD_VAMP_MATERIAL_CATALOG).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "dominant-upper-triad-colors",
        sourceType: "dominant upper triad colors",
        qualities: expect.arrayContaining(["dominant7th", "dominant13th"]),
        intent: "functional"
      }),
      expect.objectContaining({
        id: "power-riff-pentatonic-axis",
        sourceType: "power riff pentatonic axis",
        qualities: ["power"],
        intent: "inside"
      })
    ]));
  });

  it("permite consultar o catalogo por qualidade e intencao antes da materializacao", () => {
    expect(localChordVampCatalogEntriesForQuality("dominant7th").map(entry => entry.id)).toEqual(expect.arrayContaining([
      "dominant-diminished-axis",
      "dominant-side-slip-minor-pentatonic",
      "dominant-upper-triad-colors"
    ]));
    expect(localChordVampCatalogEntriesForQuality("power").map(entry => entry.id)).toEqual([
      "power-riff-pentatonic-axis"
    ]);
    expect(localChordVampCatalogEntriesForIntent("tension").map(entry => entry.id)).toEqual(expect.arrayContaining([
      "dominant-diminished-axis",
      "diminished-symmetric-cycle",
      "augmented-whole-tone-cycle"
    ]));
  });

  it("materializa apenas entradas aplicaveis ao acorde recebido", () => {
    const dominant = buildLocalChordVampSupplementalCandidates(chord());
    const power = buildLocalChordVampSupplementalCandidates(chord({
      root: "C",
      quality: "power",
      intervals: ["1P", "5P"],
      notes: ["C", "G"],
      drawnNotes: ["C", "G"],
      notationInternational: "C5",
      notationBrazilian: "C5",
      notationAcademic: "C5"
    }));

    expect(dominant.map(candidate => candidate.type)).toEqual(expect.arrayContaining([
      "dominant upper triad colors",
      "dominant diminished axis",
      "side slip minor pentatonic"
    ]));
    expect(power.map(candidate => candidate.type)).toEqual(["power riff pentatonic axis"]);
  });
});
