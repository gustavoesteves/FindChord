import { describe, expect, it } from "vitest";
import { FunctionalRegionPlanner } from "../src/utils/music/analysis/strategies/FunctionalRegionPlanner";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";

function anchorsForMeasures(measures: number[]): MelodicAnchor[] {
  return measures.map(measureIndex => ({
    measureIndex,
    pitch: "C",
    duration: 960
  }));
}

describe("F28.2 Functional Region Planner", () => {
  it("splits an eight-measure phrase window into two four-measure functional arcs", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors(anchorsForMeasures([9, 10, 11, 12, 13, 14, 15, 16]));

    expect(regions.map(region => ({
      measureIndex: region.measureIndex,
      phraseIndex: region.phraseIndex,
      role: region.role,
      functionId: region.functionId
    }))).toEqual([
      { measureIndex: 9, phraseIndex: 0, role: "ESTABLISHMENT", functionId: "T" },
      { measureIndex: 10, phraseIndex: 0, role: "SUBDOMINANT_RESPONSE", functionId: "PD" },
      { measureIndex: 11, phraseIndex: 0, role: "DOMINANT_PREPARATION", functionId: "D" },
      { measureIndex: 12, phraseIndex: 0, role: "CADENTIAL_RESOLUTION", functionId: "T" },
      { measureIndex: 13, phraseIndex: 1, role: "ESTABLISHMENT", functionId: "T" },
      { measureIndex: 14, phraseIndex: 1, role: "SUBDOMINANT_RESPONSE", functionId: "PD" },
      { measureIndex: 15, phraseIndex: 1, role: "DOMINANT_PREPARATION", functionId: "D" },
      { measureIndex: 16, phraseIndex: 1, role: "CADENTIAL_RESOLUTION", functionId: "T" }
    ]);
  });

  it("marks the final and penultimate measures of each internal arc", () => {
    const regions = FunctionalRegionPlanner.planFromMeasureIndexes([1, 2, 3, 4, 5]);

    expect(regions.filter(region => region.isCadentialPreparation).map(region => region.measureIndex)).toEqual([3]);
    expect(regions.filter(region => region.isPhraseFinal).map(region => region.measureIndex)).toEqual([4, 5]);
  });
});

describe("F28.3 Melodic Region Evidence", () => {
  it("uses melodic weight to recognize structural subdominant response", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors([
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 1920 },
      { measureIndex: 2, pitch: "A", duration: 240 },
      { measureIndex: 3, pitch: "G", duration: 1920 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ], "C");

    expect(regions[1]).toMatchObject({
      measureIndex: 2,
      role: "SUBDOMINANT_RESPONSE",
      functionId: "PD"
    });
    expect(regions[1].confidence).toBeGreaterThanOrEqual(0.78);
    expect(regions[1].evidence).toContain("a melodia sustenta o quarto grau como abertura subdominante");
  });

  it("adds melodic evidence for dominant preparation and tonal closure", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors([
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ], "C");

    expect(regions[2].evidence).toContain("a melodia sustenta o quinto grau como preparação dominante");
    expect(regions[3].evidence).toContain("a melodia repousa no centro tonal no fechamento");
  });
});

describe("F28.4 Cadential Closure Reading", () => {
  it("classifies dominant-to-tonic closure as authentic", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors([
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 1920 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ], "C");

    expect(regions[3]).toMatchObject({
      cadenceKind: "AUTHENTIC",
      cadentialTarget: "C"
    });
    expect(regions[3].evidence).toContain("a subfrase fecha com preparação dominante e repouso no centro");
  });

  it("classifies subdominant-to-tonic closure as plagal", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors([
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "G", duration: 960 },
      { measureIndex: 3, pitch: "F", duration: 1920 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ], "C");

    expect(regions[3]).toMatchObject({
      cadenceKind: "PLAGAL",
      cadentialTarget: "C"
    });
    expect(regions[3].evidence).toContain("a subfrase fecha por gesto plagal em direção ao centro");
  });

  it("classifies closure on the dominant as half cadence", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors([
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "D", duration: 960 },
      { measureIndex: 4, pitch: "G", duration: 1920 }
    ], "C");

    expect(regions[3]).toMatchObject({
      cadenceKind: "HALF",
      cadentialTarget: "G"
    });
    expect(regions[3].evidence).toContain("a subfrase termina suspensa no quinto grau");
  });

  it("keeps non-tonic and non-dominant endings open", () => {
    const regions = FunctionalRegionPlanner.planFromAnchors([
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 960 },
      { measureIndex: 4, pitch: "E", duration: 1920 }
    ], "C");

    expect(regions[3]).toMatchObject({
      cadenceKind: "OPEN",
      cadentialTarget: "E"
    });
    expect(regions[3].evidence).toContain("a subfrase termina aberta, sem repouso tonal forte");
  });
});
