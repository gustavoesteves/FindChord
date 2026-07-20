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

const sixteenMeasureMelodySnapshot: ScoreSnapshot = {
  ...melodyOnlySnapshot,
  timestamp: 3,
  notes: Array.from({ length: 16 }, (_, index) => ({
    id: `n${index + 1}`,
    step: index % 2 === 0 ? "C" : "F",
    alter: 0,
    octave: 4,
    voice: 1,
    staff: 1,
    measure: index + 1,
    tickStart: index * 1920,
    tickEnd: index * 1920 + 960,
    durationTicks: 960
  })),
  metadata: {
    measures: 16,
    keySignature: "C"
  }
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
      source: "inferred-phrase-window",
      startMeasure: 1,
      endMeasure: 4
    });
  });

  it("splits melody-only scores without explicit sections into inferred 8-measure phrase windows", () => {
    useScoreSessionStore.getState().loadScore(sixteenMeasureMelodySnapshot);
    const state = useScoreSessionStore.getState();

    expect(state.indexes?.formalSections).toEqual([
      expect.objectContaining({
        label: "Parte A",
        source: "inferred-phrase-window",
        startMeasure: 1,
        endMeasure: 8
      }),
      expect.objectContaining({
        label: "Parte B",
        source: "inferred-phrase-window",
        startMeasure: 9,
        endMeasure: 16
      })
    ]);
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

  it("uses explicit measure tick ranges when inferring section bounds", () => {
    useScoreSessionStore.getState().loadScore({
      timestamp: 4,
      harmonies: [],
      notes: [
        { id: "n1", step: "C", alter: 0, octave: 4, voice: 1, staff: 1, measure: 1, tickStart: 0, tickEnd: 1440, durationTicks: 1440 },
        { id: "n4", step: "F", alter: 0, octave: 4, voice: 1, staff: 1, measure: 4, tickStart: 4320, tickEnd: 5760, durationTicks: 1440 }
      ],
      metadata: {
        measures: 4,
        timeSignature: "3/4",
        measureTicks: [
          { measure: 1, startTick: 0, endTick: 1440, timeSignature: "3/4" },
          { measure: 2, startTick: 1440, endTick: 2880, timeSignature: "3/4" },
          { measure: 3, startTick: 2880, endTick: 4320, timeSignature: "3/4" },
          { measure: 4, startTick: 4320, endTick: 5760, timeSignature: "3/4" }
        ]
      }
    });

    const section = useScoreSessionStore.getState().indexes?.formalSections[0];
    expect(section).toMatchObject({
      startMeasure: 1,
      endMeasure: 4,
      startTick: 0,
      endTick: 5760
    });
  });
});
