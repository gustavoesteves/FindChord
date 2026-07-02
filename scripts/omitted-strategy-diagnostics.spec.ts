import { describe, expect, it } from "vitest";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine, type PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import {
  diagnostic,
  diagnosticsForMode,
  groupDiagnosticsBySource
} from "../src/utils/music/analysis/models/HarmonicDiagnostic";

function diagnosticMessages(generation: ReturnType<typeof GravityFieldManager.generateProposalsWithDiagnostics>): string[] {
  return generation.omittedStrategyDiagnostics.map(diagnostic => diagnostic.message);
}

describe("F34.5 Omitted Strategy Diagnostics", () => {
  it("deduplicates diagnostics and filters them by boldness mode", () => {
    const items = [
      diagnostic("same", "reference", "omission", "Mensagem repetida", ["simple", "balanced"]),
      diagnostic("same", "reference", "omission", "Mensagem repetida", ["simple", "balanced"]),
      diagnostic("explore", "generation", "omission", "Mensagem exploratória", ["exploratory"])
    ];

    expect(diagnosticsForMode(items, "balanced").map(item => item.message)).toEqual(["Mensagem repetida"]);
    expect(diagnosticsForMode(items, "exploratory").map(item => item.message)).toEqual(["Mensagem exploratória"]);
  });

  it("groups diagnostics by musical source in stable display order", () => {
    const items = [
      diagnostic("ref", "reference", "omission", "Referencia"),
      diagnostic("gen", "generation", "omission", "Geracao"),
      diagnostic("pres", "presentation", "comparison", "Apresentacao")
    ];

    expect(groupDiagnosticsBySource(items).map(group => [
      group.source,
      group.diagnostics.map(item => item.message)
    ])).toEqual([
      ["generation", ["Geracao"]],
      ["reference", ["Referencia"]],
      ["presentation", ["Apresentacao"]]
    ]);
  });

  it("explains partial blues color without surfacing a blues strategy", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "Bb", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);

    expect(generation.proposals.some(proposal => proposal.harmonicIdiom === "blues")).toBe(false);
    expect(diagnosticMessages(generation)).toContain(
      "Blues funcional omitido: a melodia sugere cor blues parcial, mas não sustenta b3 e b7 como estrutura."
    );
    expect(generation.omittedStrategyDiagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "blues-omitted-partial-color",
        source: "generation",
        category: "omission"
      })
    ]));
  });

  it("does not add a blues omission diagnostic to ordinary major-functional melody", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);

    expect(diagnosticMessages(generation)).not.toContain(
      "Blues funcional omitido: a melodia sugere cor blues parcial, mas não sustenta b3 e b7 como estrutura."
    );
  });

  it("explains local ii-V omission when an away target lacks melodic coverage", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "B", duration: 960 },
      { measureIndex: 2, pitch: "E", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 }
    ];
    const phraseContext: PhraseContext = {
      selectedCenter: { tonic: "C", mode: "major", confidence: 0.8 },
      tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.8 }],
      cadentialTarget: { targetPitch: "G", cadenceType: "OPEN", confidence: 0.8 }
    };

    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);

    expect(generation.proposals.some(proposal => proposal.name === "Estratégia — Gramática funcional ii-V")).toBe(false);
    expect(diagnosticMessages(generation)).toContain(
      "ii-V local omitido: a chegada em G não teve cobertura melódica suficiente para uma cadência local."
    );
  });

  it("explains SubV7 omission when the chromatic substitute misses melodic coverage", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");

    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);

    expect(generation.proposals.some(proposal => proposal.name === "Estratégia — SubV7 cadencial")).toBe(false);
    expect(diagnosticMessages(generation)).toContain(
      "SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento."
    );
  });
});
