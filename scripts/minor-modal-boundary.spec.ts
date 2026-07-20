import { describe, expect, it } from "vitest";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

function proposalNames(anchors: MelodicAnchor[], keySignature: string): string[] {
  const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, keySignature);
  return StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
    .map(proposal => proposal.name);
}

function diagnosticMessages(anchors: MelodicAnchor[], keySignature: string): string[] {
  const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, keySignature);
  return GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext)
    .omittedStrategyDiagnostics
    .map(diagnostic => diagnostic.message);
}

describe("F34 Minor Functional vs Modal Boundary", () => {
  it("keeps i-bVII-bVI without leading tone as modal instead of forcing minor functional cadence", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "G", duration: 960 },
      { measureIndex: 2, pitch: "B", duration: 960 },
      { measureIndex: 3, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "A", duration: 960 },
      { measureIndex: 4, pitch: "A", duration: 1920 }
    ];

    const names = proposalNames(anchors, "Am");

    expect(names).toContain("Estratégia — Centro modal");
    expect(names).not.toContain("Estratégia — Menor funcional");
  });

  it("explains why minor-functional was omitted when modal vocabulary lacks leading tone", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "G", duration: 960 },
      { measureIndex: 2, pitch: "B", duration: 960 },
      { measureIndex: 3, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "A", duration: 960 },
      { measureIndex: 4, pitch: "A", duration: 1920 }
    ];

    expect(diagnosticMessages(anchors, "Am")).toContain(
      "Menor funcional omitido: a melodia não traz sensível nem sexta maior para sustentar cadência dominante."
    );
  });

  it("keeps directed minor with leading tone as minor functional instead of modal", () => {
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

    const names = proposalNames(anchors, "Am");

    expect(names).toContain("Estratégia — Menor funcional");
    expect(names).not.toContain("Estratégia — Centro modal");
  });

  it("explains why modal center was omitted when the melody has functional minor direction", () => {
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

    expect(diagnosticMessages(anchors, "Am")).toContain(
      "Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior."
    );
  });

  it("keeps melodic minor color as functional minor direction", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "A", duration: 960 },
      { measureIndex: 1, pitch: "F#", duration: 960 },
      { measureIndex: 2, pitch: "B", duration: 960 },
      { measureIndex: 2, pitch: "D", duration: 960 },
      { measureIndex: 3, pitch: "E", duration: 960 },
      { measureIndex: 3, pitch: "G#", duration: 960 },
      { measureIndex: 4, pitch: "A", duration: 1920 }
    ];

    const names = proposalNames(anchors, "Am");

    expect(names).toContain("Estratégia — Menor funcional");
    expect(names).not.toContain("Estratégia — Centro modal");
  });

  it("rejects experimental tonic-major realization in minor centers", () => {
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
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);
    const chords = generation.proposals.flatMap(proposal => proposal.measures.flatMap(measure => measure.chords));

    expect(chords).not.toEqual(expect.arrayContaining(["A", "Amaj7", "A6", "A6/9"]));
    expect(generation.proposals.map(proposal => proposal.name)).toContain("Estratégia — Menor funcional");
  });
});
