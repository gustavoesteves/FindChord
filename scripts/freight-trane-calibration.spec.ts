import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function loadFreightTrane() {
  return parseMusicXML(fs.readFileSync("./docs/musics/imported-real-book/f-033-Freight trane.musicxml", "utf8"));
}

describe("Freight Trane calibration", () => {
  it("treats the opening as a dominant sus vamp instead of plain C major", () => {
    const snapshot = loadFreightTrane();
    const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);
    expect(harmonizable).toBeTruthy();

    const vamp = harmonizable!.generation.proposals
      .find(proposal => proposal.name === "Estratégia — Vamp dominante");
    expect(vamp).toEqual(expect.objectContaining({
      harmonicIdiom: "blues"
    }));

    const ranked = rankReharmonizationProposalsByVoiceLeading(
      harmonizable!.generation.proposals,
      harmonizable!.phraseContext,
      harmonizable!.anchors,
      { referenceHarmonies: snapshot.harmonies }
    );
    const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable!.phraseContext);
    const primary = presented.find((proposal) => proposal.presentationRole === "primary");
    const primaryChords = primary?.measures.flatMap((measure) => measure.chords) ?? [];

    expect(primary?.name).toBe("Estratégia — Vamp dominante");
    expect(primaryChords).toEqual(expect.arrayContaining(["C13", "Bb13"]));
    expect(primaryChords).not.toContain("C6/9");
    expect(primaryChords).not.toContain("Fmaj7");
  });
});
