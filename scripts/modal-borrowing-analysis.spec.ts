import { describe, expect, it } from "vitest";
import {
  analyzeModalBorrowingColor,
  analyzeModalBorrowingColors
} from "../src/utils/music/analysis/strategies/ModalBorrowingAnalysis";

describe("Modal borrowing analysis", () => {
  it("identifies bVI borrowed from the parallel minor in a major context", () => {
    const analysis = analyzeModalBorrowingColor("Abmaj7", {
      center: "C",
      mode: "major",
      idiom: "major-functional"
    });

    expect(analysis).toEqual(expect.objectContaining({
      role: "BORROWED_FLAT_VI",
      borrowedFrom: "parallel-minor",
      impliedFunction: "PD",
      root: "Ab"
    }));
    expect(analysis?.explanation).toEqual(expect.arrayContaining([
      "bVI vem do modo paralelo menor em contexto maior"
    ]));
  });

  it("identifies bVII as a controlled modal color without changing the tonal center", () => {
    const analysis = analyzeModalBorrowingColor("Bb7", {
      center: "C",
      mode: "major",
      idiom: "major-functional"
    });

    expect(analysis).toEqual(expect.objectContaining({
      role: "BORROWED_FLAT_VII",
      borrowedFrom: "parallel-minor",
      impliedFunction: "PD",
      root: "Bb"
    }));
    expect(analysis?.explanation).toEqual(expect.arrayContaining([
      "cor modal controlada sem trocar automaticamente o centro tonal"
    ]));
  });

  it("does not reinterpret minor or modal-center material as major-key borrowing", () => {
    expect(analyzeModalBorrowingColor("G", {
      center: "A",
      mode: "minor",
      idiom: "minor-functional"
    })).toBeNull();

    expect(analyzeModalBorrowingColor("C", {
      center: "D",
      mode: "major",
      idiom: "modal"
    })).toBeNull();
  });

  it("collects only bVI and bVII colors from a progression", () => {
    const analyses = analyzeModalBorrowingColors(["C", "Ab", "F", "Bb", "G7"], {
      center: "C",
      mode: "major",
      idiom: "major-functional"
    });

    expect(analyses.map(analysis => analysis.role)).toEqual([
      "BORROWED_FLAT_VI",
      "BORROWED_FLAT_VII"
    ]);
  });
});
