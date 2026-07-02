import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

describe("Asa Branca diagnostic", () => {
  it("generates a basic phrase-aware harmonization for a real melody-only score", () => {
    const snapshot = parseMusicXML(fs.readFileSync("./docs/musics/asa branca.musicxml", "utf8"));
    const anchors: MelodicAnchor[] = snapshot.notes.map((note: any) => ({
      measureIndex: note.measure,
      pitch: `${note.step}${note.alter === 1 ? "#" : note.alter === -1 ? "b" : ""}`,
      duration: note.durationTicks,
      startTick: note.tickStart,
      endTick: note.tickEnd
    }));
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, snapshot.metadata.keySignature);
    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);
    const attempts = (["I_IV_V", "EXPANSAO_FUNCIONAL_DIATONICA", "DOMINANTES_SECUNDARIAS", "DIMINUTO_PASSAGEM"] as const)
      .map(strategy => {
        const attempt = StrategyGuidedHarmonizer.tryStrategy(strategy, anchors, phraseContext);
        return {
          strategy,
          accepted: attempt.validation.accepted,
          failures: attempt.validation.failures,
          report: attempt.validation.report,
          measures: attempt.candidate.measures
        };
      });

    const basic = attempts.find(attempt => attempt.strategy === "I_IV_V");
    const secondaryDominants = attempts.find(attempt => attempt.strategy === "DOMINANTES_SECUNDARIAS");
    const passingDiminished = attempts.find(attempt => attempt.strategy === "DIMINUTO_PASSAGEM");
    expect(snapshot.harmonies.length).toBe(0);
    expect(phraseContext.selectedCenter.tonic).toBe("C");
    expect(basic?.accepted).toBe(true);
    expect(basic?.report.melodyCoverage).toBe(1);
    expect(secondaryDominants?.accepted).toBe(false);
    expect(secondaryDominants?.failures).toEqual(expect.arrayContaining(["melody-segment-coverage"]));
    expect(secondaryDominants?.report.chordCount).toBeLessThan(24);
    expect(passingDiminished?.accepted).toBe(false);
    expect(passingDiminished?.failures).toEqual(expect.arrayContaining(["melody-segment-coverage"]));
    expect(passingDiminished?.report.chordCount).toBeLessThan(24);
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.every(proposal => proposal.kind === "validated-harmonization")).toBe(true);
    expect(proposals[0].explanation).toEqual(expect.arrayContaining([
      "Leitura da frase: a melodia abre espaço para subdominante",
      "Leitura da frase: identifica preparação dominante antes da resolução"
    ]));

    const basicChords = proposals[0].measures.map(measure => measure.chords[0]);
    const hasSubdominantPreparation = basicChords.some((chord, index) => chord === "C7" && basicChords[index + 1] === "F");
    const hasGuidedBassCadence = basicChords.some((chord, index) => chord === "G7/B" && basicChords[index + 1]?.startsWith("C"));

    expect(basicChords[0]).toBe("C");
    expect(basicChords[basicChords.length - 1]).toBe("C");
    expect(basicChords.filter(chord => chord === "F").length).toBeGreaterThanOrEqual(2);
    expect(hasSubdominantPreparation).toBe(true);
    expect(hasGuidedBassCadence).toBe(true);
    expect(basicChords.length).toBe(16);
  });

  it("treats the B phrase as its own window and answers the prominent F with subdominant harmony", () => {
    const snapshot = parseMusicXML(fs.readFileSync("./docs/musics/asa branca.musicxml", "utf8"));
    const anchors: MelodicAnchor[] = snapshot.notes
      .filter((note: any) => note.measure >= 9 && note.measure <= 16)
      .map((note: any) => ({
        measureIndex: note.measure,
        pitch: `${note.step}${note.alter === 1 ? "#" : note.alter === -1 ? "b" : ""}`,
        duration: note.durationTicks,
        startTick: note.tickStart,
        endTick: note.tickEnd
      }));

    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, snapshot.metadata.keySignature);
    const attempt = StrategyGuidedHarmonizer.tryStrategy("I_IV_V", anchors, phraseContext);
    const chordsByMeasure = new Map(attempt.candidate.measures.map(measure => [measure.measureIndex, measure.chords[0]]));

    expect(attempt.validation.accepted).toBe(true);
    expect(chordsByMeasure.get(12)).toBe("F");
    expect(chordsByMeasure.get(13)).toBe("F");
    expect(chordsByMeasure.get(15)).toContain("G7");
    expect(chordsByMeasure.get(16)).toBe("C");
  });
});
