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

  it.each([
    "G7(#5)",
    "G7(#9,b13)",
    "G9(b5)",
    "G9(#5)",
    "G9(#9)",
    "G9(#11)",
    "G13(b9)",
    "G13(#11)",
    "G13(b9,#11)"
  ])("reconhece dominante alterada %s com alvo real", chord => {
    expect(determineContextualHarmonicFunction({
      chord,
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" }
    }, "G")).toBe("dominant");
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
    const minorPrimaryDominant = {
      chord: "G7",
      tonalCenter: { tonic: "C", mode: "minor" as const }
    };
    const looseSecondaryDominant = {
      chord: "D7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(primaryDominant, "G")).toBe("C");
    expect(contextualResolutionChord(primaryDominant, "G", "C")).toBeUndefined();
    expect(determineContextualHarmonicFunction(primaryDominant, "G")).toBe("dominant");
    expect(contextualResolutionTarget(minorPrimaryDominant, "G")).toBe("C");
    expect(contextualResolutionChord(minorPrimaryDominant, "G", "C")).toBe("Cm");
    expect(guideToneResolutions(["B", "F"], "C", "Cm")).toEqual(["B->C", "F->Eb"]);
    expect(contextualResolutionTarget(looseSecondaryDominant, "D")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSecondaryDominant, "D")).toBe("color");
    expect(contextualResolutionTarget({
      chord: "G7",
      nextChord: "Cm",
      tonalCenter: { tonic: "C", mode: "minor" }
    }, "G")).toBeUndefined();
  });

  it("trata dominante sobre a propria tonica como cor modal, nao alvo resolutivo", () => {
    const tonicDominant = {
      chord: "C7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(tonicDominant, "C")).toBeUndefined();
    expect(determineContextualHarmonicFunction(tonicDominant, "C")).toBe("modal");
  });

  it("trata dominante que permanece na mesma raiz como continuidade modal", () => {
    const sameRootDominant = {
      chord: "A7alt",
      nextChord: "A13",
      tonalCenter: { tonic: "D", mode: "major" as const }
    };
    const sameRootDominantWithExplicitTarget = {
      ...sameRootDominant,
      resolutionTarget: "D"
    };

    expect(contextualResolutionTarget(sameRootDominant, "A")).toBeUndefined();
    expect(determineContextualHarmonicFunction(sameRootDominant, "A")).toBe("modal");
    expect(contextualResolutionTarget(sameRootDominantWithExplicitTarget, "A")).toBe("D");
    expect(determineContextualHarmonicFunction(sameRootDominantWithExplicitTarget, "A")).toBe("dominant");
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

  it("recupera preparacao recente quando a dominante foi prolongada na mesma raiz", () => {
    const suspendedResolution = {
      chord: "A7",
      previousChord: "A7sus4",
      chordHistory: ["Em7", "A7sus4"],
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSuspension = {
      chord: "A7",
      previousChord: "A7sus4",
      chordHistory: ["A7sus4"],
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(suspendedResolution, "A")).toBe("D");
    expect(determineContextualHarmonicFunction(suspendedResolution, "A")).toBe("dominant");
    expect(contextualResolutionTarget(looseSuspension, "A")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSuspension, "A")).toBe("color");
  });

  it("trata dominante 9sus como prolongamento funcional quando ha preparacao", () => {
    const preparedSuspendedNinth = {
      chord: "A9sus",
      previousChord: "Em7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSuspendedNinth = {
      chord: "A9sus",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedSuspendedNinth, "A")).toBe("D");
    expect(determineContextualHarmonicFunction(preparedSuspendedNinth, "A")).toBe("dominant");
    expect(contextualResolutionTarget(looseSuspendedNinth, "A")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSuspendedNinth, "A")).toBe("color");
  });

  it("mantem dominante 13sus preparado na mesma familia funcional", () => {
    const preparedSuspendedThirteenth = {
      chord: "A13sus",
      previousChord: "Em7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSuspendedThirteenth = {
      chord: "A13sus",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedSuspendedThirteenth, "A")).toBe("D");
    expect(determineContextualHarmonicFunction(preparedSuspendedThirteenth, "A")).toBe("dominant");
    expect(contextualResolutionTarget(looseSuspendedThirteenth, "A")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSuspendedThirteenth, "A")).toBe("color");
  });

  it("preserva alvo menor quando a dominante prolongada veio de preparacao menor", () => {
    const halfDiminishedPreparation = {
      chord: "A7",
      previousChord: "A7sus4",
      chordHistory: ["Em7b5", "A7sus4"],
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const minorSubdominantPreparation = {
      chord: "C7",
      previousChord: "C7sus4",
      chordHistory: ["Bbm7", "C7sus4"],
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(halfDiminishedPreparation, "A")).toBe("D");
    expect(contextualResolutionChord(halfDiminishedPreparation, "A", "D")).toBe("Dm");
    expect(guideToneResolutions(["C#", "G"], "D", "Dm")).toEqual(["C#->D", "G->F"]);

    expect(contextualResolutionTarget(minorSubdominantPreparation, "C")).toBe("F");
    expect(contextualResolutionChord(minorSubdominantPreparation, "C", "F")).toBe("Fm");
    expect(guideToneResolutions(["E", "Bb"], "F", "Fm")).toEqual(["E->F", "Bb->Ab"]);
  });

  it("infere alvo regional local quando ii prepara SubV sem proximo acorde", () => {
    const preparedSubV = {
      chord: "Db7",
      previousChord: "Dm7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseSubV = {
      chord: "Db7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedSubV, "Db")).toBe("C");
    expect(contextualResolutionChord(preparedSubV, "Db", "C")).toBeUndefined();
    expect(determineContextualHarmonicFunction(preparedSubV, "Db")).toBe("dominant");
    expect(contextualResolutionTarget(looseSubV, "Db")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseSubV, "Db")).toBe("color");
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

  it("infere alvo regional local quando IV local prepara dominante por quarta", () => {
    const preparedLocalDominant = {
      chord: "Bb7",
      previousChord: "Fmaj7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseDominant = {
      chord: "Bb7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(preparedLocalDominant, "Bb")).toBe("Eb");
    expect(contextualResolutionChord(preparedLocalDominant, "Bb", "Eb")).toBeUndefined();
    expect(determineContextualHarmonicFunction(preparedLocalDominant, "Bb")).toBe("dominant");
    expect(contextualResolutionTarget(looseDominant, "Bb")).toBeUndefined();
    expect(determineContextualHarmonicFunction(looseDominant, "Bb")).toBe("color");
  });

  it("infere alvo de cadeia dominante sem capturar tonica dominante", () => {
    const chainDominant = {
      chord: "D7",
      previousChord: "A7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const tonicDominantAfterCadence = {
      chord: "C7",
      previousChord: "G7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(chainDominant, "D")).toBe("G");
    expect(determineContextualHarmonicFunction(chainDominant, "D")).toBe("dominant");
    expect(contextualResolutionTarget(tonicDominantAfterCadence, "C")).toBeUndefined();
    expect(determineContextualHarmonicFunction(tonicDominantAfterCadence, "C")).toBe("modal");
  });

  it("infere alvo regional quando diminuto de sensivel prepara uma dominante local", () => {
    const leadingDiminishedToDominant = {
      chord: "A7",
      previousChord: "G#dim7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const tonicDominantPreparedByLeadingDiminished = {
      chord: "C7",
      previousChord: "Bdim7",
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(leadingDiminishedToDominant, "A")).toBe("D");
    expect(determineContextualHarmonicFunction(leadingDiminishedToDominant, "A")).toBe("dominant");
    expect(contextualResolutionTarget(tonicDominantPreparedByLeadingDiminished, "C")).toBeUndefined();
    expect(determineContextualHarmonicFunction(tonicDominantPreparedByLeadingDiminished, "C")).toBe("modal");
  });

  it("preserva alvo menor quando iiø prepara dominante por diminuto de sensivel intermediario", () => {
    const diminishedBridgeToMinorDominant = {
      chord: "A7",
      previousChord: "G#dim7",
      chordHistory: ["Em7b5", "G#dim7"],
      tonalCenter: { tonic: "C", mode: "major" as const }
    };
    const looseDiminishedBridge = {
      chord: "A7",
      previousChord: "G#dim7",
      chordHistory: ["G#dim7"],
      tonalCenter: { tonic: "C", mode: "major" as const }
    };

    expect(contextualResolutionTarget(diminishedBridgeToMinorDominant, "A")).toBe("D");
    expect(contextualResolutionChord(diminishedBridgeToMinorDominant, "A", "D")).toBe("Dm");
    expect(determineContextualHarmonicFunction(diminishedBridgeToMinorDominant, "A")).toBe("dominant");
    expect(contextualResolutionTarget(looseDiminishedBridge, "A")).toBe("D");
    expect(contextualResolutionChord(looseDiminishedBridge, "A", "D")).toBeUndefined();
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
