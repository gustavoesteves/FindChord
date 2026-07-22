import { describe, expect, it } from "vitest";
import { proposalToWriterProgression } from "../src/domains/harmonizer/hooks/useApplyProposalToWriter";
import { useChordStore } from "../src/store/useChordStore";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";

const proposal: ReharmonizationProposal = {
  id: "test-proposal",
  kind: "validated-harmonization",
  name: "Estratégia — Teste",
  measures: [
    { measureIndex: 4, chords: ["Cmaj7"] },
    { measureIndex: 5, chords: ["Dm7", "G7/B"] }
  ],
  explanation: [],
  bassLine: []
};

describe("apply proposal to Writer", () => {
  it("preserves progression order and measure metadata", () => {
    const progression = proposalToWriterProgression(proposal);

    expect(progression).toEqual([
      { id: "test-proposal-4-0", measureIndex: 4, chordIndex: 0, order: 0, chord: "Cmaj7" },
      { id: "test-proposal-5-0", measureIndex: 5, chordIndex: 0, order: 1, chord: "Dm7" },
      { id: "test-proposal-5-1", measureIndex: 5, chordIndex: 1, order: 2, chord: "G7/B" }
    ]);
  });

  it("prefers timed proposal events when applying dense harmonizations", () => {
    const timedProposal: ReharmonizationProposal = {
      ...proposal,
      events: [
        {
          id: "late-g",
          measureIndex: 5,
          beat: 3,
          chord: "G7/B",
          chordIndex: 1,
          occurrenceInMeasure: 1,
          tickStart: 2880,
          tickEnd: 3840,
          durationTicks: 960
        },
        {
          id: "early-d",
          measureIndex: 5,
          beat: 1,
          chord: "Dm7",
          chordIndex: 0,
          occurrenceInMeasure: 0,
          tickStart: 1920,
          tickEnd: 2880,
          durationTicks: 960
        },
        {
          id: "opening-c",
          measureIndex: 4,
          beat: 1,
          chord: "Cmaj7",
          chordIndex: 0,
          occurrenceInMeasure: 0,
          tickStart: 0,
          tickEnd: 1920,
          durationTicks: 1920
        }
      ]
    };

    expect(proposalToWriterProgression(timedProposal)).toEqual([
      expect.objectContaining({
        id: "opening-c",
        eventId: "opening-c",
        measureIndex: 4,
        beat: 1,
        tickStart: 0,
        tickEnd: 1920,
        durationTicks: 1920,
        order: 0,
        chord: "Cmaj7"
      }),
      expect.objectContaining({
        id: "early-d",
        eventId: "early-d",
        measureIndex: 5,
        beat: 1,
        tickStart: 1920,
        tickEnd: 2880,
        durationTicks: 960,
        order: 1,
        chord: "Dm7"
      }),
      expect.objectContaining({
        id: "late-g",
        eventId: "late-g",
        measureIndex: 5,
        beat: 3,
        tickStart: 2880,
        tickEnd: 3840,
        durationTicks: 960,
        order: 2,
        chord: "G7/B"
      })
    ]);
  });

  it("loads a playable voicing for the first applied chord", () => {
    const store = useChordStore.getState();

    store.clearFretboard();
    store.setProgressionItems(proposalToWriterProgression(proposal));

    const state = useChordStore.getState();
    expect(state.progressionChords).toEqual(["Cmaj7", "Dm7", "G7/B"]);
    expect(state.progressionItems[0]).toMatchObject({ measureIndex: 4, chord: "Cmaj7" });
    expect(state.activeProgressionIndex).toBe(0);
    expect(state.selectedFrets.some(fret => fret !== null)).toBe(true);
    expect(state.detectedChords[0]?.root).toBe("C");
  });
});
