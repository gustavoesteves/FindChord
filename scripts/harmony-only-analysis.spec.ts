import { describe, expect, it } from "vitest";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import {
  buildHarmonyOnlyAnalysisProposals,
  buildHarmonyOnlyPhraseContext,
  buildSectionMaterialSuggestions
} from "../src/domains/harmonizer/services/harmonizerService";

function harmonies(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map((harmony, index) => ({
    measure: index + 1,
    beat: 1,
    harmony,
    tickStart: index * 1920,
    tickEnd: (index + 1) * 1920,
    durationTicks: 1920
  }));
}

describe("Harmony-only analysis", () => {
  it("builds functional context and readings from chords without melodic anchors", () => {
    const sectionHarmonies = harmonies(["C", "Am", "Dm7", "G7", "C"]);
    const phraseContext = buildHarmonyOnlyPhraseContext(sectionHarmonies);
    const proposals = buildHarmonyOnlyAnalysisProposals(sectionHarmonies, phraseContext);

    expect(phraseContext).toEqual(expect.objectContaining({
      selectedCenter: expect.objectContaining({
        tonic: "C",
        mode: "major"
      }),
      selectedCenterSource: "reference",
      cadentialTarget: expect.objectContaining({
        targetPitch: "C"
      })
    }));
    expect(proposals).toHaveLength(2);
    expect(proposals[0]).toEqual(expect.objectContaining({
      id: "harmony-only-functional-reading",
      name: "Leitura — Função da progressão",
      ruleIds: ["FC-RULE-HARMONY-ONLY-FUNCTIONAL-READING"],
      inputContext: "harmony-only-analysis",
      referenceRelation: "harmony-only-reading",
      cadentialTarget: "C"
    }));
    expect(proposals[0].explanation.join(" ")).toContain("sem validação melódica");
    expect(proposals[1]).toEqual(expect.objectContaining({
      id: "harmony-only-diatonic-color",
      name: "Variação — Cores diatônicas da progressão",
      ruleIds: ["FC-RULE-HARMONY-ONLY-DIATONIC-COLOR"],
      inputContext: "harmony-only-analysis",
      referenceRelation: "harmony-only-function-preserving-color",
      cadentialTarget: "C"
    }));
    expect(proposals[1].measures.flatMap(measure => measure.chords)).toEqual([
      "Cmaj7",
      "Am7",
      "Dm7",
      "G7",
      "Cmaj7"
    ]);
    expect(proposals[1].bassLine).toEqual(["C", "A", "D", "G", "C"]);
    expect(proposals[1].events?.[0]).toEqual(expect.objectContaining({
      chord: "Cmaj7",
      originalChord: "C"
    }));
    expect(proposals[1].explanation.join(" ")).toContain("sem validação melódica");
  });

  it("offers contextual materials from the reference harmony even without melody", () => {
    const sectionHarmonies = harmonies(["C", "Am", "Dm7", "G7", "C"]);
    const phraseContext = buildHarmonyOnlyPhraseContext(sectionHarmonies);
    const suggestions = buildSectionMaterialSuggestions(sectionHarmonies, [], phraseContext);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toEqual(expect.objectContaining({
      source: "reference",
      candidates: expect.any(Array)
    }));
    expect(suggestions.flatMap(suggestion => suggestion.candidates).length).toBeGreaterThan(0);
  });

  it("keeps a harmony-only final dominant as a half cadence", () => {
    const phraseContext = buildHarmonyOnlyPhraseContext(harmonies(["C", "F", "G7"]));
    const proposals = buildHarmonyOnlyAnalysisProposals(harmonies(["C", "F", "G7"]), phraseContext);

    expect(phraseContext).toEqual(expect.objectContaining({
      selectedCenter: expect.objectContaining({
        tonic: "C",
        mode: "major"
      }),
      selectedCenterSource: "reference",
      cadentialTarget: {
        targetPitch: "C",
        cadenceType: "HALF",
        confidence: 0.76
      }
    }));
    expect(proposals[0]?.cadentialTarget).toBe("C");
  });

  it("keeps a harmony-only final IV-I as a plagal cadence", () => {
    const phraseContext = buildHarmonyOnlyPhraseContext(harmonies(["C", "F", "C"]));

    expect(phraseContext?.cadentialTarget).toEqual({
      targetPitch: "C",
      cadenceType: "PLAGAL",
      confidence: 0.88
    });
  });
});
