import { describe, expect, it } from "vitest";
import {
  determineContextualHarmonicFunction,
  contextualResolutionChord,
  contextualResolutionTarget,
  guideToneResolutions,
  guideTonesFor
} from "../src/utils/music/theory/contextualMaterialFunction";

describe("F202 funcao contextual de material", () => {
  it("reconhece dominante resolvendo no centro tonal", () => {
    expect(determineContextualHarmonicFunction({
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "G")).toBe("dominant");
  });

  it("reconhece dominantes secundarias pelo alvo real", () => {
    expect(determineContextualHarmonicFunction({
      chord: "A7",
      nextChord: "Dm",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "A")).toBe("dominant");

    expect(determineContextualHarmonicFunction({
      chord: "E7",
      nextChord: "Am",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "E")).toBe("dominant");
  });

  it("nao chama dominante sem relacao V ou SubV de funcao dominante", () => {
    expect(determineContextualHarmonicFunction({
      chord: "D7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "D")).toBe("color");
  });

  it("reconhece SubV pelo alvo cromatico descendente", () => {
    expect(determineContextualHarmonicFunction({
      chord: "Db7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "Db")).toBe("dominant");
  });

  it("usa alvo de resolucao quando nao ha proximo acorde explicito", () => {
    expect(determineContextualHarmonicFunction({
      chord: "A7",
      tonalCenter: { tonic: "C", mode: "major" },
      resolutionTarget: "D"
    }, "A")).toBe("dominant");

    expect(determineContextualHarmonicFunction({
      chord: "D7",
      tonalCenter: { tonic: "C", mode: "major" },
      resolutionTarget: "C"
    }, "D")).toBe("color");
  });

  it("infere alvo regional apenas para dominante primaria do centro", () => {
    const primaryDominant = {
      chord: "G7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSecondaryDominant = {
      chord: "D7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(primaryDominant, "G")).toBe("C");
    expect(determineContextualHarmonicFunction(primaryDominant, "G")).toBe("dominant");
    expect(contextualResolutionTarget(looseSecondaryDominant, "D")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSecondaryDominant, "D")).toBe("color");
    expect(contextualResolutionTarget({
      chord: "G7",
      nextChord: "Cm",
      tonalCenter: { tonic: "C", mode: "minor" }
    }, "G")).toBeUndefined();
  });

  it("infere alvo regional local quando um ii prepara dominante sem proximo acorde", () => {
    const preparedDominant = {
      chord: "A7",
      previousChord: "Em7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSecondaryDominant = {
      chord: "A7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedDominant, "A")).toBe("D");
    expect(determineContextualHarmonicFunction(preparedDominant, "A")).toBe("dominant");
    expect(contextualResolutionTarget(looseSecondaryDominant, "A")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSecondaryDominant, "A")).toBe("color");
  });

  it("infere qualidade menor para alvo local preparado por iiø", () => {
    const preparedMinorDominant = {
      chord: "A7",
      previousChord: "Em7b5",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedMinorDominant, "A")).toBe("D");
    expect(contextualResolutionChord(preparedMinorDominant, "A", "D")).toBe("Dm");
    expect(guideToneResolutions(["C#", "G"], "D", "Dm")).toEqual(["C#->D", "G->F"]);
  });

  it("infere alvo regional local quando IV prepara dominante sem proximo acorde", () => {
    const preparedDominant = {
      chord: "D7",
      previousChord: "C",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSecondaryDominant = {
      chord: "D7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedDominant, "D")).toBe("G");
    expect(contextualResolutionChord(preparedDominant, "D", "G")).toBeUndefined();
    expect(determineContextualHarmonicFunction(preparedDominant, "D")).toBe("dominant");
    expect(contextualResolutionTarget(looseSecondaryDominant, "D")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSecondaryDominant, "D")).toBe("color");
  });

  it("infere alvo menor quando iv prepara dominante sem proximo acorde", () => {
    const preparedMinorDominant = {
      chord: "C7",
      previousChord: "Bbm7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedMinorDominant, "C")).toBe("F");
    expect(contextualResolutionChord(preparedMinorDominant, "C", "F")).toBe("Fm");
    expect(guideToneResolutions(["E", "Bb"], "F", "Fm")).toEqual(["E->F", "Bb->Ab"]);
  });

  it("reconhece diminuto resolvido por semitom como dominante auxiliar", () => {
    expect(determineContextualHarmonicFunction({
      chord: "G#dim7",
      nextChord: "Am",
      tonalCenter: { tonic: "A", mode: "minor" }
    }, "G#")).toBe("dominant");

    expect(determineContextualHarmonicFunction({
      chord: "Cdim7",
      nextChord: "Am",
      tonalCenter: { tonic: "A", mode: "minor" }
    }, "C")).toBe("color");
  });

  it("reconhece diminuto invertido quando o baixo conduz ao alvo por semitom", () => {
    expect(determineContextualHarmonicFunction({
      chord: "Edim7/C#",
      nextChord: "Dm",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "E")).toBe("dominant");

    expect(contextualResolutionTarget({
      chord: "Bdim7",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "B")).toBe("C");
  });

  it("calcula notas-guia e resolucoes proximas", () => {
    const guideTones = guideTonesFor("G", "dominant7th");

    expect(guideTones).toEqual(["B", "F"]);
    expect(guideToneResolutions(guideTones, "C")).toEqual(["B->C", "F->E"]);
  });

  it("deriva notas-guia apenas dos graus presentes na qualidade", () => {
    expect(guideTonesFor("C", "major")).toEqual(["E"]);
    expect(guideTonesFor("C", "major6th")).toEqual(["E"]);
    expect(guideTonesFor("C", "add9")).toEqual(["E"]);
    expect(guideTonesFor("C", "sus4")).toEqual([]);
    expect(guideTonesFor("C", "power")).toEqual([]);
  });

  it("resolve notas-guia para a qualidade real do acorde de chegada", () => {
    expect(guideToneResolutions(["G#", "D"], "A", "Am")).toEqual(["G#->A", "D->C"]);
    expect(guideToneResolutions(["B", "F"], "C", "Cm")).toEqual(["B->C", "F->Eb"]);
  });
});
