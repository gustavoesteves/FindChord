import { describe, expect, it } from "vitest";
import type { ScoreNoteEvent, ScoreSnapshot } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { findHarmonizableWindow } from "./real-music-audit";

function note(
  id: string,
  measure: number,
  step: string,
  alter = 0
): ScoreNoteEvent {
  const tickStart = (measure - 1) * 1920;
  return {
    id,
    step,
    alter,
    octave: 4,
    voice: 1,
    staff: 1,
    measure,
    tickStart,
    tickEnd: tickStart + 1920,
    durationTicks: 1920
  };
}

describe("real music audit timeline context", () => {
  it("uses the key timeline for the audited melodic window", () => {
    const snapshot: ScoreSnapshot = {
      timestamp: 1,
      harmonies: [],
      notes: [
        note("n1", 1, "C"),
        note("n2", 2, "E", -1),
        note("n3", 3, "G"),
        note("n4", 4, "C"),
        note("n5", 5, "E", -1),
        note("n6", 6, "G"),
        note("n7", 7, "B", -1),
        note("n8", 8, "C")
      ],
      metadata: {
        keySignature: "C",
        timeSignature: "4/4",
        keyTimeline: [
          { measure: 1, tick: 0, fifths: -3, mode: "minor", keySignature: "C" }
        ],
        timeTimeline: [
          { measure: 1, tick: 0, beats: 4, beatType: 4, timeSignature: "4/4" }
        ]
      }
    };

    const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, []);

    expect(harmonizable?.phraseContext.selectedCenter).toEqual(expect.objectContaining({
      tonic: "C",
      mode: "minor"
    }));
  });
});
