import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function primaryFor(file: string) {
  const snapshot = parseMusicXML(fs.readFileSync(`./docs/musics/imported-real-book/${file}`, "utf8"));
  const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);
  expect(harmonizable).toBeTruthy();

  const ranked = rankReharmonizationProposalsByVoiceLeading(
    harmonizable!.generation.proposals,
    harmonizable!.phraseContext,
    harmonizable!.anchors,
    { referenceHarmonies: snapshot.harmonies }
  );
  return annotateProposalPresentationRoles(ranked, "balanced", harmonizable!.phraseContext)
    .find(proposal => proposal.presentationRole === "primary");
}

describe("Ranking calibration", () => {
  it("does not let a one-measure compressed gravity proposal win over a full-window answer", () => {
    const primary = primaryFor("f-015-Firm roots.musicxml");

    expect(primary?.name).toBe("Estratégia — Harmonia básica I-IV-V");
    expect(primary?.temporalCoverageRatio).toBe(1);
    expect(primary?.measures.map(measure => measure.measureIndex)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("keeps stable temporal routes ahead after dense reference comparison", () => {
    const donnaLee = primaryFor("d-025-Donna Lee.musicxml");
    const askMeNow = primaryFor("a-052-Ask me now.musicxml");

    expect(donnaLee?.name).toBe("Estratégia — Dominantes secundárias");
    expect(donnaLee?.referenceFunctionAgreement).toBeGreaterThanOrEqual(0.3);
    expect(askMeNow?.name).toBe("Estratégia — Harmonia básica I-IV-V");
    expect(askMeNow?.temporalCoverageRatio).toBe(1);
  });
});
