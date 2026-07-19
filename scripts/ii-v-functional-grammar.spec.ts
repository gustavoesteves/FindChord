import { describe, expect, it } from "vitest";
import { detectIiVFunctionalCells } from "../src/utils/music/analysis/strategies/IiVFunctionalGrammar";
import { PhraseAnalysisEngine, type PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";

function harmonies(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map((harmony, index) => ({
    measure: index + 1,
    beat: 1,
    harmony,
    tickStart: index * 1920,
    tickEnd: (index + 1) * 1920,
    durationTicks: 1920
  }));
}

describe("F26.8a ii-V Functional Grammar Detection", () => {
  it("detects a major ii-V-I as a local major region", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Dm7", "G7", "Cmaj7"]));

    expect(cells).toEqual([
      expect.objectContaining({
        kind: "MAJOR_II_V_I",
        region: { tonic: "C", mode: "major", scope: "cadential-cell" },
        chords: ["Dm7", "G7", "Cmaj7"]
      })
    ]);
  });

  it("detects a major ii-V-I with display-profile aliases", () => {
    const cells = detectIiVFunctionalCells(harmonies(["D-7", "G7", "C7M"]));

    expect(cells).toEqual([
      expect.objectContaining({
        kind: "MAJOR_II_V_I",
        region: { tonic: "C", mode: "major", scope: "cadential-cell" },
        chords: ["D-7", "G7", "C7M"]
      })
    ]);
  });

  it("detects a minor iiø-V-i as a local minor region", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Bm7(b5)", "E7(b13)", "Am6"]));

    expect(cells).toEqual([
      expect.objectContaining({
        kind: "MINOR_IIØ_V_I",
        region: { tonic: "A", mode: "minor", scope: "cadential-cell" },
        chords: ["Bm7(b5)", "E7(b13)", "Am6"]
      })
    ]);
  });

  it("detects a minor iiø-V-i with half-diminished aliases", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Bø", "E7alt", "Am6"]));

    expect(cells).toEqual([
      expect.objectContaining({
        kind: "MINOR_IIØ_V_I",
        region: { tonic: "A", mode: "minor", scope: "cadential-cell" },
        chords: ["Bø", "E7alt", "Am6"]
      })
    ]);
  });

  it("does not label unresolved ii-V motion as a complete local region", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Dm7", "G7", "Am7"]));

    expect(cells).toHaveLength(0);
  });
});

describe("F26.8b ii-V Local Region Generation", () => {
  it("generates a local major ii-V-I only when the phrase clearly arrives away from the global center", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "D", duration: 960 },
      { measureIndex: 2, pitch: "F#", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 }
    ];
    const phraseContext: PhraseContext = {
      selectedCenter: { tonic: "C", mode: "major", confidence: 0.8 },
      tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.8 }],
      cadentialTarget: { targetPitch: "G", cadenceType: "OPEN", confidence: 0.8 }
    };

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Gramática funcional ii-V");

    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["Am7", "D7", "Gmaj7"]);
    expect(proposal?.explanation).toEqual(expect.arrayContaining([
      "cria uma cadência local para G",
      "preserva a chegada melódica como ponto de resolução"
    ]));
  });

  it("offers a compact ii-V when the same measure supports preparation and dominant", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "D", duration: 960 },
      { measureIndex: 2, pitch: "F#", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 }
    ];
    const phraseContext: PhraseContext = {
      selectedCenter: { tonic: "C", mode: "major", confidence: 0.8 },
      tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.8 }],
      cadentialTarget: { targetPitch: "G", cadenceType: "OPEN", confidence: 0.8 }
    };

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — ii-V compacto");

    expect(proposal?.measures.map(measure => measure.chords)).toEqual([
      ["Am7", "D7"],
      ["Gmaj7"],
      ["Gmaj7"]
    ]);
    expect(proposal?.explanation).toContain("condensa célula ii-V local em G");
  });

  it("does not offer a compact ii-V when the preparation bar lacks dominant support", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "E", duration: 1920 },
      { measureIndex: 2, pitch: "D", duration: 960 },
      { measureIndex: 2, pitch: "F#", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 }
    ];
    const phraseContext: PhraseContext = {
      selectedCenter: { tonic: "C", mode: "major", confidence: 0.8 },
      tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.8 }],
      cadentialTarget: { targetPitch: "G", cadenceType: "OPEN", confidence: 0.8 }
    };

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);

    expect(proposals.some(proposal => proposal.name === "Estratégia — ii-V compacto")).toBe(false);
  });

  it("generates a local minor iiø-V-i when the phrase arrives in the relative minor region", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "B", duration: 960 },
      { measureIndex: 1, pitch: "D", duration: 960 },
      { measureIndex: 2, pitch: "E", duration: 960 },
      { measureIndex: 2, pitch: "G#", duration: 960 },
      { measureIndex: 3, pitch: "A", duration: 1920 }
    ];
    const phraseContext: PhraseContext = {
      selectedCenter: { tonic: "C", mode: "major", confidence: 0.8 },
      tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.8 }],
      cadentialTarget: { targetPitch: "A", cadenceType: "OPEN", confidence: 0.8 }
    };

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .find(candidate => candidate.name === "Estratégia — Gramática funcional ii-V");

    expect(proposal?.measures.map(measure => measure.chords[0])).toEqual(["Bm7b5", "E7b13", "Am6"]);
    expect(proposal?.explanation).toContain("usa preparação meio-diminuta antes da dominante local");
  });

  it("does not add local ii-V grammar to a simple melody resolving in its global center", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C" },
      { measureIndex: 2, pitch: "F" },
      { measureIndex: 3, pitch: "G" },
      { measureIndex: 4, pitch: "C" }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);

    expect(proposals.some(proposal => proposal.name === "Estratégia — Gramática funcional ii-V")).toBe(false);
    expect(proposals.some(proposal => proposal.name === "Estratégia — ii-V compacto")).toBe(false);
  });
});
