import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

function anchor(measureIndex: number, pitch: string): MelodicAnchor {
  return {
    measureIndex,
    pitch,
    duration: 960
  };
}

describe("Modal borrowing strategy", () => {
  it("creates a controlled iv minor borrowing when the melody exposes b6 in major", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "F"),
      anchor(2, "Ab"),
      anchor(2, "C"),
      anchor(3, "G"),
      anchor(3, "B"),
      anchor(4, "C")
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Empréstimo modal");
    const chords = proposal?.measures.flatMap(measure => measure.chords);

    expect(proposal?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("Fm");
    expect(proposal?.explanation).toEqual(expect.arrayContaining([
      "usa iv menor como cor do modo paralelo",
      "a melodia traz b6 como assinatura do empréstimo modal"
    ]));
  });

  it("does not create modal borrowing without the borrowed b6 color", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "F"),
      anchor(2, "A"),
      anchor(2, "C"),
      anchor(3, "G"),
      anchor(3, "B"),
      anchor(4, "C")
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);

    expect(proposals.some(proposal => proposal.name === "Estratégia — Empréstimo modal")).toBe(false);
  });
});
