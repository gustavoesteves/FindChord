import { describe, expect, it } from "vitest";
import { resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";
import {
  materialChordIdentityFromChordCandidate,
  materialChordIdentityFromResolvedSymbol,
  materialDegreeRoleFor,
  materialNoteRoleFor
} from "../src/utils/music/theory/materialChordIdentity";

function chord(partial: Partial<ChordCandidate>): ChordCandidate {
  return {
    root: "C",
    quality: "major",
    intervals: ["1P", "3M", "5P"],
    notes: ["C", "E", "G"],
    drawnNotes: ["C", "E", "G"],
    score: 1,
    confidence: 1,
    omissions: [],
    additions: [],
    notationInternational: "C",
    notationBrazilian: "C",
    notationAcademic: "C",
    isIncomplete: false,
    ...partial
  };
}

describe("F360.1 identidade harmonica de materiais", () => {
  it("preserva alteracoes compostas reconhecidas pelo resolvedor", () => {
    const identity = materialChordIdentityFromResolvedSymbol(
      resolveChordSymbol("C7(#9,b13)", "plain")
    );

    expect(identity).toMatchObject({
      origin: "symbol",
      provenance: "score-written",
      rawSymbol: "C7(#9,b13)",
      normalizedSymbol: "C7(#9,b13)",
      root: "C",
      quality: "dominant7#9",
      resolvedQuality: "7_sharp9_b13"
    });
    expect(identity?.writtenDegrees).toEqual(expect.arrayContaining(["R", "3", "5", "b7", "#9", "b13"]));
    expect(identity?.degrees.map(degree => [degree.degree, degree.role])).toEqual(expect.arrayContaining([
      ["#9", "written-tension"],
      ["b13", "written-tension"]
    ]));
    expect(materialNoteRoleFor(identity!, "D#")).toEqual({ degree: "#9", role: "written-tension" });
    expect(materialNoteRoleFor(identity!, "Ab")).toEqual({ degree: "b13", role: "written-tension" });
  });

  it("preserva b9, #11 e 13 em dominante 13 composta", () => {
    const identity = materialChordIdentityFromResolvedSymbol(
      resolveChordSymbol("C13(b9,#11)", "plain")
    );

    expect(identity).toMatchObject({
      origin: "symbol",
      quality: "dominant7b9",
      resolvedQuality: "13_b9_sharp11"
    });
    expect(identity?.writtenDegrees).toEqual(expect.arrayContaining(["b9", "#11", "13"]));
    expect(identity?.degrees.map(degree => [degree.degree, degree.role])).toEqual(expect.arrayContaining([
      ["b9", "written-tension"],
      ["#11", "written-tension"],
      ["13", "structural-support"]
    ]));
  });

  it("preserva sexta e nona escritas em acorde menor 6/9", () => {
    const identity = materialChordIdentityFromResolvedSymbol(
      resolveChordSymbol("Cm6/9", "plain")
    );

    expect(identity).toMatchObject({
      origin: "symbol",
      quality: "minor6th",
      resolvedQuality: "m6_9"
    });
    expect(identity?.writtenDegrees).toEqual(expect.arrayContaining(["6", "9"]));
    expect(materialDegreeRoleFor(identity!, "6")).toBe("structural-support");
    expect(materialDegreeRoleFor(identity!, "9")).toBe("structural-support");
  });

  it("preserva shape dominante #9 sem alegar que o grau veio escrito da partitura", () => {
    const identity = materialChordIdentityFromChordCandidate(chord({
      quality: "dominant7#9",
      intervals: ["1P", "3M", "5P", "7m", "9A"],
      notes: ["C", "E", "G", "Bb", "D#"],
      drawnNotes: ["C", "E", "Bb", "D#"],
      tensions: ["#9"],
      notationInternational: "C7#9",
      notationBrazilian: "C7(#9)",
      notationAcademic: "C7#9"
    }));

    expect(identity).toMatchObject({
      origin: "shape",
      provenance: "shape-inferred",
      quality: "dominant7#9",
      structuralNotes: ["C", "E", "G", "Bb", "D#"],
      soundingNotes: ["C", "E", "Bb", "D#"]
    });
    expect(identity.degrees.find(degree => degree.degree === "#9")).toMatchObject({
      role: "written-tension",
      written: true,
      sounding: true
    });
  });

  it("usa a formula da qualidade como estrutura quando o shape traz intervalos defasados", () => {
    const identity = materialChordIdentityFromChordCandidate(chord({
      quality: "dominant7#11",
      intervals: ["1P", "3M", "5P", "7m"],
      notes: ["C", "E", "G", "Bb", "D", "F#"],
      drawnNotes: ["C", "E", "G", "Bb", "D", "F#"],
      notationInternational: "C7#11",
      notationBrazilian: "C7(#11)",
      notationAcademic: "C7#11"
    }));

    expect(identity.structuralNotes).toEqual(["C", "E", "G", "Bb", "D", "F#"]);
    expect(identity.writtenDegrees).toEqual(expect.arrayContaining(["9", "#11"]));
    expect(identity.degrees.find(degree => degree.degree === "#11")).toMatchObject({
      role: "written-tension",
      sounding: true
    });
  });

  it("distingue alteracao estrutural de ponto estavel em shapes b5 e aumentados", () => {
    const dominantFlatFive = materialChordIdentityFromChordCandidate(chord({
      quality: "dominant7b5",
      intervals: ["1P", "3M", "5d", "7m"],
      notes: ["C", "E", "Gb", "Bb"],
      drawnNotes: ["C", "E", "Gb", "Bb"],
      notationInternational: "C7b5",
      notationBrazilian: "C7(b5)",
      notationAcademic: "C7b5"
    }));
    const augmented = materialChordIdentityFromResolvedSymbol(resolveChordSymbol("Caug", "plain"));

    expect(materialNoteRoleFor(dominantFlatFive, "Gb")).toEqual({
      degree: "b5",
      role: "voicing-alteration"
    });
    expect(materialNoteRoleFor(augmented!, "G#")).toEqual({
      degree: "#5",
      role: "structural-support"
    });
  });

  it("preserva suspensao e omissao estrutural sem transformar ausencia em cor externa", () => {
    const sus = materialChordIdentityFromResolvedSymbol(resolveChordSymbol("Csus4", "plain"));
    const incomplete = materialChordIdentityFromChordCandidate(chord({
      quality: "major7th",
      intervals: ["1P", "3M", "5P", "7M"],
      notes: ["C", "E", "B"],
      drawnNotes: ["C", "E", "B"],
      omissions: ["5"],
      notationInternational: "Cmaj7(no5)",
      notationBrazilian: "C7M(no5)",
      notationAcademic: "CΔ7(no5)",
      isIncomplete: true
    }));

    expect(materialNoteRoleFor(sus!, "F")).toEqual({
      degree: "4",
      role: "structural-support"
    });
    expect(incomplete.degrees.find(degree => degree.degree === "5")).toMatchObject({
      role: "structural-support",
      sounding: false
    });
    expect(incomplete.omissions).toEqual(["5"]);
  });
});
