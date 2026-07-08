import { describe, expect, it } from "vitest";
import { chordPitchClasses, resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";
import { noteCoveredByChord } from "../src/utils/music/analysis/strategies/HarmonicStrategyValidator";

describe("F33 Chord Symbol Resolver", () => {
  it.each([
    ["Cmaj7", "Cmaj7", "C7M"],
    ["CM7", "Cmaj7", "C7M"],
    ["CΔ7", "Cmaj7", "C7M"],
    ["CΔ", "Cmaj7", "C7M"],
    ["C^", "Cmaj7", "C7M"],
    ["C7M", "Cmaj7", "C7M"],
    ["Cm7", "Cm7", "Cm7"],
    ["C-7", "Cm7", "Cm7"],
    ["Cmi7", "Cm7", "Cm7"],
    ["Cm9", "Cm9", "Cm9"],
    ["C-11", "Cm11", "Cm11"],
    ["Cm7(b5)", "Cm7b5", "Cm7(b5)"],
    ["Cm7b5", "Cm7b5", "Cm7(b5)"],
    ["Cø", "Cm7b5", "Cm7(b5)"],
    ["Cø7", "Cm7b5", "Cm7(b5)"],
    ["C0", "Cm7b5", "Cm7(b5)"],
    ["Cdim7", "Cdim7", "C°7"],
    ["Co7", "Cdim7", "C°7"],
    ["C°7", "Cdim7", "C°7"],
    ["Cdim", "Cdim", "C°"],
    ["Co", "Cdim", "C°"],
    ["C7alt", "C7alt", "C7alt"],
    ["Calt", "C7alt", "C7alt"],
    ["C7(b9)", "C7(b9)", "C7(b9)"],
    ["C7b9", "C7(b9)", "C7(b9)"],
    ["C7(#9,b13)", "C7(#9,b13)", "C7(#9,b13)"],
    ["C7(b13,#9)", "C7(#9,b13)", "C7(#9,b13)"],
    ["Csus", "Csus4", "Csus4"],
    ["C7sus", "C7sus4", "C7sus4"],
    ["C7sus4", "C7sus4", "C7sus4"],
    ["C9sus", "C9sus4", "C9sus4"],
    ["Csus4(7)", "C7sus4", "C7sus4"],
    ["Csus4(7,9)", "C9sus4", "C9sus4"],
    ["Csus4(7,9,11,13)", "C13sus4", "C13sus4"],
    ["C(add9)(b7)", "C9", "C9"],
    ["C(#11)", "Cmaj7(#11)", "C7M(#11)"],
    ["C/E", "C/E", "C/E"],
    ["Dm7/G", "Dm7/G", "Dm7/G"],
    ["N.C.", "N.C.", "N.C."]
  ])("normalizes %s to %s and renders br display %s", (raw, normalized, displayBr) => {
    const resolved = resolveChordSymbol(raw, "br");

    expect(resolved.normalized).toBe(normalized);
    expect(resolved.display).toBe(displayBr);
  });

  it("resolves pitch classes for aliases Tonal does not parse directly", () => {
    expect(chordPitchClasses("C")).toEqual(["C", "E", "G"]);
    expect(chordPitchClasses("Cm")).toEqual(["C", "Eb", "G"]);
    expect(chordPitchClasses("Cm9")).toEqual(["C", "Eb", "G", "Bb", "D"]);
    expect(chordPitchClasses("Cm11")).toEqual(["C", "Eb", "G", "Bb", "D", "F"]);
    expect(chordPitchClasses("Bm7(b5)")).toEqual(["B", "D", "F", "A"]);
    expect(noteCoveredByChord("F", "Bm7(b5)")).toBe(true);
    expect(noteCoveredByChord("A", "Bø")).toBe(true);
  });

  it("keeps dangerous 7+ ambiguity profile-aware", () => {
    const br = resolveChordSymbol("C7+", "br");
    const ireal = resolveChordSymbol("C7+", "ireal");

    expect(br.normalized).toBe("Cmaj7");
    expect(br.confidence).toBe("legacy");
    expect(br.warnings.length).toBeGreaterThan(0);
    expect(ireal.normalized).toBe("C7(#5)");
  });
});
