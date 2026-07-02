import { describe, expect, it } from "vitest";
import { evaluateHarmonicRouteDistance } from "../src/utils/music/analysis/strategies/HarmonicRouteDistance";

describe("F31 Harmonic Route Distance", () => {
  it("prefers a coherent ii-V-I route over a distant chromatic route", () => {
    const coherent = evaluateHarmonicRouteDistance({
      chords: ["Dm7", "G7", "Cmaj7"],
      center: "C"
    });
    const distant = evaluateHarmonicRouteDistance({
      chords: ["Cmaj7", "F#7", "Cmaj7"],
      center: "C"
    });

    expect(coherent.cost).toBeLessThan(distant.cost);
    expect(coherent.profile).toBe("conservative");
    expect(coherent.averageVoiceLeadingScore).toBeGreaterThan(distant.averageVoiceLeadingScore);
    expect(coherent.evidence).toContain("rota ganha clareza por resolução de guide tones");
  });

  it("keeps resolved SubV7 cheaper than unresolved chromatic dominant motion", () => {
    const resolved = evaluateHarmonicRouteDistance({
      chords: ["Db7", "Cmaj7"],
      center: "C"
    });
    const unresolved = evaluateHarmonicRouteDistance({
      chords: ["G7", "F#7"],
      center: "C"
    });

    expect(resolved.cost).toBeLessThan(unresolved.cost);
    expect(resolved.profile).toBe("chromatic");
    expect(resolved.steps[0].voiceLeading.guideToneResolutionCount).toBeGreaterThan(0);
    expect(unresolved.unresolvedPenalty).toBeGreaterThan(0);
  });

  it("can evaluate minor-functional routes with the explicit minor classifier", () => {
    const route = evaluateHarmonicRouteDistance({
      chords: ["Am", "Bm7(b5)", "E7b13", "Am"],
      center: "A",
      classificationMode: "minor-functional"
    });

    expect(route.steps.map(step => [step.fromFunction, step.toFunction])).toEqual([
      ["T", "PD"],
      ["PD", "D"],
      ["D", "T"]
    ]);
    expect(route.profile).toBe("moderate");
    expect(route.cost).toBeLessThan(8);
  });

  it("classifies unresolved distant routes as radical", () => {
    const route = evaluateHarmonicRouteDistance({
      chords: ["Cmaj7", "F#7", "B7", "F7"],
      center: "C"
    });

    expect(route.profile).toBe("radical");
    expect(route.evidence).toContain("rota radical");
  });

  it("returns a neutral zero-transition report for a single chord", () => {
    const route = evaluateHarmonicRouteDistance({
      chords: ["Cmaj7"],
      center: "C"
    });

    expect(route).toEqual(expect.objectContaining({
      cost: 0,
      profile: "conservative",
      transitionCount: 0,
      averageVoiceLeadingScore: 0
    }));
  });
});
