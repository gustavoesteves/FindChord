import { describe, expect, it } from "vitest";
import { analyzeApparentFunction } from "../src/utils/music/analysis/strategies/ApparentFunctionAnalysis";

describe("F26.10a Apparent Function Analysis", () => {
  it("classifies sus chords by context instead of treating every sus as dominant", () => {
    const predominantSus = analyzeApparentFunction("Gsus4", {
      center: "C",
      previousChord: "Dm7",
      nextChord: "G7"
    });
    const dominantSus = analyzeApparentFunction("Gsus4", {
      center: "C",
      previousChord: "Dm7",
      nextChord: "Cmaj7"
    });

    expect(predominantSus).toEqual(expect.objectContaining({
      apparentType: "SUS",
      apparentFunction: "PD",
      impliedFunction: "PD",
      shouldCountAsFunctionalEscape: false
    }));
    expect(dominantSus).toEqual(expect.objectContaining({
      apparentType: "SUS",
      apparentFunction: "D",
      impliedFunction: "D",
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("classifies sus aliases through the chord symbol resolver", () => {
    const predominantSus = analyzeApparentFunction("G7sus", {
      center: "C",
      previousChord: "Dm7",
      nextChord: "G7alt"
    });

    expect(predominantSus).toEqual(expect.objectContaining({
      apparentType: "SUS",
      apparentFunction: "PD",
      impliedFunction: "PD",
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("classifies diminished chords as dominant-like, chromatic, or unresolved by resolution", () => {
    const dominantDim = analyzeApparentFunction("Bdim", {
      center: "C",
      previousChord: "Dm7",
      nextChord: "Cmaj7"
    });
    const chromaticDim = analyzeApparentFunction("Ebdim", {
      center: "C",
      previousChord: "Em7",
      nextChord: "Dm7"
    });
    const unresolvedDim = analyzeApparentFunction("Fdim", {
      center: "C",
      previousChord: "Cmaj7",
      nextChord: "Am7"
    });

    expect(dominantDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      shouldCountAsFunctionalEscape: false
    }));
    expect(dominantDim?.evidence).toContain("diminuto resolve meio tom acima");
    expect(chromaticDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      apparentFunction: "CHROMATIC",
      shouldCountAsFunctionalEscape: false
    }));
    expect(unresolvedDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      apparentFunction: "AMBIGUOUS",
      shouldCountAsFunctionalEscape: true
    }));
  });

  it("classifies diminished aliases through the chord symbol resolver", () => {
    const dominantDim = analyzeApparentFunction("B°", {
      center: "C",
      previousChord: "Dm7",
      nextChord: "C7M"
    });

    expect(dominantDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("classifies m6 only when the context supports an implied function", () => {
    const directedMinorSixth = analyzeApparentFunction("Dm6", {
      center: "C",
      previousChord: "Dm7",
      nextChord: "G7"
    });
    const unresolvedMinorSixth = analyzeApparentFunction("Dm6", {
      center: "C",
      previousChord: "Cmaj7",
      nextChord: "Am7"
    });

    expect(directedMinorSixth).toEqual(expect.objectContaining({
      apparentType: "MINOR_SIXTH",
      impliedFunction: "D",
      shouldCountAsFunctionalEscape: false
    }));
    expect(unresolvedMinorSixth).toEqual(expect.objectContaining({
      apparentType: "MINOR_SIXTH",
      apparentFunction: "AMBIGUOUS",
      shouldCountAsFunctionalEscape: true
    }));
  });

  it("treats #IVm7(b5) as predominance-preserving instead of a chromatic escape", () => {
    const sharpIv = analyzeApparentFunction("F#m7(b5)", {
      center: "C",
      previousChord: "Cmaj7",
      nextChord: "Fmaj7"
    });

    expect(sharpIv).toEqual(expect.objectContaining({
      apparentType: "SHARP_IV_M7B5",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedTarget: "Fmaj7",
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("treats #IV half-diminished aliases as predominance-preserving", () => {
    const sharpIv = analyzeApparentFunction("F#ø", {
      center: "C",
      previousChord: "C7M",
      nextChord: "F7M"
    });

    expect(sharpIv).toEqual(expect.objectContaining({
      apparentType: "SHARP_IV_M7B5",
      apparentFunction: "PD",
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("does not excuse apparent chords when the context is unresolved", () => {
    const ambiguousSus = analyzeApparentFunction("Csus4", {
      center: "C",
      previousChord: "Fmaj7",
      nextChord: "Am7"
    });

    expect(ambiguousSus).toEqual(expect.objectContaining({
      apparentFunction: "AMBIGUOUS",
      shouldCountAsFunctionalEscape: true
    }));
  });
});
