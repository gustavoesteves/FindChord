import { beforeEach, describe, expect, it } from "vitest";
import { useScoreSessionStore } from "../src/store/useScoreSessionStore";
import type { ScoreSnapshot } from "../src/utils/music/analysis/models/ScoreSnapshot";

const melodyOnlySnapshot: ScoreSnapshot = {
  timestamp: 1,
  harmonies: [],
  notes: [
    { id: "n1", step: "C", alter: 0, octave: 4, voice: 1, staff: 1, measure: 1, tickStart: 0, tickEnd: 960, durationTicks: 960 },
    { id: "n2", step: "D", alter: 0, octave: 4, voice: 1, staff: 1, measure: 2, tickStart: 1920, tickEnd: 2880, durationTicks: 960 },
    { id: "n3", step: "E", alter: 0, octave: 4, voice: 1, staff: 1, measure: 3, tickStart: 3840, tickEnd: 4800, durationTicks: 960 },
    { id: "n4", step: "G", alter: 0, octave: 4, voice: 1, staff: 1, measure: 4, tickStart: 5760, tickEnd: 6720, durationTicks: 960 }
  ],
  metadata: {
    measures: 4,
    keySignature: "C"
  }
};

const melodyAndHarmonySnapshot: ScoreSnapshot = {
  ...melodyOnlySnapshot,
  timestamp: 2,
  harmonies: [
    { measure: 1, beat: 1, harmony: "C", tickStart: 0, tickEnd: 1920, durationTicks: 1920 },
    { measure: 2, beat: 1, harmony: "F", tickStart: 1920, tickEnd: 3840, durationTicks: 1920 },
    { measure: 3, beat: 1, harmony: "G7", tickStart: 3840, tickEnd: 5760, durationTicks: 1920 },
    { measure: 4, beat: 1, harmony: "C", tickStart: 5760, tickEnd: 7680, durationTicks: 1920 }
  ]
};

describe("Score ingestion modes", () => {
  beforeEach(() => {
    useScoreSessionStore.getState().clearSession();
  });

  it("loads a melody-only score as a harmonizer snapshot", () => {
    useScoreSessionStore.getState().loadScore(melodyOnlySnapshot);
    const state = useScoreSessionStore.getState();

    expect(state.scoreSnapshot?.notes?.length).toBe(4);
    expect(state.scoreSnapshot?.harmonies.length).toBe(0);
    expect(state.indexes?.formalSections.length).toBeGreaterThan(0);
    expect(state.indexes?.formalSections[0]).toMatchObject({
      label: "Parte A",
      startMeasure: 1,
      endMeasure: 4
    });
  });

  it("loads a score with melody and injected chords without deriving extra regions", () => {
    useScoreSessionStore.getState().loadScore(melodyAndHarmonySnapshot);
    const state = useScoreSessionStore.getState();

    expect(state.scoreSnapshot?.notes?.length).toBe(4);
    expect(state.scoreSnapshot?.harmonies.length).toBe(4);
    expect(state.indexes?.formalSections.length).toBeGreaterThan(0);
    expect(state.indexes?.formalSections[0].startTick).toBe(0);
    expect(state.indexes?.formalSections[0].endTick).toBeGreaterThan(0);
  });
});
