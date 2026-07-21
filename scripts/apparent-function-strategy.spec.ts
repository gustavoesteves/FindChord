import { describe, expect, it } from "vitest";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

function anchor(measureIndex: number, pitch: string): MelodicAnchor {
  return {
    measureIndex,
    pitch,
    duration: 960
  };
}

function majorContext(center: string): PhraseContext {
  return {
    selectedCenter: { tonic: center, mode: "major", confidence: 0.9 },
    selectedCenterSource: "heuristic",
    selectedCenterEvidence: [],
    tonalCenterCandidates: [{ tonic: center, mode: "major", confidence: 0.9 }],
    cadentialTarget: { targetPitch: center, cadenceType: "AUTHENTIC", confidence: 0.8 }
  };
}

describe("Apparent-function strategy", () => {
  it("creates a controlled #IVm7(b5) predominant when the melody supports IV", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "A"),
      anchor(2, "C"),
      anchor(3, "B"),
      anchor(3, "G"),
      anchor(4, "C")
    ];

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, majorContext("C"))
      .find(candidate => candidate.name === "Estratégia — Função aparente");
    const chords = proposal?.measures.flatMap(measure => measure.chords);

    expect(proposal?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("F#m7(b5)");
    expect(proposal?.explanation).toContain("acorde aparente implica Fmaj7");
    expect(proposal?.explanation).toContain("preserva função PD");
    expect(proposal?.ruleIds).toEqual(["FC-RULE-APPARENT-FUNCTION-PRESERVATION"]);
  });

  it("inserts a controlled predominant sus before the dominant when the melody supports suspension tones", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "A"),
      anchor(2, "C"),
      anchor(3, "C"),
      anchor(3, "D"),
      anchor(3, "F"),
      anchor(4, "C")
    ];

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, majorContext("C"))
      .find(candidate => candidate.measures.some(measure => measure.chords.includes("G7sus4")));
    const chords = proposal?.measures.flatMap(measure => measure.chords);

    expect(proposal?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("G7sus4");
    expect(chords).toContain("G7");
    expect(proposal?.explanation).toContain("acorde aparente implica Dm7/G");
    expect(proposal?.explanation).toContain("preserva função PD");
    expect(proposal?.ruleIds).toEqual(["FC-RULE-APPARENT-FUNCTION-PRESERVATION"]);
  });

  it("creates a controlled leading-tone diminished dominant when the melody supports the diminished chord", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "A"),
      anchor(2, "C"),
      anchor(3, "B"),
      anchor(3, "D"),
      anchor(3, "F"),
      anchor(4, "C")
    ];

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, majorContext("C"))
      .find(candidate => candidate.measures.some(measure => measure.chords.includes("Bdim")));
    const chords = proposal?.measures.flatMap(measure => measure.chords);

    expect(proposal?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("Bdim");
    expect(proposal?.explanation).toContain("acorde aparente implica G7(b9)");
    expect(proposal?.explanation).toContain("preserva função D");
    expect(proposal?.ruleIds).toEqual(["FC-RULE-APPARENT-FUNCTION-PRESERVATION"]);
  });

  it("inserts a controlled contextual m6 before the dominant when the melody supports the m6 structure", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "A"),
      anchor(2, "C"),
      anchor(3, "B"),
      anchor(3, "D"),
      anchor(3, "F"),
      anchor(3, "A"),
      anchor(4, "C")
    ];

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, majorContext("C"))
      .find(candidate => candidate.measures.some(measure => measure.chords.includes("Dm6")));
    const chords = proposal?.measures.flatMap(measure => measure.chords);

    expect(proposal?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("Dm6");
    expect(chords).toContain("G7");
    expect(proposal?.explanation).toContain("acorde aparente implica Bm7b5 ou G7");
    expect(proposal?.explanation).toContain("preserva função D");
    expect(proposal?.ruleIds).toEqual(["FC-RULE-APPARENT-FUNCTION-PRESERVATION"]);
  });
});
