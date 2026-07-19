import { describe, expect, it } from "vitest";
import { buildWriterActiveMaterialPanel } from "../src/domains/writer/services/writerActiveMaterialPanel";

describe("F228 painel ativo de material do acorde", () => {
  it("reune materiais melodicos, frase de estudo e leitura teorica", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "lydian",
      chordRoot: "C",
      candidate: {
        melodicMaterials: [
          {
            label: "Tríade com #11",
            source: "arpeggio",
            cells: ["C-E-F#"],
            tensionProfile: ["#11"],
            resolutionTargets: [],
            practiceHint: "Use a #11 como cor suspensa."
          }
        ]
      } as Parameters<typeof buildWriterActiveMaterialPanel>[0]["candidate"]
    });

    expect(panel.melodicMaterials[0].label).toBe("Tríade com #11");
    expect(panel.studyLine).toMatchObject({
      name: "Ascensão pela #11",
      notes: ["C4", "E4", "F#4", "G4", "B4", "A4", "C5"],
      displayNotes: ["C", "E", "F#", "G", "B", "A", "C"]
    });
    expect(panel.theory.desc).toContain("Lídio");
  });

  it("retorna painel sem frase quando nao ha linha cadastrada", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "unknown source",
      chordRoot: "C"
    });

    expect(panel.melodicMaterials).toEqual([]);
    expect(panel.studyLine).toBeUndefined();
    expect(panel.theory.desc).toBeTruthy();
  });
});
