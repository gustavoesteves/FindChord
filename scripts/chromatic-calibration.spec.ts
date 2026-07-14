import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function presentedFor(file: string) {
  const snapshot = parseMusicXML(fs.readFileSync(`./docs/musics/imported-real-book/${file}`, "utf8"));
  const harmonizable = findHarmonizableWindow(snapshot.notes, snapshot.metadata.keySignature, snapshot.harmonies);
  expect(harmonizable).toBeTruthy();

  const ranked = rankReharmonizationProposalsByVoiceLeading(
    harmonizable!.generation.proposals,
    harmonizable!.phraseContext,
    harmonizable!.anchors,
    { referenceHarmonies: snapshot.harmonies }
  );
  return annotateProposalPresentationRoles(ranked, "balanced", harmonizable!.phraseContext);
}

describe("Chromatic calibration", () => {
  it("keeps chromatic linear primary when it has clear support", () => {
    const crazeologyPrimary = presentedFor("c-034-Crazeology.musicxml")
      .find(proposal => proposal.presentationRole === "primary");
    const detourPrimary = presentedFor("d-017-Detour ahead.musicxml")
      .find(proposal => proposal.presentationRole === "primary");

    expect(crazeologyPrimary?.name).toBe("Estratégia — Cromático Linear");
    expect(crazeologyPrimary?.chromaticLegibilityPenalty || 0).toBe(0);
    expect(detourPrimary?.name).toBe("Estratégia — Cromático Linear");
    expect(detourPrimary?.referenceRootAgreement).toBe(1);
    expect(detourPrimary?.chromaticLegibilityPenalty || 0).toBe(0);
  });

  it("demotes dense chromatic slash chords when roots and guide tones do not support them", () => {
    const presented = presentedFor("e-002-E.S.P..musicxml");
    const primary = presented.find(proposal => proposal.presentationRole === "primary");
    const chromatic = presented.find(proposal => proposal.name === "Estratégia — Cromático Linear");

    expect(primary?.name).toBe("Estratégia — Centro modal");
    expect(chromatic?.presentationRole).not.toBe("primary");
    expect(chromatic?.chromaticLegibilityPenalty).toBeGreaterThan(0);
  });
});
