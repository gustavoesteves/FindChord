import { describe, expect, it } from "vitest";
import {
  describeLocalMaterialSource,
  notesForLocalMaterialLine,
  suggestedLineForLocalMaterial
} from "../src/utils/music/theory/localMaterialPresentation";

describe("F210 apresentacao de materiais locais", () => {
  it("descreve fontes conhecidas de material", () => {
    expect(describeLocalMaterialSource("lydian")).toMatchObject({
      mood: expect.stringContaining("brilho modal")
    });
  });

  it("usa correspondencia parcial para variantes da fonte", () => {
    expect(describeLocalMaterialSource("C lydian dominant").desc).toContain("Lídio Dominante");
  });

  it("oferece frase de estudo apenas quando existe vocabulario cadastrado", () => {
    expect(suggestedLineForLocalMaterial("dorian")?.intervals).toContain("6M");
    expect(suggestedLineForLocalMaterial("altered")).toBeUndefined();
  });

  it("mantem fallback para fontes ainda nao documentadas", () => {
    expect(describeLocalMaterialSource("synthetic source")).toMatchObject({
      mood: "Combinação harmônica fluida."
    });
  });

  it("transforma intervalos de uma frase local em notas sobre a raiz", () => {
    expect(notesForLocalMaterialLine("G", ["3M", "7m", "8P"])).toEqual(["B4", "F5", "G5"]);
  });
});
