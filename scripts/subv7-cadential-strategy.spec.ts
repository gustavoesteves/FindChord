import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import { auditAlmadaExample } from "./audit-almada-example";
import {
  analyzeHarmonicStrategy,
  validateHarmonicStrategy,
  type HarmonizationCandidate
} from "../src/utils/music/analysis/strategies/HarmonicStrategyValidator";

const subv7FriendlyMelody: MelodicAnchor[] = [
  { measureIndex: 1, pitch: "C", duration: 960 },
  { measureIndex: 1, pitch: "E", duration: 960 },
  { measureIndex: 2, pitch: "F", duration: 960 },
  { measureIndex: 2, pitch: "A", duration: 960 },
  { measureIndex: 3, pitch: "G", duration: 1200 },
  { measureIndex: 3, pitch: "F", duration: 960 },
  { measureIndex: 3, pitch: "Ab", duration: 960 },
  { measureIndex: 4, pitch: "C", duration: 1920 }
];

const iiSubV7FriendlyMelody: MelodicAnchor[] = [
  { measureIndex: 1, pitch: "C", duration: 960 },
  { measureIndex: 1, pitch: "E", duration: 960 },
  { measureIndex: 2, pitch: "F", duration: 960 },
  { measureIndex: 2, pitch: "A", duration: 960 },
  { measureIndex: 3, pitch: "G", duration: 1440 },
  { measureIndex: 3, pitch: "Ab", duration: 960 },
  { measureIndex: 3, pitch: "Eb", duration: 960 },
  { measureIndex: 3, pitch: "F", duration: 960 },
  { measureIndex: 4, pitch: "C", duration: 1920 }
];

describe("F29 Cadential SubV7 Strategy", () => {
  it("accepts a tritone substitute that resolves chromatically into the cadential target", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "SUBV7_CADENCIAL",
      center: "C",
      melody: subv7FriendlyMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["Db7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect({
      accepted: validation.accepted,
      failures: validation.failures,
      report: validation.report
    }).toMatchObject({
      accepted: true
    });
    expect(validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(validation.report.subV7Excursions).toBe(1);
    expect(validation.report.unresolvedSubV7s).toBe(0);
    expect(validation.report.invalidChromaticEscapes).toBe(0);
    expect(validation.report.expansions).toEqual(expect.arrayContaining([
      "TRITONE_SUBSTITUTION_RESOLUTION",
      "CADENTIAL_RESOLUTION"
    ]));
  });

  it("rejects a tritone substitute without chromatic resolution", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "SUBV7_CADENCIAL",
      center: "C",
      melody: subv7FriendlyMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["Db7"] },
        { measureIndex: 4, chords: ["G"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);
    const report = analyzeHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(false);
    expect(report.unresolvedSubV7s).toBe(1);
    expect(validation.failures).toContain("unresolved-subv7");
  });

  it("generates a SubV7 proposal only when the melody is compatible with the substitute", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(subv7FriendlyMelody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("SUBV7_CADENCIAL", subv7FriendlyMelody, phraseContext);

    expect({
      accepted: attempt.validation.accepted,
      failures: attempt.validation.failures,
      report: attempt.validation.report,
      measures: attempt.candidate.measures
    }).toMatchObject({
      accepted: true
    });
    expect(attempt.proposal?.measures.map(measure => measure.chords[0])).toEqual(["C", "F", "Db7", "C"]);
    expect(attempt.proposal?.explanation).toEqual(expect.arrayContaining([
      "substitui a dominante cadencial por SubV7 com resolução cromática",
      "substitui a dominante por trítono com resolução cromática"
    ]));
  });

  it("does not accept SubV7 when the substitute fails melodic coverage", () => {
    const melody: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(melody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("SUBV7_CADENCIAL", melody, phraseContext);

    expect(attempt.validation.accepted).toBe(false);
    expect(attempt.proposal).toBeNull();
    expect(attempt.validation.failures).toContain("melody-coverage");
  });

  it("accepts ii-subV7 when the chromatic ii prepares a resolved SubV7", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "II_SUBV7_CADENCIAL",
      center: "C",
      melody: iiSubV7FriendlyMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["Abm7", "Db7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(true);
    expect(validation.report.backbone).toEqual(["T", "PD", "D", "T"]);
    expect(validation.report.iiSubV7Preparations).toBe(1);
    expect(validation.report.unresolvedIiSubV7s).toBe(0);
    expect(validation.report.subV7Excursions).toBe(1);
    expect(validation.report.expansions).toEqual(expect.arrayContaining([
      "II_SUBV7_PREPARATION",
      "TRITONE_SUBSTITUTION_RESOLUTION"
    ]));
  });

  it("rejects chromatic ii-subV7 preparation without a resolved SubV7", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "II_SUBV7_CADENCIAL",
      center: "C",
      melody: iiSubV7FriendlyMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["Abm7", "G7"] },
        { measureIndex: 4, chords: ["C"] }
      ]
    };

    const validation = validateHarmonicStrategy(candidate);

    expect(validation.accepted).toBe(false);
    expect(validation.report.unresolvedIiSubV7s).toBe(1);
    expect(validation.failures).toContain("unresolved-ii-subv7");
  });

  it("generates ii-subV7 only when melody covers the chromatic preparation and substitute", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(iiSubV7FriendlyMelody, "C");
    const attempt = StrategyGuidedHarmonizer.tryStrategy("II_SUBV7_CADENCIAL", iiSubV7FriendlyMelody, phraseContext);

    expect(attempt.validation.accepted).toBe(true);
    expect(attempt.proposal?.measures.map(measure => measure.chords)).toEqual([
      ["C"],
      ["F"],
      ["Abm7", "Db7"],
      ["C"]
    ]);
    expect(attempt.proposal?.explanation).toEqual(expect.arrayContaining([
      "prepara o SubV7 com ii cromático relacionado",
      "encadeia ii cromático diretamente ao SubV7"
    ]));
  });

  it("recognizes secondary SubV resolutions for diatonic targets", () => {
    const candidate: HarmonizationCandidate = {
      strategy: "SUBV7_CADENCIAL",
      center: "C",
      melody: subv7FriendlyMelody,
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["Gb7", "F"] },
        { measureIndex: 3, chords: ["Ab7", "G7"] },
        { measureIndex: 4, chords: ["Db7", "C"] }
      ]
    };

    const report = analyzeHarmonicStrategy(candidate);

    expect(report.subV7Excursions).toBe(3);
    expect(report.unresolvedSubV7s).toBe(0);
    expect(report.invalidChromaticEscapes).toBe(0);
    expect(report.expansions).toContain("TRITONE_SUBSTITUTION_RESOLUTION");
  });

  it("generates functional SubV as an Almada-oriented reharmonization alternative", () => {
    const { generated } = auditAlmadaExample();
    const primary = generated.find(proposal => proposal.role === "primary");
    const subv = generated.find(proposal => proposal.name === "Estratégia — SubV funcional");
    const chords = subv?.chords.join(" / ") || "";

    expect(primary?.name).toBe("Estratégia — Tonal Clássico");
    expect(subv?.role).toBe("adventurous");
    expect(chords).toContain("Gb7");
    expect(chords).toContain("Ab7");
    expect(chords).toContain("Db7");
    expect(subv?.explanation).toEqual(expect.arrayContaining([
      expect.stringContaining("prepara graus diatônicos por SubV"),
      "resolve cada SubV por semitom descendente no acorde-alvo"
    ]));
  });
});
