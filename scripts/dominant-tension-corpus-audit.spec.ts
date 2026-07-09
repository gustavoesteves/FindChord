import { describe, expect, it } from "vitest";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { summarizeDominantTensionUsage } from "./audit-dominant-tension-corpus";

function harmony(harmonySymbol: string, index: number): ScoreHarmonyEvent {
  return {
    measure: index + 1,
    beat: 1,
    harmony: harmonySymbol,
    tickStart: index * 480,
    tickEnd: (index + 1) * 480,
    durationTicks: 480
  };
}

function progression(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map(harmony);
}

describe("Dominant tension corpus audit", () => {
  it("separates simple, color, altered and highly altered dominants", () => {
    const summary = summarizeDominantTensionUsage(
      progression(["C", "G7", "C", "G13", "C", "A7(b9)", "Dm7", "G7alt", "C"])
    );

    expect(summary.simple).toBe(1);
    expect(summary.color).toBe(1);
    expect(summary.altered).toBe(1);
    expect(summary.highAltered).toBe(1);
    expect(summary.resolvedAltered).toBe(2);
    expect(summary.unresolvedAltered).toBe(0);
    expect(summary.resolvedColor).toBe(1);
  });

  it("counts altered dominants without immediate target as unresolved or deceptive", () => {
    const summary = summarizeDominantTensionUsage(
      progression(["C", "E13", "Bmaj7", "Cmaj7", "G7alt", "Bmaj7", "Emaj7", "Db7(b9)", "C", "A7(b9)", "Em7", "Dm7"])
    );

    expect(summary.unresolvedAltered).toBe(1);
    expect(summary.unresolvedColor).toBe(1);
    expect(summary.subVResolutions).toBe(1);
    expect(summary.resolvedAltered).toBe(1);
    expect(summary.contextualAltered).toBe(1);
    expect(summary.delayedResolutions).toBe(1);
  });
});
