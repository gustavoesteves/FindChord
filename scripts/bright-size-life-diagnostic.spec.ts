import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { detectIiVFunctionalCells } from "../src/utils/music/analysis/strategies/IiVFunctionalGrammar";
import { analyzeStructuralBassGrammar } from "../src/utils/music/analysis/strategies/StructuralBassGrammar";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { firstMelodicWindow, toAnchors } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function loadBrightSizeLife() {
  return parseMusicXML(fs.readFileSync("./docs/musics/Bright Size Life.musicxml", "utf8"));
}

describe("Bright Size Life diagnostic", () => {
  it("loads as a sectioned melody+harmony score with explicit key context", () => {
    const snapshot = loadBrightSizeLife();

    expect(snapshot.metadata.keySignature).toBe("D");
    expect(snapshot.metadata.measures).toBe(28);
    expect(snapshot.notes.length).toBeGreaterThan(100);
    expect(snapshot.harmonies.length).toBeGreaterThan(12);
    expect(snapshot.sections.map((section: any) => section.label)).toEqual(["A", "B", "C"]);
  });

  it("keeps the existing harmonic layer as analysis material instead of requiring generation", () => {
    const snapshot = loadBrightSizeLife();
    const realChords = snapshot.harmonies.map((harmony: any) => harmony.harmony);
    const sectionA = snapshot.sections.find((section: any) => section.label === "A");
    const sectionAHarmonies = snapshot.harmonies.filter((harmony: any) => (
      harmony.measure >= sectionA.startMeasure && harmony.measure <= sectionA.endMeasure
    ));
    const iiVCells = detectIiVFunctionalCells(sectionAHarmonies);
    const structuralBass = analyzeStructuralBassGrammar(sectionAHarmonies);

    expect(realChords.slice(0, 8)).toEqual([
      "Gmaj7",
      "Bb/A",
      "D9",
      "D/C",
      "Bbmaj7",
      "G/A",
      "G/B",
      "D"
    ]);
    expect(iiVCells).toHaveLength(0);
    expect(structuralBass.properties).toEqual(expect.arrayContaining([
      "SIGNIFICANT_SLASH_CHORD_DENSITY",
      "STRUCTURAL_BASS_GRAMMAR",
      "UPPER_STRUCTURE_OVER_BASS",
      "BASS_MOTION_CONTINUITY",
      "CHROMATIC_BASS_MOTION",
      "STRUCTURAL_BASS_LEAP",
      "PLANAR_CHORD_MOTION",
      "LOW_DIRECT_CADENTIAL_DEPENDENCE"
    ]));
    expect(structuralBass.bassLine).toEqual(["G", "A", "D", "C", "Bb", "A", "B", "D"]);
    expect(structuralBass.bassMotionProfile).toEqual(expect.arrayContaining([
      "STEP_ASC",
      "CHROMATIC_DESC",
      "STEP_DESC",
      "STRUCTURAL_LEAP"
    ]));
    expect(structuralBass.harmonicPlaneSegments[0]).toEqual(expect.objectContaining({
      startMeasure: 3,
      endMeasure: 11,
      independentBassCount: 3
    }));
    expect(structuralBass.independentBassCount).toBeGreaterThanOrEqual(3);
    expect(structuralBass.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ chord: "Bb/A", relation: "INDEPENDENT_BASS" }),
      expect.objectContaining({ chord: "D/C", relation: "INDEPENDENT_BASS" }),
      expect.objectContaining({ chord: "G/A", relation: "INDEPENDENT_BASS" }),
      expect.objectContaining({ chord: "G/B", relation: "TRIVIAL_INVERSION" })
    ]));
  });

  it("generates a primary melody-only harmonization while ignoring the existing chord layer", () => {
    const snapshot = loadBrightSizeLife();
    const anchors = toAnchors(firstMelodicWindow(snapshot.notes));
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, snapshot.metadata.keySignature);
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);
    const ranked = rankReharmonizationProposalsByVoiceLeading(generation.proposals, phraseContext, anchors);
    const presented = annotateProposalPresentationRoles(ranked, "balanced", phraseContext);
    const primary = presented.find(proposal => proposal.presentationRole === "primary");
    const fundamental = presented.find(proposal => proposal.name === "Estratégia — Harmonia fundamental I-IV-V");

    expect(snapshot.harmonies.length).toBeGreaterThan(0);
    expect(fundamental).toBeTruthy();
    expect(fundamental?.presentationRole).toBe("alternative");
    expect(fundamental?.measures.flatMap(measure => measure.chords).every(chord => (
      ["D", "G", "A"].includes(chord.replace(/\/[A-G](?:#|b)?$/, ""))
    ))).toBe(true);
    expect(fundamental?.explanation).toEqual(expect.arrayContaining([
      "usa somente tônica, subdominante e dominante como primeira leitura da melodia",
      "base pedagógica: I-IV-V cobre parcialmente a melodia, mas pede uma camada diatônica depois"
    ]));
    expect(primary).toBeTruthy();
    expect(primary?.name).toBe("Estratégia — Melodia primeiro");
    expect(primary?.measures.map(measure => measure.measureIndex)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(primary?.measures.flatMap(measure => measure.chords)).toEqual(expect.arrayContaining([
      "D6/9",
      "G6",
      "D"
    ]));
    expect(primary?.bassLine).not.toContain("9");
    expect(primary?.bassLine[0]).toBe("D");
  });
});
