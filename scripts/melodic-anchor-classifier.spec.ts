import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import {
  classifyMelodicAnchors,
  pitchProminence
} from "../src/utils/music/analysis/strategies/MelodicAnchorClassifier";
import {
  melodicCoverageEntries,
  weightedMelodicCoverage
} from "../src/utils/music/analysis/strategies/MelodicCoverage";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

describe("F36 Melodic Anchor Classifier", () => {
  it("separates structural anchors from short ornamental notes", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "D", duration: 1920 },
      { measureIndex: 1, pitch: "E", duration: 120 },
      { measureIndex: 2, pitch: "D", duration: 1920 }
    ];

    const classified = classifyMelodicAnchors(anchors);

    expect(classified.map(anchor => anchor.role)).toEqual(["structural", "ornamental", "structural"]);
    expect(classified[0].weight).toBeGreaterThan(classified[1].weight);
    expect(classified[2].weight).toBeGreaterThan(classified[0].weight);
  });

  it("computes pitch prominence from melodic weight instead of raw occurrence count", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "F", duration: 1920 },
      { measureIndex: 1, pitch: "E", duration: 120 },
      { measureIndex: 2, pitch: "F", duration: 1920 }
    ];

    expect(pitchProminence(anchors, "F")).toBeGreaterThan(0.75);
    expect(pitchProminence(anchors, "E")).toBeLessThan(0.25);
  });

  it("lets structural modal roots outrank short ornamental passing tones", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "D", duration: 1920 },
      { measureIndex: 2, pitch: "E", duration: 120 },
      { measureIndex: 2, pitch: "C", duration: 120 },
      { measureIndex: 2, pitch: "D", duration: 1920 },
      { measureIndex: 3, pitch: "C", duration: 1920 },
      { measureIndex: 4, pitch: "D", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "Dm");

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Centro modal");

    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["Dm", "Dm", "C", "Dm"]);
  });

  it("gives partial coverage to a suspension that resolves by step into the chord", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "F", duration: 960 },
      { measureIndex: 1, pitch: "E", duration: 960 }
    ];

    const entries = melodicCoverageEntries(anchors, ["C"], { markFinal: false });

    expect(entries.map(entry => entry.behavior)).toEqual(["suspension-resolution", "chord-tone"]);
    expect(weightedMelodicCoverage(anchors, ["C"], { markFinal: false })).toBeGreaterThan(0.8);
  });

  it("recognizes chromatic approach into a covered chord tone", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "Db", duration: 240 },
      { measureIndex: 1, pitch: "C", duration: 960 }
    ];

    const entries = melodicCoverageEntries(anchors, ["C"], { markFinal: false });

    expect(entries[0].behavior).toBe("chromatic-approach");
    expect(entries[0].creditedWeight).toBeGreaterThan(0);
    expect(entries[0].creditedWeight).toBeLessThan(entries[0].weight);
  });

  it("leaves unresolved dissonance uncredited", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "F", duration: 960 },
      { measureIndex: 1, pitch: "A", duration: 960 }
    ];

    const entries = melodicCoverageEntries(anchors, ["C"], { markFinal: false });

    expect(entries[0].behavior).toBe("unresolved");
    expect(entries[0].creditedWeight).toBe(0);
  });
});
