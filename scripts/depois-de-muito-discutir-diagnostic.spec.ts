import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function loadDepoisDeMuitoDiscutir() {
  return parseMusicXML(fs.readFileSync("./docs/musics/depois de muito discutir.musicxml", "utf8"));
}

function anchorsForSection(snapshot: any, label: string): MelodicAnchor[] {
  const section = snapshot.sections.find((candidate: any) => candidate.label === label);
  return snapshot.notes
    .filter((note: any) => note.measure >= section.startMeasure && note.measure <= section.endMeasure)
    .map((note: any) => ({
      measureIndex: note.measure,
      pitch: `${note.step}${note.alter === 1 ? "#" : note.alter === -1 ? "b" : ""}`,
      duration: note.duration,
      startTick: note.startTick,
      endTick: note.endTick
    }));
}

describe("Depois de Muito Discutir diagnostic", () => {
  it("loads a sectioned melody+harmony score with an intro harmony layer before the melody", () => {
    const snapshot = loadDepoisDeMuitoDiscutir();
    const intro = snapshot.sections.find((section: any) => section.label === "Intro");
    const introNotes = snapshot.notes.filter((note: any) => (
      note.measure >= intro.startMeasure && note.measure <= intro.endMeasure
    ));
    const introHarmonies = snapshot.harmonies.filter((harmony: any) => (
      harmony.measure >= intro.startMeasure && harmony.measure <= intro.endMeasure
    ));

    expect(snapshot.metadata.keySignature).toBe("F");
    expect(snapshot.sections.map((section: any) => section.label)).toEqual(["Intro", "A1", "B1", "A2", "C1", "Bridge"]);
    expect(introNotes).toHaveLength(0);
    expect(introHarmonies.length).toBeGreaterThan(0);
    expect(introHarmonies.map((harmony: any) => harmony.harmony).slice(0, 4)).toEqual([
      "Dm9",
      "Abm6",
      "Gm7",
      "Gb7(#11)"
    ]);
  });

  it("can analyze the intro harmony as reference material even without melodic anchors", () => {
    const snapshot = loadDepoisDeMuitoDiscutir();
    const intro = snapshot.sections.find((section: any) => section.label === "Intro");
    const introHarmonies = snapshot.harmonies.filter((harmony: any) => (
      harmony.measure >= intro.startMeasure && harmony.measure <= intro.endMeasure
    ));
    const analysis = analyzeReferenceHarmony(introHarmonies);

    expect(analysis.hasExistingHarmony).toBe(true);
    expect(analysis.bassTrajectory).toEqual(["D", "Ab", "G", "Gb", "F", "A", "A"]);
    expect(analysis.explanation).toContain("Cifras lidas diretamente da partitura sincronizada");
  });

  it("keeps A1 in the score key before generating tonal proposals", () => {
    const snapshot = loadDepoisDeMuitoDiscutir();
    const anchors = anchorsForSection(snapshot, "A1");
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors.slice(0, 32), snapshot.metadata.keySignature);
    const proposals = GravityFieldManager.generateProposals(anchors.slice(0, 32), phraseContext);
    const tonalProposal = proposals.find((proposal) => proposal.name === "Estratégia — Tonal Clássico");
    const firstTonalChord = tonalProposal?.measures[0]?.chords[0];

    expect(phraseContext.selectedCenter.tonic).toBe("F");
    expect(firstTonalChord).not.toBe("Emaj7");
  });

  it("does not surface gravity-field proposals whose opening chord misses the melodic territory", () => {
    const snapshot = loadDepoisDeMuitoDiscutir();
    const anchors = anchorsForSection(snapshot, "A1").slice(0, 32);
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, snapshot.metadata.keySignature);
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);
    const proposals = generation.proposals;
    const firstChords = proposals.map((proposal) => proposal.measures[0]?.chords[0]).filter(Boolean);

    expect(generation.rejectedExperimentalCount).toBeGreaterThan(0);
    expect(firstChords).not.toContain("Emaj7");
  });
});
