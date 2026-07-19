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

  it("descreve materiais locais de vamp dominante", () => {
    expect(describeLocalMaterialSource("dominant diminished axis")).toMatchObject({
      mood: expect.stringContaining("Tensão organizada")
    });
    expect(describeLocalMaterialSource("side slip minor pentatonic")).toMatchObject({
      tip: expect.stringContaining("voltar")
    });
  });

  it("oferece linhas curtas para materiais locais de vamp dominante", () => {
    expect(suggestedLineForLocalMaterial("dominant diminished axis")).toMatchObject({
      name: "Eixo por ii menores",
      intervals: ["5P", "7m", "9M", "11P", "7m", "3M", "1P"]
    });
    expect(notesForLocalMaterialLine("G", suggestedLineForLocalMaterial("side slip minor pentatonic")!.intervals)).toEqual([
      "C#5",
      "E5",
      "F#5",
      "G#4",
      "B4",
      "G4"
    ]);
  });

  it("descreve e toca pilha pentatonica dorica para vamp menor", () => {
    expect(describeLocalMaterialSource("minor dorian pentatonic stack")).toMatchObject({
      mood: expect.stringContaining("Menor modal")
    });
    expect(suggestedLineForLocalMaterial("minor dorian pentatonic stack")).toMatchObject({
      name: "Pentatônicas dóricas"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("minor dorian pentatonic stack")!.intervals)).toEqual([
      "C4",
      "Eb4",
      "F4",
      "G4",
      "Bb4",
      "D5",
      "F5",
      "A5",
      "G4",
      "Eb4"
    ]);
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
