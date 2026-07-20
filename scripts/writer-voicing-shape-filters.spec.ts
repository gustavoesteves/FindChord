import { describe, expect, it } from "vitest";
import {
  hasInternalMutedGap,
  isClosedVoicingShape,
  isOpenVoicingShape
} from "../src/domains/writer/services/voicingShapeFilters";
import type { VoicingShape } from "../src/utils/music/models/VoicingShape";

function shape(frets: (number | null)[], shapeFamily = "Standard Shape"): VoicingShape {
  return {
    chordName: "C",
    frets,
    rootString: 0,
    cageShape: "C",
    positionFret: 1,
    notes: [],
    shapeFamily
  };
}

describe("writer voicing shape filters", () => {
  it("treats open strings as open voicings", () => {
    const cOpenShape = shape([3, 1, 0, 2, 3, null]);

    expect(isOpenVoicingShape(cOpenShape)).toBe(true);
    expect(isClosedVoicingShape(cOpenShape)).toBe(false);
  });

  it("keeps contiguous fretted shapes closed", () => {
    const closedShape = shape([3, 5, 5, 4, null, null]);

    expect(hasInternalMutedGap(closedShape.frets)).toBe(false);
    expect(isOpenVoicingShape(closedShape)).toBe(false);
    expect(isClosedVoicingShape(closedShape)).toBe(true);
  });

  it("treats internal muted gaps as open mechanics", () => {
    const gapShape = shape([3, null, 5, 4, null, null]);

    expect(hasInternalMutedGap(gapShape.frets)).toBe(true);
    expect(isOpenVoicingShape(gapShape)).toBe(true);
    expect(isClosedVoicingShape(gapShape)).toBe(false);
  });
});
