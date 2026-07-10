import { describe, expect, it } from "vitest";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import {
  melodicAnchorWindows,
  selectPresentableHarmonizationWindows
} from "../src/utils/music/analysis/strategies/PresentableWindowSelector";

function anchor(measureIndex: number, pitch = "C"): MelodicAnchor {
  return { measureIndex, pitch, duration: 480 };
}

function harmony(measure: number, symbol = "C"): ScoreHarmonyEvent {
  return {
    measure,
    beat: 1,
    harmony: symbol,
    tickStart: measure * 1920,
    tickEnd: measure * 1920 + 1920,
    durationTicks: 1920
  };
}

describe("PresentableWindowSelector", () => {
  it("creates sliding melodic windows over existing melodic measures", () => {
    const windows = melodicAnchorWindows([1, 2, 4, 6].map(measure => anchor(measure)), 3);

    expect(windows.map(window => window.map(item => item.measureIndex))).toEqual([
      [1, 2, 4],
      [2, 4, 6]
    ]);
  });

  it("marks primary, reference-covered and interesting local windows", () => {
    const anchors = Array.from({ length: 10 }, (_, index) => anchor(index + 1));
    const windows = selectPresentableHarmonizationWindows(anchors, {
      windowSize: 4,
      minReferenceCoverage: 2,
      primaryMeasures: [1, 2, 3, 4],
      interestingMeasures: [7],
      referenceHarmonies: [
        harmony(1),
        harmony(2),
        harmony(6, "G7"),
        harmony(7, "Db7")
      ]
    });

    const primary = windows.find(window => window.measureIndexes.join(" ") === "1 2 3 4");
    const localEvent = windows.find(window => window.measureIndexes.join(" ") === "4 5 6 7");

    expect(primary?.reasons).toEqual(["primary-window", "reference-coverage"]);
    expect(localEvent?.reasons).toEqual(["reference-coverage", "interesting-event"]);
    expect(localEvent?.interestingMeasures).toEqual([7]);
  });
});
