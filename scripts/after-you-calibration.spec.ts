import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function loadAfterYou() {
  return parseMusicXML(fs.readFileSync("./docs/musics/imported-real-book/a-010-After you.musicxml", "utf8"));
}

describe("After You calibration", () => {
  it("uses the reference dominant chain to center the first window in Bb", () => {
    const snapshot = loadAfterYou();
    const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);
    expect(harmonizable).toBeTruthy();

    const referenceForWindow = snapshot.harmonies.filter((harmony: any) => (
      harmonizable!.anchors.some((anchor) => anchor.measureIndex === harmony.measure)
    ));
    const referenceAnalysis = analyzeReferenceHarmony(referenceForWindow);

    expect(referenceAnalysis.referenceCenter).toEqual(expect.objectContaining({
      tonic: "Bb",
      mode: "major",
      confidence: "strong"
    }));
    expect(harmonizable?.phraseContext.selectedCenter).toEqual(expect.objectContaining({
      tonic: "Bb",
      mode: "major"
    }));
    expect(harmonizable?.phraseContext.selectedCenterSource).toBe("reference");

    const ranked = rankReharmonizationProposalsByVoiceLeading(
      harmonizable!.generation.proposals,
      harmonizable!.phraseContext,
      harmonizable!.anchors,
      { referenceHarmonies: snapshot.harmonies }
    );
    const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable!.phraseContext);
    const primary = presented.find((proposal) => proposal.presentationRole === "primary");
    const primaryChords = primary?.measures.flatMap((measure) => measure.chords) ?? [];

    expect(primaryChords).toContain("Bdim7");
    expect(primaryChords).not.toContain("Bdim7/Cb");
  });
});
