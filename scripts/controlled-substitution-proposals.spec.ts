import { describe, expect, it } from "vitest";
import { generateControlledSubstitutionProposals } from "../src/utils/music/analysis/strategies/ControlledSubstitutionProposals";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";

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

function anchorsByMeasure(pitchesByMeasure: Record<number, string[]>): MelodicAnchor[] {
  return Object.entries(pitchesByMeasure).flatMap(([measure, pitches]) => (
    pitches.map(pitch => ({
      measureIndex: Number(measure),
      pitch,
      duration: 480
    }))
  ));
}

describe("F26.10c Controlled Substitution Proposals", () => {
  it("generates one controlled rearmonization when function and melody are preserved", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["Cmaj7", "Fmaj7", "G7", "Cmaj7"]),
      anchorsByMeasure({ 2: ["A", "C"] }),
      "C"
    );

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toEqual(expect.objectContaining({
      originalChord: "Fmaj7",
      substituteChord: "F#m7(b5)",
      measure: 2,
      targetTickStart: 1920,
      targetOccurrenceInMeasure: 0,
      preservedFunction: "PD"
    }));
    expect(proposals[0].validation.accepted).toBe(true);
    expect(proposals[0].explanation).toEqual(expect.arrayContaining([
      "Preserva a função de preparação",
      "Mantém compatibilidade com a melodia"
    ]));
  });

  it("limits the first pass to one substitution per phrase", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["Cmaj7", "Fmaj7", "Fmaj7", "G7", "Cmaj7"]),
      anchorsByMeasure({ 2: ["A", "C"], 3: ["A", "C"] }),
      "C"
    );

    expect(proposals).toHaveLength(1);
  });

  it("fails silently when the substitute does not cover the melody", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["Cmaj7", "Fmaj7", "G7", "Cmaj7"]),
      anchorsByMeasure({ 2: ["G"] }),
      "C"
    );

    expect(proposals).toHaveLength(0);
  });

  it("does not alter a chord with explicit structural bass in this first pass", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["Cmaj7", "Fmaj7/A", "G7", "Cmaj7"]),
      anchorsByMeasure({ 2: ["A", "C"] }),
      "C"
    );

    expect(proposals).toHaveLength(0);
  });

  it("returns no proposals when there is no existing harmony layer", () => {
    const proposals = generateControlledSubstitutionProposals([], anchorsByMeasure({ 2: ["A", "C"] }), "C");

    expect(proposals).toHaveLength(0);
  });

  it("uses the substitution table for tonic relatives", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["G7", "Cmaj7", "Fmaj7", "G7", "Cmaj7"]),
      anchorsByMeasure({ 2: ["A", "C"] }),
      "C"
    );

    expect(proposals[0]).toEqual(expect.objectContaining({
      originalChord: "Cmaj7",
      substituteChord: "Am",
      preservedFunction: "T"
    }));
    expect(proposals[0].substitution).toEqual(expect.objectContaining({
      id: "TONIC_RELATIVE_MINOR",
      template: "vi"
    }));
  });

  it("uses the substitution table for resolved dominant SubV7", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["Cmaj7", "Fmaj7", "G7", "Cmaj7"]),
      anchorsByMeasure({ 3: ["F", "Ab"] }),
      "C"
    );

    expect(proposals[0]).toEqual(expect.objectContaining({
      originalChord: "G7",
      substituteChord: "Db7",
      preservedFunction: "D"
    }));
    expect(proposals[0].explanation).toEqual(expect.arrayContaining([
      "SubV7 preserva impulso dominante com baixo cromatico",
      "SubV7 resolve cromaticamente no centro tonal"
    ]));
  });

  it("can use the minor-functional catalog when explicitly requested", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["E7", "Am", "Dm", "E7", "Am"]),
      anchorsByMeasure({ 2: ["C", "E"] }),
      "A",
      1,
      "minor-functional"
    );

    expect(proposals[0]).toEqual(expect.objectContaining({
      originalChord: "Am",
      substituteChord: "C",
      preservedFunction: "T"
    }));
    expect(proposals[0].substitution).toEqual(expect.objectContaining({
      id: "MINOR_TONIC_RELATIVE_MAJOR",
      template: "bIII",
      idiom: "minor-functional"
    }));
  });

  it("infers minor-functional substitutions when the phrase strongly implies minor", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["E7", "Am", "Dm", "E7", "Am"]),
      anchorsByMeasure({ 2: ["C", "E"] }),
      "A"
    );

    expect(proposals[0]).toEqual(expect.objectContaining({
      originalChord: "Am",
      substituteChord: "C",
      preservedFunction: "T",
      idiom: "minor-functional"
    }));
  });

  it("does not force major-functional substitutions over a detected blues idiom", () => {
    const proposals = generateControlledSubstitutionProposals(
      harmonies(["C7", "F7", "C7", "G7", "F7", "C7"]),
      anchorsByMeasure({ 2: ["A", "C"] }),
      "C"
    );

    expect(proposals).toHaveLength(0);
  });
});
