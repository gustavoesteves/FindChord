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

  it("creates a controlled bVII borrowing when the melody exposes flat seven in a subdominant region", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "Bb"),
      anchor(2, "D"),
      anchor(2, "F"),
      anchor(3, "G"),
      anchor(3, "B"),
      anchor(4, "C")
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);
    const borrowedFlatSeven = proposals.find(candidate => (
      candidate.name === "Estratégia — Empréstimo modal"
      && candidate.measures.some(measure => measure.chords.some(chord => chord.startsWith("Bb")))
    ));
    const chords = borrowedFlatSeven?.measures.flatMap(measure => measure.chords);

    expect(borrowedFlatSeven?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("Bb");
    expect(borrowedFlatSeven?.explanation).toEqual(expect.arrayContaining([
      "usa bVII como cor do modo paralelo menor",
      "preserva a região subdominante sem trocar automaticamente o centro tonal"
    ]));
  });

  it("creates a controlled bVI borrowing when the melody exposes flat six as a structural color", () => {
    const anchors: MelodicAnchor[] = [
      anchor(1, "C"),
      anchor(1, "E"),
      anchor(2, "Ab"),
      anchor(2, "C"),
      anchor(2, "Eb"),
      anchor(3, "G"),
      anchor(3, "B"),
      anchor(4, "C")
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);
    const borrowedFlatSix = proposals.find(candidate => (
      candidate.name === "Estratégia — Empréstimo modal"
      && candidate.measures.some(measure => measure.chords.some(chord => chord.startsWith("Ab")))
    ));
    const chords = borrowedFlatSix?.measures.flatMap(measure => measure.chords);

    expect(borrowedFlatSix?.kind).toBe("controlled-reharmonization");
    expect(chords).toContain("Abmaj7");
    expect(borrowedFlatSix?.explanation).toEqual(expect.arrayContaining([
      "usa bVI como cor do modo paralelo menor",
      "bVI vem do modo paralelo menor em contexto maior"
    ]));
  });
});
