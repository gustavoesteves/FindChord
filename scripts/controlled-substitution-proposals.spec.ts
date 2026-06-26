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
      preservedFunction: "PD"
    }));
    expect(proposals[0].validation.accepted).toBe(true);
    expect(proposals[0].explanation).toEqual(expect.arrayContaining([
      "Preserva função PD",
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
});
