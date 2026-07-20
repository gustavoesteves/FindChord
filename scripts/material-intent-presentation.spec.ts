import { describe, expect, it } from "vitest";
import {
  MATERIAL_INTENT_PRESENTATION,
  materialIntentPresentation
} from "../src/utils/music/theory/materialIntentPresentation";

describe("apresentacao compartilhada de intencao material", () => {
  it("mantem rotulos consistentes entre Escrever e Harmonizar", () => {
    expect(materialIntentPresentation("inside")).toMatchObject({
      harmonizerLabel: "Estável",
      writerLabel: "Dentro",
      writerActionLabel: "Apoiar o acorde"
    });
    expect(materialIntentPresentation("functional")).toMatchObject({
      harmonizerLabel: "Direção",
      writerLabel: "Funcional",
      writerActionLabel: "Colorir sem sair"
    });
    expect(materialIntentPresentation("tension")).toMatchObject({
      harmonizerLabel: "Tensão",
      writerLabel: "Tensão",
      writerActionLabel: "Preparar resolução"
    });
    expect(materialIntentPresentation("outside")).toMatchObject({
      harmonizerLabel: "Exterior",
      writerLabel: "Fora",
      writerActionLabel: "Sair e voltar"
    });
  });

  it("define classe visual para todas as intencoes do contrato", () => {
    expect(Object.keys(MATERIAL_INTENT_PRESENTATION).sort()).toEqual([
      "functional",
      "inside",
      "outside",
      "tension"
    ]);
    for (const presentation of Object.values(MATERIAL_INTENT_PRESENTATION)) {
      expect(presentation.className).toContain("border-");
      expect(presentation.activeClassName).toContain("border-transparent");
    }
  });
});
