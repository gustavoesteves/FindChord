import { describe, expect, it } from "vitest";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { buildControlledReharmonizationProposals } from "../src/domains/harmonizer/services/harmonizerService";

function harmony(measure: number, chord: string): ScoreHarmonyEvent {
  return {
    measure,
    beat: 1,
    harmony: chord,
    tickStart: (measure - 1) * 1920,
    tickEnd: measure * 1920,
    durationTicks: 1920
  };
}

function harmonyAt(measure: number, beat: number, chord: string, tickStart: number): ScoreHarmonyEvent {
  return {
    measure,
    beat,
    harmony: chord,
    tickStart,
    tickEnd: tickStart + 480,
    durationTicks: 480
  };
}

function anchor(measureIndex: number, pitch: string): MelodicAnchor {
  return {
    measureIndex,
    pitch,
    duration: 480,
    startTick: (measureIndex - 1) * 1920,
    endTick: (measureIndex - 1) * 1920 + 480
  };
}

function referenceContext(): PhraseContext {
  return {
    selectedCenter: { tonic: "E", mode: "minor", confidence: 0.9 },
    selectedCenterSource: "reference",
    tonalCenterCandidates: [{ tonic: "E", mode: "minor", confidence: 0.9 }],
    cadentialTarget: { targetPitch: "E", cadenceType: "OPEN", confidence: 0.8 }
  };
}

function majorReferenceContext(tonic: string): PhraseContext {
  return {
    selectedCenter: { tonic, mode: "major", confidence: 0.9 },
    selectedCenterSource: "reference",
    tonalCenterCandidates: [{ tonic, mode: "major", confidence: 0.9 }],
    cadentialTarget: { targetPitch: tonic, cadenceType: "OPEN", confidence: 0.8 }
  };
}

describe("Harmonizer controlled proposals", () => {
  it("normalizes raw imported chord spellings in reference-rhythm proposals", () => {
    const proposals = buildControlledReharmonizationProposals(
      [
        harmony(1, "Asus4(7,9,11,13)"),
        harmony(1, "Bsus4(7)")
      ],
      [anchor(1, "A"), anchor(1, "B")],
      referenceContext()
    );

    const rhythm = proposals.find(proposal => proposal.id === "controlled-reference-rhythm");

    expect(rhythm?.measures[0].chords).toEqual(["A13sus4", "B7sus4"]);
    expect(rhythm?.explanation).toContain("normaliza a cifragem mantendo a harmonia escrita");
  });

  it("preserves half-diminished and altered reference colors in contour proposals", () => {
    const proposals = buildControlledReharmonizationProposals(
      [
        harmony(1, "Bbmaj7"),
        harmony(2, "Ebm/Bb"),
        harmony(3, "Am7b5"),
        harmony(4, "D7(#9)")
      ],
      [anchor(1, "G"), anchor(2, "Gb"), anchor(3, "C"), anchor(4, "F#")],
      majorReferenceContext("Bb")
    );

    const contour = proposals.find(proposal => proposal.id === "controlled-reference-contour");
    const chords = contour?.measures.flatMap(measure => measure.chords);

    expect(chords).toContain("Am7b5");
    expect(chords).toContain("D7(#9)");
    expect(chords).not.toContain("Am");
    expect(chords).not.toContain("D7");
  });

  it("substitutes only the targeted occurrence when a measure repeats the same chord", () => {
    const proposals = buildControlledReharmonizationProposals(
      [
        harmonyAt(1, 1, "Cmaj7", 0),
        harmonyAt(2, 1, "Fmaj7", 1920),
        harmonyAt(2, 3, "Fmaj7", 2880),
        harmonyAt(3, 1, "G7", 3840),
        harmonyAt(4, 1, "Cmaj7", 5760)
      ],
      [anchor(2, "A"), anchor(2, "C")],
      majorReferenceContext("C")
    );

    const controlled = proposals.find(proposal => proposal.id === "controlled-substitution-0");

    expect(controlled?.measures.find(measure => measure.measureIndex === 2)?.chords).toEqual([
      "F#m7(b5)",
      "Fmaj7"
    ]);
    expect(controlled?.events?.filter(event => event.measureIndex === 2)).toEqual([
      expect.objectContaining({
        beat: 1,
        chord: "F#m7(b5)",
        originalChord: "Fmaj7",
        tickStart: 1920,
        tickEnd: 2400,
        occurrenceInMeasure: 0
      }),
      expect.objectContaining({
        beat: 3,
        chord: "Fmaj7",
        originalChord: undefined,
        tickStart: 2880,
        tickEnd: 3360,
        occurrenceInMeasure: 1
      })
    ]);
  });
});
