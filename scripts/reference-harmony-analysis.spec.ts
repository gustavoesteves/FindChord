import { describe, expect, it } from "vitest";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";

function harmonies(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map((harmony, index) => ({
    measure: index + 1,
    beat: 1,
    harmony,
    tickStart: index * 1920,
    tickEnd: (index + 1) * 1920,
    durationTicks: 1920
  }));
}

describe("F26.9 Reference Harmony Analysis Contract", () => {
  it("summarizes existing harmony as analysis material instead of a generated proposal", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["Gmaj7", "Bb/A", "D9", "D/C", "Bbmaj7", "G/A", "G/B", "D"]));

    expect(analysis.hasExistingHarmony).toBe(true);
    expect(analysis.bassTrajectory).toEqual(["G", "A", "D", "C", "Bb", "A", "B", "D"]);
    expect(analysis.directCadentialDependency).toBe("low");
    expect(analysis.properties).toEqual(expect.arrayContaining([
      "STRUCTURAL_BASS_GRAMMAR",
      "PLANAR_CHORD_MOTION",
      "LOW_DIRECT_CADENTIAL_DEPENDENCE"
    ]));
    expect(analysis.slashChordProfile.independentBassRelations).toEqual(expect.arrayContaining([
      "Bb/A",
      "D/C",
      "G/A"
    ]));
    expect(analysis.slashChordProfile.functionalInversions).toContain("G/B");
    expect(analysis.explanation).toEqual(expect.arrayContaining([
      "O baixo atua como linha estrutural, não apenas como consequência da cifra",
      "Ponto de comparação para as alternativas de rearmonização"
    ]));
  });

  it("keeps ordinary functional inversions separate from structural bass grammar", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["D", "D/F#", "G", "A7/E", "D"]));

    expect(analysis.hasExistingHarmony).toBe(true);
    expect(analysis.properties).not.toContain("STRUCTURAL_BASS_GRAMMAR");
    expect(analysis.properties).not.toContain("PLANAR_CHORD_MOTION");
    expect(analysis.slashChordProfile.independentBassRelations).toHaveLength(0);
    expect(analysis.slashChordProfile.functionalInversions).toEqual(expect.arrayContaining(["D/F#", "A7/E"]));
  });

  it("summarizes local ii-V cadences found in the existing harmony layer", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["Am7", "D7", "Gmaj7", "F#m7(b5)", "B7(b13)", "Em6"]));

    expect(analysis.localCadences).toEqual(expect.arrayContaining([
      "ii-V-I local em G maior",
      "iiø-V-i local em E menor"
    ]));
    expect(analysis.explanation).toContain("Contém ii-V-I local em G maior; iiø-V-i local em E menor");
  });

  it("reports blues as an existing harmonic idiom instead of dominant errors", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["C7", "F7", "C7", "G7", "F7", "C7"]));

    expect(analysis.idiom).toEqual(expect.objectContaining({
      idiom: "blues",
      confidence: "medium"
    }));
    expect(analysis.explanation).toContain("Idioma harmônico sugerido: blues");
  });

  it("reports modal loops as an existing harmonic idiom", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["Dm", "C", "Bb", "C", "Dm"]));

    expect(analysis.idiom).toEqual(expect.objectContaining({
      idiom: "modal",
      confidence: "medium"
    }));
    expect(analysis.minorModalBoundary).toEqual({
      boundary: "modal-center",
      evidence: ["referência gira em i-bVII/bVI sem sensível cadencial"]
    });
    expect(analysis.explanation).toContain("Idioma harmônico sugerido: modal");
    expect(analysis.explanation).toContain("Fronteira menor/modal: referência favorece centro modal sem sensível");
  });

  it("reports minor-functional reference harmony with minor field evidence", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["Am", "G", "F", "E7", "Am"]));

    expect(analysis.idiom).toEqual(expect.objectContaining({
      idiom: "minor-functional",
      confidence: "strong"
    }));
    expect(analysis.idiom?.evidence).toEqual(expect.arrayContaining([
      "menor natural aparece por bVI e bVII",
      "sensível sustenta menor harmônico"
    ]));
    expect(analysis.minorModalBoundary).toEqual({
      boundary: "minor-functional-cadential",
      evidence: ["referência usa V7 -> i em menor"]
    });
    expect(analysis.explanation).toContain("Idioma harmônico sugerido: menor funcional");
    expect(analysis.explanation).toContain("Fronteira menor/modal: referência confirma menor funcional por cadência");
  });

  it("uses iiø-V-i in the reference layer as minor-functional boundary evidence", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["Bm7(b5)", "E7(b13)", "Am6"]));

    expect(analysis.minorModalBoundary).toEqual({
      boundary: "minor-functional-cadential",
      evidence: [
        "referência usa V7 -> i em menor",
        "referência usa iiø-V-i em menor"
      ]
    });
    expect(analysis.explanation).toContain("Fronteira menor/modal: referência confirma menor funcional por cadência");
  });

  it("returns an empty reference contract when the score has no harmony layer", () => {
    const analysis = analyzeReferenceHarmony([]);

    expect(analysis.hasExistingHarmony).toBe(false);
    expect(analysis.bassTrajectory).toHaveLength(0);
    expect(analysis.localCadences).toHaveLength(0);
    expect(analysis.explanation).toHaveLength(0);
  });
});
