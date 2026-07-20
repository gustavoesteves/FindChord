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

  it("descreve e toca material quartal para vamp sus", () => {
    expect(describeLocalMaterialSource("sus quartal pentatonic")).toMatchObject({
      mood: expect.stringContaining("suspenso")
    });
    expect(suggestedLineForLocalMaterial("sus quartal pentatonic")).toMatchObject({
      name: "Quartas sobre sus"
    });
    expect(notesForLocalMaterialLine("G", suggestedLineForLocalMaterial("sus quartal pentatonic")!.intervals)).toEqual([
      "G4",
      "C5",
      "F5",
      "A5",
      "D5",
      "G5",
      "D5",
      "C5",
      "G4"
    ]);
  });

  it("descreve e toca estruturas superiores para meio-diminuto local", () => {
    expect(describeLocalMaterialSource("half diminished upper structures")).toMatchObject({
      tip: expect.stringContaining("9 natural")
    });
    expect(suggestedLineForLocalMaterial("half diminished upper structures")).toMatchObject({
      name: "ø7 com 9 natural"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("half diminished upper structures")!.intervals)).toEqual([
      "C4",
      "Eb4",
      "Gb4",
      "Bb4",
      "D5",
      "F5",
      "Ab4",
      "Gb4",
      "Eb4"
    ]);
  });

  it("descreve e toca ciclo simetrico para diminuto completo", () => {
    expect(describeLocalMaterialSource("diminished symmetric cycle")).toMatchObject({
      mood: expect.stringContaining("Simétrico")
    });
    expect(suggestedLineForLocalMaterial("diminished symmetric cycle")).toMatchObject({
      name: "Ciclo por terças menores"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("diminished symmetric cycle")!.intervals)).toEqual([
      "C4",
      "Eb4",
      "Gb4",
      "A4",
      "Eb5",
      "Gb5",
      "A5",
      "C6"
    ]);
  });

  it("descreve e toca ciclo aumentado de tons inteiros", () => {
    expect(describeLocalMaterialSource("augmented whole tone cycle")).toMatchObject({
      mood: expect.stringContaining("Flutuante")
    });
    expect(suggestedLineForLocalMaterial("augmented whole tone cycle")).toMatchObject({
      name: "Tríades aumentadas"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("augmented whole tone cycle")!.intervals)).toEqual([
      "C4",
      "E4",
      "G#4",
      "D5",
      "F#5",
      "Bb4",
      "G#4",
      "E4",
      "C4"
    ]);
  });

  it("descreve e toca triades superiores para vamp maior", () => {
    expect(describeLocalMaterialSource("major upper triad colors")).toMatchObject({
      mood: expect.stringContaining("Luminoso")
    });
    expect(suggestedLineForLocalMaterial("major upper triad colors")).toMatchObject({
      name: "Tríades superiores maiores"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("major upper triad colors")!.intervals)).toEqual([
      "C4",
      "E4",
      "G4",
      "B4",
      "D5",
      "F#5",
      "A5",
      "G4",
      "B4",
      "D5",
      "C5"
    ]);
  });

  it("descreve e toca triades superiores para dominante natural", () => {
    expect(describeLocalMaterialSource("dominant upper triad colors")).toMatchObject({
      tip: expect.stringContaining("dominante natural")
    });
    expect(suggestedLineForLocalMaterial("dominant upper triad colors")).toMatchObject({
      name: "Tríades naturais do dominante"
    });
    expect(notesForLocalMaterialLine("G", suggestedLineForLocalMaterial("dominant upper triad colors")!.intervals)).toEqual([
      "G4",
      "B4",
      "D5",
      "F5",
      "A5",
      "C6",
      "E6",
      "F5",
      "D5",
      "B4",
      "G4"
    ]);
  });

  it("descreve e toca cores melodicas para menor-maior", () => {
    expect(describeLocalMaterialSource("minor major melodic colors")).toMatchObject({
      tip: expect.stringContaining("b3 e 7M")
    });
    expect(suggestedLineForLocalMaterial("minor major melodic colors")).toMatchObject({
      name: "Menor-maior melódico"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("minor major melodic colors")!.intervals)).toEqual([
      "C4",
      "Eb4",
      "G4",
      "B4",
      "D5",
      "F5",
      "A5",
      "G4",
      "B4",
      "D5",
      "C5"
    ]);
  });

  it("descreve e toca eixo pentatonico para power chord", () => {
    expect(describeLocalMaterialSource("power riff pentatonic axis")).toMatchObject({
      mood: expect.stringContaining("ambíguo")
    });
    expect(suggestedLineForLocalMaterial("power riff pentatonic axis")).toMatchObject({
      name: "Riff pentatônico power"
    });
    expect(notesForLocalMaterialLine("C", suggestedLineForLocalMaterial("power riff pentatonic axis")!.intervals)).toEqual([
      "C4",
      "G4",
      "C5",
      "Bb4",
      "G4",
      "Eb4",
      "C4",
      "D4",
      "E4",
      "G4",
      "C4"
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
