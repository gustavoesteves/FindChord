import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function loadBlueInGreen() {
  return parseMusicXML(fs.readFileSync("./docs/musics/imported-real-book/b-032-Blue in green.musicxml", "utf8"));
}

describe("Blue in Green calibration", () => {
  it("does not promote a melodic dominant arrival as a local ii-V-I answer", () => {
    const snapshot = loadBlueInGreen();
    const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);
    expect(harmonizable).toBeTruthy();
    expect(harmonizable?.phraseContext.selectedCenter.tonic).toBe("Bb");
    expect(harmonizable?.phraseContext.cadentialTarget.targetPitch).toBe("F");
    expect(harmonizable?.phraseContext.cadentialTarget.cadenceType).toBe("OPEN");

    const ranked = rankReharmonizationProposalsByVoiceLeading(
      harmonizable!.generation.proposals,
      harmonizable!.phraseContext,
      harmonizable!.anchors,
      { referenceHarmonies: snapshot.harmonies }
    );
    const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable!.phraseContext);
    const primary = presented.find((proposal) => proposal.presentationRole === "primary");
    const primaryChords = primary?.measures.flatMap((measure) => measure.chords);

    expect(primary?.name).not.toBe("Estratégia — Gramática funcional ii-V");
    expect(primaryChords).not.toEqual(["Gm7", "C7", "Fmaj7"]);
  });
});
