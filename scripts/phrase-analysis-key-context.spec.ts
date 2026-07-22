import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";

describe("PhraseAnalysisEngine tonal fallback", () => {
  it("uses the declared key when no melodic anchors are available", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase([], "F#m");

    expect(phraseContext).toEqual(expect.objectContaining({
      selectedCenter: {
        tonic: "F#",
        mode: "minor",
        confidence: 0.25
      },
      tonalCenterCandidates: [{
        tonic: "F#",
        mode: "minor",
        confidence: 0.25
      }],
      cadentialTarget: {
        targetPitch: "F#",
        cadenceType: "UNKNOWN",
        confidence: 0.25
      }
    }));
  });

  it("keeps the weak C major fallback only when no key is available", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase([]);

    expect(phraseContext.selectedCenter).toEqual({
      tonic: "C",
      mode: "major",
      confidence: 0.1
    });
  });
});
