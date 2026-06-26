import { describe, expect, it } from "vitest";
import { validateFunctionPreservingSubstitution } from "../src/utils/music/analysis/strategies/FunctionPreservingSubstitution";

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
});
