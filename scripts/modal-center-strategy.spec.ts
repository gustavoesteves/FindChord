import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

describe("F32.3 Modal Center Strategy", () => {
  it("generates a minimal modal proposal when center and bVII are structural", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "D", duration: 960 },
      { measureIndex: 1, pitch: "F", duration: 960 },
      { measureIndex: 2, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "A", duration: 960 },
      { measureIndex: 3, pitch: "Bb", duration: 960 },
      { measureIndex: 3, pitch: "F", duration: 960 },
      { measureIndex: 4, pitch: "D", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "Dm");

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Centro modal");

    expect(proposal).toEqual(expect.objectContaining({
      harmonicIdiom: "modal"
    }));
    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["Dm", "C", "Bb", "Dm"]);
    expect(proposal?.explanation).toEqual(expect.arrayContaining([
      "preserva centro recorrente sem depender de cadência dominante",
      "usa bVII/bVI como cor modal estável"
    ]));
  });

  it("does not add modal strategy to ordinary major-functional melodies", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C" },
      { measureIndex: 2, pitch: "F" },
      { measureIndex: 3, pitch: "G" },
      { measureIndex: 4, pitch: "C" }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);

    expect(proposals.some(proposal => proposal.name === "Estratégia — Centro modal")).toBe(false);
  });
});
