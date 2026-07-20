import { describe, expect, it } from "vitest";
import { parseChord } from "../src/utils/music/theory/chordParser";
import { classifyFunctionInMode, normalizeChordRoot } from "../src/utils/music/analysis/strategies/HarmonicStrategyValidator";

describe("chord parser slash quality handling", () => {
  it("keeps 6/9 as chord quality instead of treating 9 as slash bass", () => {
    const parsed = parseChord("C6/9");

    expect(parsed.root).toBe("C");
    expect(parsed.quality).toBe("69");
    expect(parsed.bass).toBeUndefined();
    expect(parsed.notes).toEqual(["C", "E", "G", "A", "D"]);
  });

  it("still preserves real slash bass chords", () => {
    const parsed = parseChord("C/E");

    expect(parsed.root).toBe("C");
    expect(parsed.quality).toBe("major");
    expect(parsed.bass).toBe("E");
    expect(parsed.notes).toEqual(["C", "E", "G"]);
  });

  it("does not turn 6/9 into a fake root or fake bass in functional helpers", () => {
    expect(normalizeChordRoot("C6/9")).toBe("C");
    expect(classifyFunctionInMode("C6/9", "C", "major-functional")).toBe("T");
  });
});
