import {
  evolveTick,
  getLatentDiagnostics,
  resetGlobalState
} from "../src/utils/music/analysis/engines/hsmk/evolve";
import type { HarmonicFunction } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import type { ExpansionIntent } from "../src/utils/music/analysis/engines/hsmk/ExpansionIntent";
import { euclideanDist } from "../src/utils/music/analysis/engines/hsmk/EnergySolver";
import { describe, expect, it } from "vitest";

function averagePairDistance(items: Float32Array[]): number {
  if (items.length < 2) return 0;
  let total = 0;
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      total += euclideanDist(items[i], items[j]);
      count++;
    }
  }
  return total / count;
}

function averageNearestDistance(items: Float32Array[], centroids: Float32Array[]): number {
  if (items.length === 0 || centroids.length === 0) return Infinity;
  let total = 0;
  for (const item of items) {
    let nearest = Infinity;
    for (const centroid of centroids) {
      nearest = Math.min(nearest, euclideanDist(item, centroid));
    }
    total += nearest;
  }
  return total / items.length;
}

describe("F26.1.6 Temporal Field Coupling", () => {
  it("keeps temporal memory inside the active function while preserving long-arc returns", () => {
    resetGlobalState();

    const intent: ExpansionIntent = { motion: "STATIC" };
    const func: HarmonicFunction = "T";
    const center = "C";
    const iterations = 500;
    const validBasin = ["C", "Am", "Em"];
    const history: string[] = [];
    const positions: Float32Array[] = [];

    const staticObs = {
      melodyNotes: ["C", "E"],
      intent
    };

    let escapes = 0;

    for (let i = 0; i < iterations; i++) {
      const chord = evolveTick(func, staticObs, center);
      const diagnostics = getLatentDiagnostics();
      history.push(chord);
      positions.push(diagnostics.position);

      if (!validBasin.includes(chord)) {
        escapes++;
      }
    }

    const diagnosticsAfterT = getLatentDiagnostics();
    const tMemoryBeforePD = diagnosticsAfterT.temporalMemory.T.length;
    const pdMemoryBeforePD = diagnosticsAfterT.temporalMemory.PD.length;
    const dMemoryBeforePD = diagnosticsAfterT.temporalMemory.D.length;

    const uniqueChords = new Set(history);
    const lastThree = positions.slice(-3);
    const firstHundred = positions.slice(0, 100);
    const middleHundred = positions.slice(200, 300);
    const lastHundred = positions.slice(-100);
    const earlyZones = firstHundred.filter((_, idx) => idx % 10 === 0);

    const lastThreeSpread = averagePairDistance(lastThree);
    const middleToEarly = averageNearestDistance(middleHundred, earlyZones);
    const lastToEarly = averageNearestDistance(lastHundred, earlyZones);

    for (let i = 0; i < 30; i++) {
      evolveTick("PD", staticObs, center);
    }

    const diagnosticsAfterPD = getLatentDiagnostics();
    const tMemoryAfterPD = diagnosticsAfterPD.temporalMemory.T.length;
    const pdMemoryAfterPD = diagnosticsAfterPD.temporalMemory.PD.length;
    const dMemoryAfterPD = diagnosticsAfterPD.temporalMemory.D.length;

    const memoryIsolation =
      tMemoryBeforePD === tMemoryAfterPD &&
      pdMemoryBeforePD === 0 &&
      pdMemoryAfterPD > 0 &&
      dMemoryBeforePD === dMemoryAfterPD;

    console.log(`Ticks: ${iterations}`);
    console.log(`Estados decodificados distintos: ${uniqueChords.size}`);
    console.log(`Escapes funcionais: ${escapes}`);
    console.log(`Centroides T: ${tMemoryBeforePD}`);
    console.log(`Espalhamento últimos 3 estados: ${lastThreeSpread.toFixed(4)}`);
    console.log(`Distância média meio -> zonas iniciais: ${middleToEarly.toFixed(4)}`);
    console.log(`Distância média final -> zonas iniciais: ${lastToEarly.toFixed(4)}`);
    console.log(`Isolamento de memória por função: ${memoryIsolation ? "ok" : "falhou"}`);

    expect(escapes).toBe(0);
    expect(uniqueChords.size).toBeGreaterThan(1);
    expect(lastThreeSpread).toBeGreaterThan(0.05);
    expect(lastToEarly).toBeLessThanOrEqual(middleToEarly * 1.25);
    expect(memoryIsolation).toBe(true);
  });
});
