import { describe, expect, it } from "vitest";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";
import { buildLocalChordMaterialReadings } from "../src/utils/music/theory/localChordMaterials";

function chord(partial: Partial<ChordCandidate>): ChordCandidate {
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

describe("F207 materiais locais do acorde", () => {
  it("combina mapas-fonte com candidatos material-first para o Escrever", () => {
    const readings = buildLocalChordMaterialReadings(chord({}));

    expect(readings.length).toBeGreaterThan(0);
    expect(readings[0]?.source.type).toBeTruthy();
    expect(readings[0]?.candidate?.chord).toBe("G7");
    expect(readings[0]?.primaryMaterial).toBe(readings[0]?.candidate?.melodicMaterials[0]);
    expect(readings[0]?.extraMaterialCount).toBe(Math.max(0, (readings[0]?.candidate?.melodicMaterials.length || 0) - 1));
    expect(readings.some(reading => reading.candidate?.melodicMaterials.length)).toBe(true);
  });

  it("mantem o acorde isolado como contexto local, sem alvo de resolucao inventado", () => {
    const readings = buildLocalChordMaterialReadings(chord({}));

    expect(readings.every(reading => !reading.candidate?.resolutionTarget)).toBe(true);
  });
});
