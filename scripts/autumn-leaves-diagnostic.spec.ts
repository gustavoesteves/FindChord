import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import { detectIiVFunctionalCells } from "../src/utils/music/analysis/strategies/IiVFunctionalGrammar";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { timelineContextForAnchors } from "../src/utils/music/analysis/scoreTimelineContext";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function pitchClassFromNote(note: any): string {
  return `${note.step}${note.alter === 1 ? "#" : note.alter === -1 ? "b" : ""}`;
}

describe("Autumn Leaves diagnostic", () => {
  it("detects reference ii-V cells and surfaces local ii-V proposals inside the section", () => {
    const snapshot = parseMusicXML(fs.readFileSync("./docs/musics/autum leaves.musicxml", "utf8"));
    const sectionA = snapshot.sections.find((section: any) => section.label === "A");
    expect(sectionA).toBeTruthy();

    const notes = snapshot.notes.filter((note: any) => (
      note.measure >= sectionA.startMeasure && note.measure <= sectionA.endMeasure
    ));
    const anchors: MelodicAnchor[] = notes.map((note: any) => ({
      measureIndex: note.measure,
      pitch: pitchClassFromNote(note),
      duration: note.durationTicks,
      startTick: note.tickStart,
      endTick: note.tickEnd
    }));

    const phraseContext = PhraseAnalysisEngine.analyzePhrase(
      anchors,
      timelineContextForAnchors(snapshot, anchors).keySignature
    );
    const proposals = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext);
    const realChords = snapshot.harmonies
      .filter((harmony: any) => harmony.measure >= sectionA.startMeasure && harmony.measure <= sectionA.endMeasure)
      .map((harmony: any) => harmony.harmony);
    const iiVCells = detectIiVFunctionalCells(snapshot.harmonies.filter((harmony: any) => (
      harmony.measure >= sectionA.startMeasure && harmony.measure <= sectionA.endMeasure
    )));

    const hasReferenceMajorIiV = realChords.some((chord: string, index: number) => (
      chord === "Am7" && realChords[index + 1] === "D7" && realChords[index + 2] === "Gmaj7"
    ));
    const hasReferenceMinorIiV = realChords.some((chord: string, index: number) => (
      chord === "F#m7(b5)" && realChords[index + 1]?.startsWith("B7") && realChords[index + 2]?.startsWith("Em")
    ));

    expect(snapshot.harmonies.length).toBeGreaterThan(0);
    expect(realChords.length).toBeGreaterThan(0);
    expect(hasReferenceMajorIiV).toBe(true);
    expect(hasReferenceMinorIiV).toBe(true);
    expect(iiVCells).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "MAJOR_II_V_I",
        region: expect.objectContaining({ tonic: "G", mode: "major" }),
        chords: ["Am7", "D7", "Gmaj7"]
      }),
      expect.objectContaining({
        kind: "MINOR_IIØ_V_I",
        region: expect.objectContaining({ tonic: "E", mode: "minor" }),
        chords: ["F#m7(b5)", "B7(b13)", "Em6"]
      })
    ]));
    const generatedLocalIiVCells = proposals
      .filter(proposal => proposal.name === "Estratégia — Gramática funcional ii-V")
      .map(proposal => proposal.measures.flatMap(measure => measure.chords));

    expect(["E", "G"]).toContain(phraseContext.selectedCenter.tonic);
    expect(phraseContext.selectedCenter.mode).toBe("minor");
    expect(generatedLocalIiVCells).toEqual(expect.arrayContaining([
      ["Am7", "D7", "Gmaj7"]
    ]));
    expect(generatedLocalIiVCells).not.toEqual(expect.arrayContaining([
      ["Bm7", "E7", "Amaj7"]
    ]));
  });
});
