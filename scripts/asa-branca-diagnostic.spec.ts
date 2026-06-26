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
    const snapshot = parseMusicXML(fs.readFileSync("./docs/asa branca.musicxml", "utf8"));
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
    expect(secondaryDominants?.accepted).toBe(true);
    expect(secondaryDominants?.report.chordCount).toBeLessThan(24);
    expect(passingDiminished?.accepted).toBe(true);
    expect(passingDiminished?.report.chordCount).toBeLessThan(24);
    expect(proposals.length).toBeGreaterThan(0);

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
});
