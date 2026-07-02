import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

describe("F32.2 Blues Functional Strategy", () => {
  it("generates a minimal blues proposal when b3 and b7 are structural melodic colors", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 1, pitch: "Bb", duration: 960 },
      { measureIndex: 2, pitch: "Eb", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 960 },
      { measureIndex: 3, pitch: "Bb", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Blues funcional");

    expect(proposal).toEqual(expect.objectContaining({
      harmonicIdiom: "blues"
    }));
    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["C7", "F7", "G7", "C7"]);
    expect(proposal?.explanation).toEqual(expect.arrayContaining([
      "trata I7 como repouso idiomático, não como dominante pendente",
      "preserva b3 e b7 como cores estruturais do blues"
    ]));
  });

  it("does not add blues strategy to ordinary major-functional melodies", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C" },
      { measureIndex: 2, pitch: "F" },
      { measureIndex: 3, pitch: "G" },
      { measureIndex: 4, pitch: "C" }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);

    expect(proposals.some(proposal => proposal.name === "Estratégia — Blues funcional")).toBe(false);
  });
});
