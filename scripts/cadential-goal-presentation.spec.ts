import { describe, expect, it } from "vitest";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { ChromaticGravityField } from "../src/utils/music/analysis/engines/fields/ChromaticGravityField";
import { TonalGravityField } from "../src/utils/music/analysis/engines/fields/TonalGravityField";

function phraseContext(cadenceType: PhraseContext["cadentialTarget"]["cadenceType"]): PhraseContext {
  return {
    selectedCenter: { tonic: "C", mode: "major", confidence: 0.8 },
    selectedCenterSource: "melody",
    tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.8 }],
    cadentialTarget: { targetPitch: "G", cadenceType, confidence: 0.8 }
  };
}

describe("Cadential goal presentation", () => {
  it("does not call an open melodic arrival a cadence or rest", () => {
    const tonalSeed = new TonalGravityField().generateArchetypeSeeds(phraseContext("OPEN"))[0];
    const chromaticSeeds = new ChromaticGravityField().generateArchetypeSeeds(phraseContext("OPEN"));

    expect(tonalSeed.explanation[0]).toBe("Progressão orientada por ciclos de 4as/5as até a chegada melódica em G");
    expect(chromaticSeeds[0].explanation[0]).toBe("Cromatismo ascendente rumo à chegada melódica em G");
    expect(chromaticSeeds[1].explanation[0]).toBe("Cromatismo descendente contínuo (clichê romântico) rumo à chegada melódica em G");
  });

  it("names confirmed harmonic cadences as cadential destinations", () => {
    const tonalSeed = new TonalGravityField().generateArchetypeSeeds(phraseContext("AUTHENTIC"))[0];
    const chromaticSeed = new ChromaticGravityField().generateArchetypeSeeds(phraseContext("AUTHENTIC"))[0];

    expect(tonalSeed.explanation[0]).toBe("Progressão orientada por ciclos de 4as/5as até o destino cadencial em G");
    expect(chromaticSeed.explanation[0]).toBe("Cromatismo ascendente rumo ao repouso em G");
  });
});
