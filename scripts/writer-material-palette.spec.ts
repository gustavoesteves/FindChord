import { describe, expect, it } from "vitest";
import {
  actionLabelForWriterMaterialIntent,
  buildWriterMaterialPalette,
  shortHintForWriterMaterialCard
} from "../src/domains/writer/services/writerMaterialPalette";
import type { LocalChordMaterialReading } from "../src/utils/music/theory/localChordMaterials";

describe("F227 paleta composicional de materiais do acorde", () => {
  it("deriva o verbo do card pela intencao musical", () => {
    expect(actionLabelForWriterMaterialIntent("Dentro")).toBe("Apoiar o acorde");
    expect(actionLabelForWriterMaterialIntent("Funcional")).toBe("Colorir sem sair");
    expect(actionLabelForWriterMaterialIntent("Cor")).toBe("Explorar cor");
    expect(actionLabelForWriterMaterialIntent("Tensão")).toBe("Preparar resolução");
    expect(actionLabelForWriterMaterialIntent("Fora")).toBe("Tensionar por fora");
  });

  it("apresenta o material tocavel antes da fonte teorica", () => {
    const palette = buildWriterMaterialPalette([
      {
        source: {
          name: "C Lydian",
          type: "lydian",
          intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7M"],
          notes: ["C", "D", "E", "F#", "G", "A", "B"]
        },
        candidate: {
          intent: "functional",
          practiceHint: "Explore #11 sem perder C e E."
        } as LocalChordMaterialReading["candidate"],
        primaryMaterial: {
          label: "Tríade com #11",
          cells: ["C-E-F#", "E-G-B"],
          practiceHint: "Use a #11 como cor suspensa.",
          source: "arpeggio",
          tensionProfile: ["#11"],
          resolutionTargets: []
        },
        extraMaterialCount: 2
      }
    ]);

    expect(palette[0]).toMatchObject({
      title: "Tríade com #11",
      cells: ["C-E-F#", "E-G-B"],
      extraMaterialCount: 2,
      intentLabel: "Funcional",
      actionLabel: "Colorir sem sair"
    });
  });

  it("usa a fonte como fallback quando ainda nao ha material melodico", () => {
    const palette = buildWriterMaterialPalette([
      {
        source: {
          name: "C Major",
          type: "major",
          intervals: ["1P", "2M", "3M", "4P", "5P", "6M", "7M"],
          notes: ["C", "D", "E", "F", "G", "A", "B"]
        },
        extraMaterialCount: 0
      }
    ]);

    expect(palette[0]).toMatchObject({
      title: "C Major",
      subtitle: "Use como conjunto de notas, cores e células possíveis para este acorde.",
      cells: ["C", "D", "E", "F"],
      intentLabel: "Cor",
      actionLabel: "Explorar cor"
    });
  });

  it("resume dicas longas para caber no card", () => {
    expect(
      shortHintForWriterMaterialCard("Use a #11 como brilho principal sobre o acorde e volte para C ou E antes de repousar.")
    ).toBe("Use a #11 como brilho principal sobre o acorde e volte para C ou E...");
  });
});
