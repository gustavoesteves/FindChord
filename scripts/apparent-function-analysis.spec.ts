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
      apparentRole: "SUS_SUBDOMINANT",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedChordSymbols: ["Dm7/G"],
      shouldCountAsFunctionalEscape: false
    }));
    expect(dominantSus).toEqual(expect.objectContaining({
      apparentType: "SUS",
      apparentRole: "SUS_DOMINANT",
      apparentFunction: "D",
      impliedFunction: "D",
      impliedChordSymbols: ["G7"],
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
      impliedChordSymbols: ["Dm7/G"],
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("classifies sus(b9) as a minor-context subdominant apparent chord before a dominant", () => {
    const minorPredominantSus = analyzeApparentFunction("Gsus(b9)", {
      center: "C",
      previousChord: "Cm7",
      nextChord: "G7(b9)"
    });

    expect(minorPredominantSus).toEqual(expect.objectContaining({
      apparentType: "SUS",
      apparentRole: "SUS_SUBDOMINANT_MINOR",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedChordSymbols: ["Dm7b5/G"],
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
      apparentRole: "DIMINISHED_DOMINANT",
      apparentFunction: "D",
      impliedFunction: "D",
      impliedChordSymbols: ["G7(b9)"],
      shouldCountAsFunctionalEscape: false
    }));
    expect(dominantDim?.evidence).toContain("diminuto resolve meio tom acima");
    expect(chromaticDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      apparentRole: "DIMINISHED_CHROMATIC_DESCENDING",
      apparentFunction: "CHROMATIC",
      impliedChordSymbols: [],
      shouldCountAsFunctionalEscape: false
    }));
    expect(unresolvedDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      apparentRole: "AMBIGUOUS",
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
      impliedChordSymbols: ["G7(b9)"],
      shouldCountAsFunctionalEscape: false
    }));
  });

  it("classifies tonic diminished as subdominant apparent when it does not resolve by semitone", () => {
    const subdominantDim = analyzeApparentFunction("Cdim", {
      center: "C",
      previousChord: "Cmaj7",
      nextChord: "Cmaj7"
    });

    expect(subdominantDim).toEqual(expect.objectContaining({
      apparentType: "DIMINISHED",
      apparentRole: "DIMINISHED_SUBDOMINANT",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedChordSymbols: ["F7"],
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
      apparentRole: "MINOR_SIXTH_CONTEXTUAL",
      impliedFunction: "D",
      impliedChordSymbols: ["Bm7b5", "G7"],
      shouldCountAsFunctionalEscape: false
    }));
    expect(unresolvedMinorSixth).toEqual(expect.objectContaining({
      apparentType: "MINOR_SIXTH",
      apparentRole: "AMBIGUOUS",
      apparentFunction: "AMBIGUOUS",
      impliedChordSymbols: ["Bm7b5", "G7"],
      shouldCountAsFunctionalEscape: true
    }));
  });

  it("classifies Im(b6) as a subdominant apparent color in minor", () => {
    const imFlatSix = analyzeApparentFunction("Cm(b6)", {
      center: "C",
      previousChord: "Cm",
      nextChord: "G7"
    });

    expect(imFlatSix).toEqual(expect.objectContaining({
      apparentType: "IM_FLAT6",
      apparentRole: "IM_FLAT6_SUBDOMINANT",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedChordSymbols: ["Fm7", "Abmaj7"],
      shouldCountAsFunctionalEscape: false
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
      apparentRole: "SHARP_IV_PREDOMINANT",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedTarget: "Fmaj7",
      impliedChordSymbols: ["Fmaj7"],
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
