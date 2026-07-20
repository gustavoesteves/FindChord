import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import type { HarmonicDiagnostic } from "../src/utils/music/analysis/models/HarmonicDiagnostic";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import {
  findHarmonizableWindow,
  firstMelodicWindow,
  realMusicDir,
  realMusicXmlFiles,
  toAnchors
} from "./real-music-audit";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

const musicXmlFiles = realMusicXmlFiles();

function expectValidProposalContract(proposals: ReharmonizationProposal[]): void {
  for (const proposal of proposals) {
    expect(proposal.id).toBeTruthy();
    expect(proposal.name).toBeTruthy();
    expect(proposal.measures.length).toBeGreaterThan(0);
    expect(proposal.measures.every(measure => measure.chords.length > 0)).toBe(true);
    expect(proposal.measures.every(measure => measure.chords.every(Boolean))).toBe(true);
    expect(proposal.bassLine.length).toBeGreaterThan(0);
    expect(Number.isFinite(proposal.voiceLeadingScore)).toBe(true);
    expect(Number.isFinite(proposal.routeDistanceCost)).toBe(true);
    expect(proposal.routeProfile).toBeTruthy();
    expect(proposal.bassLineProfile).toBeTruthy();
    expect(proposal.presentationRole).toBeTruthy();
  }
}

function expectDiagnosticContract(diagnostics: HarmonicDiagnostic[]): void {
  for (const item of diagnostics) {
    expect(item.id).toBeTruthy();
    expect(item.source).toMatch(/^(generation|reference|presentation)$/);
    expect(item.category).toMatch(/^(omission|comparison|compatibility)$/);
    expect(item.message).toBeTruthy();
  }
}

describe("F38 real music fire audit", () => {
  it("keeps the real MusicXML fixture set visible to the curated audit", () => {
    expect(musicXmlFiles).toEqual([
      "Actual proof.musicxml",
      "Ain't it the truth.musicxml",
      "Ain't misbehavin.musicxml",
      "Air mail special.musicxml",
      "Airegin.musicxml",
      "Bright Size Life.musicxml",
      "a child is born.musicxml",
      "a fine romance.musicxml",
      "affirmation.musicxml",
      "african flower.musicxml",
      "afro blue.musicxml",
      "afron-centric.musicxml",
      "after you've gone.musicxml",
      "after you.musicxml",
      "afternoon in Paris.musicxml",
      "asa branca.musicxml",
      "autum leaves.musicxml",
      "exemplo.musicxml"
    ]);
  });

  it.each(musicXmlFiles)("runs the harmonization pipeline on %s", file => {
    const snapshot = parseMusicXML(fs.readFileSync(path.join(realMusicDir, file), "utf8"));
    const windowNotes = firstMelodicWindow(snapshot.notes);
    const anchors = toAnchors(windowNotes);

    expect(snapshot.metadata.measures).toBeGreaterThan(0);
    expect(snapshot.notes.length + snapshot.harmonies.length).toBeGreaterThan(0);

    if (anchors.length === 0) {
      expect(snapshot.harmonies.length).toBeGreaterThan(0);
      return;
    }

    const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot });
    expect(harmonizable).not.toBeNull();

    const { phraseContext, generation, anchors: harmonizedAnchors } = harmonizable!;
    const ranked = rankReharmonizationProposalsByVoiceLeading(generation.proposals, phraseContext, harmonizedAnchors);
    const presented = annotateProposalPresentationRoles(ranked, "balanced", phraseContext);

    expect(phraseContext.selectedCenter.tonic).toBeTruthy();
    expect(generation.proposals.length).toBeGreaterThan(0);
    expect(presented.length).toBe(generation.proposals.length);
    expect(presented.some(proposal => proposal.presentationRole)).toBe(true);
    expect(harmonizedAnchors.length).toBeGreaterThan(0);
    expectValidProposalContract(presented);
    expectDiagnosticContract(generation.omittedStrategyDiagnostics);
    expectDiagnosticContract(presented.flatMap(proposal => proposal.diagnostics || []));
  });
});
