import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createRequire } from "node:module";
import { detectIiVFunctionalCells } from "../src/utils/music/analysis/strategies/IiVFunctionalGrammar";
import { analyzeStructuralBassGrammar } from "../src/utils/music/analysis/strategies/StructuralBassGrammar";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

function loadBrightSizeLife() {
  return parseMusicXML(fs.readFileSync("./docs/Bright Size Life.musicxml", "utf8"));
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
});
