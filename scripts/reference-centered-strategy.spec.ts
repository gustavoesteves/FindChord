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

function referenceMinorContext(center: string): PhraseContext {
  return {
    selectedCenter: { tonic: center, mode: "minor", confidence: 0.82 },
    selectedCenterSource: "reference",
    selectedCenterEvidence: [`repousos recorrentes sustentam ${center} menor`],
    tonalCenterCandidates: [{ tonic: center, mode: "minor", confidence: 0.82 }],
    cadentialTarget: { targetPitch: center, cadenceType: "AUTHENTIC", confidence: 0.8 }
  };
}

describe("Reference-centered strategy", () => {
  it("colors minor tonic with m7 or m6 when the melody exposes those tones", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "A"),
      anchor(2, "G"),
      anchor(3, "F#"),
      anchor(4, "A")
    ];

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, referenceMinorContext("A"))
      .find(candidate => candidate.name === "Estratégia — Centro de referência");

    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual([
      "Am",
      "Am7",
      "Am6",
      "Am"
    ]);
    expect(proposal?.cadentialTarget).toBe("A");
  });
});
