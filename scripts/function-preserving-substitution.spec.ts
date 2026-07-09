import { describe, expect, it } from "vitest";
import { validateFunctionPreservingSubstitution } from "../src/utils/music/analysis/strategies/FunctionPreservingSubstitution";
import { classifyFunctionInMode } from "../src/utils/music/analysis/strategies/HarmonicStrategyValidator";

describe("F26.10b Function-Preserving Substitution Validation", () => {
  it("accepts an apparent-function substitute when it preserves the local function and melody", () => {
    const validation = validateFunctionPreservingSubstitution({
      center: "C",
      originalChord: "Fmaj7",
      substituteChord: "F#m7(b5)",
      previousChord: "Cmaj7",
      nextChord: "Fmaj7",
      melodyPitches: ["A", "C"],
      expectedBackboneFunction: "PD"
    });

    expect(validation.accepted).toBe(true);
    expect(validation.originalFunction).toBe("PD");
    expect(validation.impliedFunction).toBe("PD");
    expect(validation.apparentFunction?.apparentType).toBe("SHARP_IV_M7B5");
    expect(validation.failures).toHaveLength(0);
    expect(validation.evidence).toEqual(expect.arrayContaining([
      "acorde aparente implica Fmaj7",
      "preserva função PD",
      "substituto cobre as notas melódicas exigidas"
    ]));
  });

  it("rejects a substitution that changes the macro function", () => {
    const validation = validateFunctionPreservingSubstitution({
      center: "C",
      originalChord: "Fmaj7",
      substituteChord: "G7",
      previousChord: "Cmaj7",
      nextChord: "Cmaj7",
      melodyPitches: ["B"],
      expectedBackboneFunction: "PD"
    });

    expect(validation.accepted).toBe(false);
    expect(validation.failures).toContain("function-changed");
  });

  it("rejects a function-preserving substitute when it no longer covers the melody", () => {
    const validation = validateFunctionPreservingSubstitution({
      center: "C",
      originalChord: "Fmaj7",
      substituteChord: "F#m7(b5)",
      previousChord: "Cmaj7",
      nextChord: "Fmaj7",
      melodyPitches: ["G"],
      expectedBackboneFunction: "PD"
    });

    expect(validation.accepted).toBe(false);
    expect(validation.failures).toContain("melody-compatibility");
  });

  it("rejects unresolved apparent chords instead of excusing them as substitutions", () => {
    const validation = validateFunctionPreservingSubstitution({
      center: "C",
      originalChord: "Fmaj7",
      substituteChord: "Dbsus4",
      previousChord: "Cmaj7",
      nextChord: "Am7",
      melodyPitches: ["Gb"],
      expectedBackboneFunction: "PD"
    });

    expect(validation.accepted).toBe(false);
    expect(validation.failures).toEqual(expect.arrayContaining([
      "substitute-function-unknown",
      "apparent-function-unresolved"
    ]));
  });

  it("accepts a diatonic tonic substitute when it preserves function and melody", () => {
    const validation = validateFunctionPreservingSubstitution({
      center: "C",
      originalChord: "Cmaj7",
      substituteChord: "Am",
      previousChord: "G7",
      nextChord: "Fmaj7",
      melodyPitches: ["A", "C"],
      expectedBackboneFunction: "T"
    });

    expect(validation.accepted).toBe(true);
    expect(validation.impliedFunction).toBe("T");
    expect(validation.evidence).toContain("preserva função T");
  });

  it("accepts a resolved SubV7 as dominant-preserving substitution", () => {
    const validation = validateFunctionPreservingSubstitution({
      center: "C",
      originalChord: "G7",
      substituteChord: "Db7",
      previousChord: "Fmaj7",
      nextChord: "Cmaj7",
      melodyPitches: ["F", "Ab"],
      expectedBackboneFunction: "D"
    });

    expect(validation.accepted).toBe(true);
    expect(validation.impliedFunction).toBe("D");
    expect(validation.evidence).toEqual(expect.arrayContaining([
      "SubV7 resolve cromaticamente no centro tonal",
      "preserva função D"
    ]));
  });

  it("classifies minor-functional bIII, iiø and V7b13 by function", () => {
    expect(classifyFunctionInMode("C", "A", "minor-functional")).toBe("T");
    expect(classifyFunctionInMode("Bm7(b5)", "A", "minor-functional")).toBe("PD");
    expect(classifyFunctionInMode("E7b13", "A", "minor-functional")).toBe("D");
  });

  it("accepts minor-functional substitutes when requested explicitly", () => {
    const tonic = validateFunctionPreservingSubstitution({
      center: "A",
      originalChord: "Am",
      substituteChord: "C",
      previousChord: "E7",
      nextChord: "Dm",
      melodyPitches: ["C", "E"],
      expectedBackboneFunction: "T",
      classificationMode: "minor-functional"
    });
    const predominant = validateFunctionPreservingSubstitution({
      center: "A",
      originalChord: "Dm",
      substituteChord: "Bm7(b5)",
      previousChord: "Am",
      nextChord: "E7",
      melodyPitches: ["B", "D"],
      expectedBackboneFunction: "PD",
      classificationMode: "minor-functional"
    });
    const dominant = validateFunctionPreservingSubstitution({
      center: "A",
      originalChord: "E7",
      substituteChord: "E7b13",
      previousChord: "Bm7(b5)",
      nextChord: "Am",
      melodyPitches: ["E", "G#"],
      expectedBackboneFunction: "D",
      classificationMode: "minor-functional"
    });

    expect(tonic.accepted).toBe(true);
    expect(predominant.accepted).toBe(true);
    expect(dominant.accepted).toBe(true);
  });
});
