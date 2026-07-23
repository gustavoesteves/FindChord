import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";

describe("PhraseAnalysisEngine tonal fallback", () => {
  it("prefers structured key context over a legacy key string", () => {
    const phraseContext = PhraseAnalysisEngine.analyzePhrase([
      { measureIndex: 1, pitch: "C", duration: 480 },
      { measureIndex: 2, pitch: "Eb", duration: 480 },
      { measureIndex: 3, pitch: "G", duration: 480 },
      { measureIndex: 4, pitch: "Bb", duration: 1920 }
    ], "C", {
      keyContext: { tonic: "C", mode: "minor", label: "Cm" }
    });

    expect(phraseContext.selectedCenter).toEqual(expect.objectContaining({
      tonic: "C",
      mode: "minor"
    }));
  });

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
