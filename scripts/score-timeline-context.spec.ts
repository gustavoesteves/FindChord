import { describe, expect, it } from "vitest";
import type { ScoreSnapshot } from "../src/utils/music/analysis/models/ScoreSnapshot";
import {
  measureNumberAtTick,
  measureTicksForMetricContext,
  timelineContextAtTick,
  timelineContextForSection
} from "../src/utils/music/analysis/scoreTimelineContext";

function snapshotWithTimeline(): ScoreSnapshot {
  return {
    timestamp: 1,
    harmonies: [],
    notes: [],
    metadata: {
      keySignature: "C",
      timeSignature: "4/4",
      measureTicks: [
        { measure: 1, startTick: 0, endTick: 1920, timeSignature: "4/4" },
        { measure: 5, startTick: 7680, endTick: 9120, timeSignature: "3/4" }
      ],
      keyTimeline: [
        { measure: 1, tick: 0, fifths: -3, mode: "minor", keySignature: "C" },
        { measure: 5, tick: 7680, fifths: 2, mode: "major", keySignature: "D" }
      ],
      timeTimeline: [
        { measure: 1, tick: 0, beats: 4, beatType: 4, timeSignature: "4/4" },
        { measure: 5, tick: 7680, beats: 3, beatType: 4, timeSignature: "3/4" }
      ]
    }
  };
}

describe("score timeline context", () => {
  it("resolves key and meter at a timeline tick", () => {
    const snapshot = snapshotWithTimeline();

    expect(timelineContextAtTick(snapshot, 0)).toMatchObject({
      keySignature: "Cm",
      timeSignature: "4/4"
    });
    expect(timelineContextAtTick(snapshot, 8000)).toMatchObject({
      keySignature: "D",
      timeSignature: "3/4"
    });
  });

  it("resolves context from the active section start", () => {
    const snapshot = snapshotWithTimeline();

    expect(timelineContextForSection(snapshot, {
      startMeasure: 5,
      startTick: 7680
    })).toMatchObject({
      keySignature: "D",
      timeSignature: "3/4"
    });
  });

  it("falls back to legacy metadata when timelines are absent", () => {
    const snapshot: ScoreSnapshot = {
      timestamp: 1,
      harmonies: [],
      notes: [],
      metadata: {
        keySignature: "F",
        timeSignature: "2/4"
      }
    };

    expect(timelineContextForSection(snapshot, undefined)).toMatchObject({
      keySignature: "F",
      timeSignature: "2/4"
    });
  });

  it("maps ticks to measures using explicit measure ranges", () => {
    const measureTicks = [
      { measure: 1, startTick: 0, endTick: 1440, timeSignature: "3/4" },
      { measure: 2, startTick: 1440, endTick: 2880, timeSignature: "3/4" },
      { measure: 3, startTick: 2880, endTick: 4320, timeSignature: "3/4" }
    ];

    expect(measureNumberAtTick(measureTicks, 1439)).toBe(1);
    expect(measureNumberAtTick(measureTicks, 1440)).toBe(2);
    expect(measureNumberAtTick(measureTicks, 3000)).toBe(3);
    expect(measureNumberAtTick(measureTicks, 4320)).toBe(4);
  });

  it("only promotes measure ticks automatically for non-common meter contexts", () => {
    const snapshot = snapshotWithTimeline();
    expect(measureTicksForMetricContext(snapshot)).toBe(snapshot.metadata.measureTicks);

    expect(measureTicksForMetricContext({
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        timeSignature: "4/4",
        timeTimeline: [
          { measure: 1, tick: 0, beats: 4, beatType: 4, timeSignature: "4/4" }
        ]
      }
    })).toBeUndefined();

    expect(measureTicksForMetricContext({
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        timeSignature: "2/2",
        timeTimeline: [
          { measure: 1, tick: 0, beats: 2, beatType: 2, timeSignature: "2/2" }
        ],
        measureTicks: [
          { measure: 1, startTick: 0, endTick: 48, timeSignature: "2/2" },
          { measure: 2, startTick: 48, endTick: 240, timeSignature: "2/2" }
        ]
      }
    })).toBeUndefined();
  });
});
