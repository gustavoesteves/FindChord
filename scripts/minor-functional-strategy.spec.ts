import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

describe("F32.5 Minor Functional Strategy", () => {
  it("generates a controlled minor proposal with natural color and harmonic cadence", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "G", duration: 960 },
      { measureIndex: 2, pitch: "B", duration: 960 },
      { measureIndex: 3, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "A", duration: 960 },
      { measureIndex: 4, pitch: "E", duration: 960 },
      { measureIndex: 4, pitch: "G#", duration: 960 },
      { measureIndex: 5, pitch: "A", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "Am");

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Menor funcional");

    expect(proposal).toEqual(expect.objectContaining({
      harmonicIdiom: "minor-functional"
    }));
    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["Am", "G", "F", "E7", "Am"]);
    expect(proposal?.explanation).toEqual(expect.arrayContaining([
      "usa bVI/bVII como cores naturais do campo menor",
      "fecha a frase com dominante maior resolvendo em tônica menor"
    ]));
  });

  it("uses tonic minor-six when the melody carries melodic minor color", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "F#", duration: 960 },
      { measureIndex: 2, pitch: "B", duration: 960 },
      { measureIndex: 2, pitch: "D", duration: 960 },
      { measureIndex: 3, pitch: "E", duration: 960 },
      { measureIndex: 3, pitch: "G#", duration: 960 },
      { measureIndex: 4, pitch: "A", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "Am");

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Menor funcional");

    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["Am6", "Bm7(b5)", "E7", "Am"]);
    expect(proposal?.explanation).toContain("mantém a sexta maior apenas quando ela aparece como cor melódica");
  });

  it("does not add minor strategy to ordinary major-functional melodies", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C" },
      { measureIndex: 2, pitch: "F" },
      { measureIndex: 3, pitch: "G" },
      { measureIndex: 4, pitch: "C" }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);

    expect(proposals.some(proposal => proposal.name === "Estratégia — Menor funcional")).toBe(false);
  });
});
