import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function findPalhacoPath(): string {
  const fileName = fs.readdirSync("./docs").find(name => (
    name.normalize("NFD").includes("palhac") && name.endsWith(".musicxml")
  ));
  if (!fileName) throw new Error("palhaco MusicXML fixture not found");
  return `./docs/${fileName}`;
}

function pitchClassFromNote(note: any): string {
  return `${note.step}${note.alter === 1 ? "#" : note.alter === -1 ? "b" : ""}`;
}

function toAnchors(notes: any[]): MelodicAnchor[] {
  return notes.map(note => ({
    measureIndex: note.measure,
    pitch: pitchClassFromNote(note),
    duration: note.durationTicks,
    startTick: note.tickStart,
    endTick: note.tickEnd
  }));
}

describe("Palhaco diagnostic", () => {
  it("loads as a long melody-only score without explicit harmonic sections", () => {
    const snapshot = parseMusicXML(fs.readFileSync(findPalhacoPath(), "utf8"));

    expect(snapshot.metadata.measures).toBeGreaterThan(100);
    expect(snapshot.metadata.keySignature).toBe("Ab");
    expect(snapshot.notes.length).toBeGreaterThan(1000);
    expect(snapshot.harmonies.length).toBe(0);
    expect(snapshot.sections.length).toBe(0);
  });

  it("can analyze a small opening window without treating the whole score as one block", () => {
    const snapshot = parseMusicXML(fs.readFileSync(findPalhacoPath(), "utf8"));
    const notes = snapshot.notes.filter((note: any) => note.measure >= 1 && note.measure <= 8);
    const anchors = toAnchors(notes);
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, snapshot.metadata.keySignature);
    const attempt = StrategyGuidedHarmonizer.tryStrategy("I_IV_V", anchors, phraseContext);
    const chords = attempt.candidate.measures.map(measure => measure.chords[0]);

    expect(anchors.length).toBeGreaterThan(0);
    expect(phraseContext.selectedCenter).toMatchObject({ tonic: "Ab", mode: "major" });
    expect(attempt.validation.report.melodyCoverage).toBeGreaterThanOrEqual(0.85);
    expect(attempt.candidate.measures.length).toBeLessThanOrEqual(8);
    expect(chords[0]).toBe("Ab");
    expect(chords).toContain("Db");
    expect(chords.some(chord => chord.startsWith("Eb7"))).toBe(true);
  });
});
