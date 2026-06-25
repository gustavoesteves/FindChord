import type { MelodicAnchor } from "../models/ProjectionSet";
import type { HarmonicSeed, HarmonicFunction } from "../models/HarmonicSeed";
import type { NarrativePressure } from "../models/NarrativeState";
import type { HarmonicForm, HarmonicPotentialField, HarmonicRegion, TonalGravityMap } from "../models/HarmonicForm";
import { NarrativeEngine } from "./NarrativeEngine";

export class HarmonicRegionResolver {
  public static resolve(
    anchors: MelodicAnchor[],
    seed: HarmonicSeed,
    gravityMap: TonalGravityMap,
    initialState: NarrativePressure
  ): HarmonicForm {
    if (anchors.length === 0) return { regions: [] };

    const startTick = anchors[0].startTick ?? 0;
    const endTick = anchors[anchors.length - 1].endTick ?? (anchors.length * 1920);

    const TICKS_PER_QUARTER = 480;
    const TICKS_PER_MEASURE = 1920;

    let regions: HarmonicRegion[] = [];
    let currentFunctionIdx = 0;
    let skeleton = seed.skeleton.functions;

    let currentState = { ...initialState };

    let currentField: HarmonicPotentialField = {
      function: skeleton[currentFunctionIdx],
      energy: 0,
      decay: gravityMap.inertia,
      anchorForce: gravityMap.gravityStrength[this.getGravityKey(skeleton[currentFunctionIdx])] || 0.5
    };

    let regionStartTick = startTick;
    let regionStartMeasure = Math.floor(startTick / TICKS_PER_MEASURE) + 1;

    // Predict base perturbation from bass contour
    let bassPerturbation = 0.1;
    switch (seed.bassContour.tendency) {
      case "STEPWISE": bassPerturbation = 0.15; break;
      case "LEAP": bassPerturbation = 0.3; break;
      case "CHROMATIC": bassPerturbation = 0.6; break;
      case "CYCLE_OF_5THS": bassPerturbation = 0.4; break;
    }

    for (let t = startTick; t < endTick; t += TICKS_PER_QUARTER) {
      // Find active melody anchor
      const activeAnchor = anchors.find(a => t >= (a.startTick ?? 0) && t < (a.endTick ?? 0)) || anchors[0];

      // Calculate Melody Perturbation
      let melodyPerturbation = activeAnchor.pitch.includes("#") || activeAnchor.pitch.includes("b") ? 0.3 : 0.1;

      const localPerturbation = bassPerturbation + melodyPerturbation;

      // Calculate Narrative Pressure
      const narrativeMod = NarrativeEngine.getNarrativeModulation(currentState);
      const narrativePressure = narrativeMod.tensionPressure;

      // Base stability depends on function and field constraints
      const baseStability = 1.0; 

      const effectiveEnergy = localPerturbation + narrativePressure - (baseStability * currentField.anchorForce);

      // Update Decay
      const instabilityInput = effectiveEnergy > 0 ? effectiveEnergy * 0.1 : 0;
      const tonalAnchorPull = currentField.anchorForce * 0.05;
      
      currentField.decay = currentField.decay - instabilityInput + tonalAnchorPull;
      currentField.energy += effectiveEnergy * 0.1;

      // Check Collapse
      const threshold = 1.0; // Max energy
      const isLastFunction = currentFunctionIdx === skeleton.length - 1;

      if ((currentField.energy > threshold || currentField.decay < 0) && !isLastFunction) {
        // Collapse! Transition to next function
        regions.push({
          startTick: regionStartTick,
          endTick: t,
          measureIndex: regionStartMeasure,
          function: currentField.function,
          stability: Math.max(0, currentField.decay)
        });

        // Mutate Narrative State (simulate time passing)
        // Here we just advance the phase slightly based on time
        currentState = NarrativeEngine.updateNarrative(currentState, null as any, (endTick - startTick) / TICKS_PER_QUARTER);

        currentFunctionIdx++;
        const nextFunc = skeleton[currentFunctionIdx];

        currentField = {
          function: nextFunc,
          energy: 0,
          decay: gravityMap.inertia,
          anchorForce: gravityMap.gravityStrength[this.getGravityKey(nextFunc)] || 0.5
        };

        regionStartTick = t;
        regionStartMeasure = Math.floor(t / TICKS_PER_MEASURE) + 1;
      }
    }

    // Close final region
    regions.push({
      startTick: regionStartTick,
      endTick: endTick,
      measureIndex: regionStartMeasure,
      function: currentField.function,
      stability: Math.max(0, currentField.decay)
    });

    // Ensure 1 transition per skeleton unit (minFunctionalStability)
    // If the loop finished without realizing all skeleton functions, we force them at the end.
    if (currentFunctionIdx < skeleton.length - 1) {
      // Compress the last region to fit the remaining functions
      let remainingFunctions = skeleton.slice(currentFunctionIdx + 1);
      const lastRegion = regions.pop()!;
      
      const durationPerRemaining = (lastRegion.endTick - lastRegion.startTick) / (remainingFunctions.length + 1);
      let start = lastRegion.startTick;

      regions.push({
        startTick: start,
        endTick: start + durationPerRemaining,
        measureIndex: Math.floor(start / TICKS_PER_MEASURE) + 1,
        function: lastRegion.function,
        stability: lastRegion.stability
      });

      for (const func of remainingFunctions) {
        start += durationPerRemaining;
        regions.push({
          startTick: start,
          endTick: start + durationPerRemaining,
          measureIndex: Math.floor(start / TICKS_PER_MEASURE) + 1,
          function: func,
          stability: 0.5
        });
      }
      
      // Fix last region endTick
      regions[regions.length - 1].endTick = endTick;
    }

    return { regions };
  }

  private static getGravityKey(func: HarmonicFunction): string {
    if (func === "T") return "I";
    if (func === "PD") return "IV";
    if (func === "D") return "V";
    return "OTHER";
  }
}
