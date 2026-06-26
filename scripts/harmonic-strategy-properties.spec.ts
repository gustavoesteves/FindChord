import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import {
  analyzeHarmonicStrategy,
  validateHarmonicStrategy,
  type HarmonizationCandidate
} from "../src/utils/music/analysis/strategies/HarmonicStrategyValidator";

const almadaMelody: MelodicAnchor[] = [
  { measureIndex: 1, pitch: "C", duration: 2 },
  { measureIndex: 1, pitch: "E", duration: 2 },
  { measureIndex: 2, pitch: "A", duration: 2 },
  { measureIndex: 2, pitch: "C", duration: 2 },
  { measureIndex: 3, pitch: "B", duration: 4 },
  { measureIndex: 4, pitch: "G", duration: 4 }
];

describe("F26.3 Harmonic Strategy Property Tests", () => {
  it("accepts basic I-IV-V harmonization by properties, not by a memorized melody", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "I_IV_V",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["G"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate, {
      strategy: "I_IV_V",
      backbone: ["T", "PD", "D", "T"],
      requiredExpansions: ["CADENTIAL_RESOLUTION"],
      melodyCoverage: 1.0,
      functionalEscapes: 0,
      minChordCount: 4,
      maxChordCount: 4
    });

    expect(validation.accepted).toBe(true);
    expect(validation.report.bassMotionProfile).toMatch(/ASCENDING|MIXED/);
  });

  it("accepts diatonic functional expansion when secondary representatives preserve function", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C", "Em"] },
        { measureIndex: 2, chords: ["Dm", "Dm/C"] },
        { measureIndex: 3, chords: ["Bm7b5", "G7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate, {
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      backbone: ["T", "PD", "D", "T"],
      requiredExpansions: ["PROLONG_VIA_SECONDARY", "SUSTAIN", "PREPARE_NEXT_REGION", "CADENTIAL_RESOLUTION"],
      melodyCoverage: 1.0,
      functionalEscapes: 0,
      minChordCount: 6,
      maxChordCount: 8
    });

    expect(validation.accepted).toBe(true);
    expect(validation.report.bassMotionProfile).toMatch(/DESCENDING|MIXED/);
  });

  it("rejects a harmonization that covers notes but escapes the functional strategy", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["Ab7"] },
        { measureIndex: 3, chords: ["Db7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const report = analyzeHarmonicStrategy(candidate);

    expect(report.melodyCoverage).toBeGreaterThan(0);
    expect(report.functionalEscapes).toBeGreaterThan(0);
    expect(report.backbone).not.toEqual(["T", "PD", "D", "T"]);
  });

  it("does not count supported apparent-function substitutions as functional escapes", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F#m7(b5)", "F"] },
        { measureIndex: 3, chords: ["G7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const report = analyzeHarmonicStrategy(candidate);

    expect(report.invalidChromaticEscapes).toBe(0);
    expect(report.functionalEscapes).toBe(0);
  });

  it("still counts unresolved apparent chords as functional escapes", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["Dbsus4"] },
        { measureIndex: 3, chords: ["Am"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const report = analyzeHarmonicStrategy(candidate);

    expect(report.invalidChromaticEscapes).toBeGreaterThan(0);
    expect(report.functionalEscapes).toBeGreaterThan(0);
  });

  it("accepts resolved secondary dominant excursions without counting them as functional escapes", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "DOMINANTES_SECUNDARIAS",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C", "E7", "Am"] },
        { measureIndex: 2, chords: ["A7", "Dm", "Dm/C"] },
        { measureIndex: 3, chords: ["D7", "G7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(true);
    expect(validation.report.secondaryDominantExcursions).toBe(3);
    expect(validation.report.unresolvedSecondaryDominants).toBe(0);
    expect(validation.report.invalidChromaticEscapes).toBe(0);
    expect(validation.report.functionalEscapes).toBe(0);
    expect(validation.report.expansions).toContain("SECONDARY_DOMINANT_RESOLUTION");
  });

  it("rejects unresolved or wrongly resolved secondary dominants", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "DOMINANTES_SECUNDARIAS",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C", "E7", "Am"] },
        { measureIndex: 2, chords: ["A7", "F"] },
        { measureIndex: 3, chords: ["D7", "C"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(false);
    expect(validation.report.secondaryDominantExcursions).toBe(3);
    expect(validation.report.unresolvedSecondaryDominants).toBe(2);
    expect(validation.failures).toContain("unresolved-secondary-dominant");
  });

  it("accepts passing diminished excursions when they resolve by semitone into a functional target", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "DIMINUTO_PASSAGEM",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C", "Am"] },
        { measureIndex: 2, chords: ["Edim", "F", "F/C"] },
        { measureIndex: 3, chords: ["Bm7b5", "F#dim", "G7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(true);
    expect(validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(validation.report.diminishedPassingExcursions).toBe(2);
    expect(validation.report.unresolvedDiminishedPassings).toBe(0);
    expect(validation.report.invalidChromaticEscapes).toBe(0);
    expect(validation.report.functionalEscapes).toBe(0);
    expect(validation.report.expansions).toContain("DIMINISHED_PASSING_RESOLUTION");
  });

  it("rejects passing diminished chords that do not resolve into the next functional target", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "DIMINUTO_PASSAGEM",
      center: "C",
      melody: almadaMelody,
      measures: [
        { measureIndex: 1, chords: ["C", "Am"] },
        { measureIndex: 2, chords: ["Edim", "Dm", "F/C"] },
        { measureIndex: 3, chords: ["Bm7b5", "G#dim", "G7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(false);
    expect(validation.report.diminishedPassingExcursions).toBe(2);
    expect(validation.report.unresolvedDiminishedPassings).toBe(2);
    expect(validation.failures).toContain("unresolved-diminished-passing");
  });
});

describe("F26.4 Strategy-Guided Harmonizer Integration", () => {
  it("generates and externally validates an I-IV-V proposal", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(almadaMelody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("I_IV_V", almadaMelody, phraseContext);

    expect(attempt.validation.accepted).toBe(true);
    expect(attempt.validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(attempt.validation.report.functionalEscapes).toBe(0);
    expect(attempt.validation.report.chordCount).toBe(4);
    expect(attempt.proposal).not.toBeNull();
  });

  it("generates and externally validates a diatonic functional expansion proposal", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(almadaMelody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("EXPANSAO_FUNCIONAL_DIATONICA", almadaMelody, phraseContext);

    expect(attempt.validation.accepted).toBe(true);
    expect(attempt.validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(attempt.validation.report.expansions).toEqual(
      expect.arrayContaining(["PROLONG_VIA_SECONDARY", "SUSTAIN", "PREPARE_NEXT_REGION", "CADENTIAL_RESOLUTION"])
    );
    expect(attempt.validation.report.functionalEscapes).toBe(0);
    expect(attempt.validation.report.chordCount).toBeGreaterThanOrEqual(6);
    expect(attempt.validation.report.chordCount).toBeLessThanOrEqual(8);
    expect(attempt.proposal).not.toBeNull();
  });

  it("generates and externally validates a secondary dominant strategy proposal", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(almadaMelody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("DOMINANTES_SECUNDARIAS", almadaMelody, phraseContext);

    expect(attempt.validation.accepted).toBe(true);
    expect(attempt.validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(attempt.validation.report.secondaryDominantExcursions).toBeGreaterThan(0);
    expect(attempt.validation.report.unresolvedSecondaryDominants).toBe(0);
    expect(attempt.validation.report.invalidChromaticEscapes).toBe(0);
    expect(attempt.validation.report.chordCount).toBeGreaterThanOrEqual(6);
    expect(attempt.validation.report.chordCount).toBeLessThanOrEqual(9);
    expect(attempt.proposal?.name).toBe("Estratégia — Dominantes secundárias");
  });

  it("generates and externally validates a passing diminished strategy proposal", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(almadaMelody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("DIMINUTO_PASSAGEM", almadaMelody, phraseContext);

    expect(attempt.validation.accepted).toBe(true);
    expect(attempt.validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(attempt.validation.report.diminishedPassingExcursions).toBeGreaterThan(0);
    expect(attempt.validation.report.unresolvedDiminishedPassings).toBe(0);
    expect(attempt.validation.report.invalidChromaticEscapes).toBe(0);
    expect(attempt.validation.report.chordCount).toBeGreaterThanOrEqual(6);
    expect(attempt.validation.report.chordCount).toBeLessThanOrEqual(10);
    expect(attempt.proposal?.name).toBe("Estratégia — Diminutos de passagem");
  });
});
