import type { NarrativePressure, HarmonicEvent, FieldEvaluation, NarrativeModulation, NarrativePhase } from "../models/NarrativeState";
import { Chord } from "tonal";

export class NarrativeEngine {

  public static getNarrativeModulation(state: NarrativePressure): NarrativeModulation {
    // Determine the macro pressure based on the current Phase and accumulated Tension
    const mod: NarrativeModulation = {
      stabilityPressure: 1.0,
      tensionPressure: 0.0,
      entropyAllowance: 0.0
    };

    switch (state.phase) {
      case "EXPOSITION":
        mod.stabilityPressure = 1.5;
        mod.tensionPressure = 0.5;
        mod.entropyAllowance = 0.2;
        break;
      case "DEVELOPMENT":
        mod.stabilityPressure = 0.8;
        mod.tensionPressure = 1.2;
        mod.entropyAllowance = 1.0;
        break;
      case "CLIMAX":
        mod.stabilityPressure = 0.2;
        mod.tensionPressure = 2.0;
        mod.entropyAllowance = 1.5;
        break;
      case "RESOLUTION":
        if (state.goal === "TONAL_RESOLUTION") {
          mod.stabilityPressure = 2.0;
          mod.tensionPressure = 0.0;
          mod.entropyAllowance = 0.0;
        } else if (state.goal === "PERMANENT_TENSION") {
          mod.stabilityPressure = 0.2;
          mod.tensionPressure = 1.5;
          mod.entropyAllowance = 1.2;
        } else if (state.goal === "DEFERRED_RESOLUTION") {
          mod.stabilityPressure = 0.8;
          mod.tensionPressure = 1.0;
          mod.entropyAllowance = 0.8;
        } else if (state.goal === "CIRCULAR_RESOLUTION") {
          mod.stabilityPressure = 1.0;
          mod.tensionPressure = 0.5;
          mod.entropyAllowance = 0.5;
        }
        break;
    }

    // Dynamic tension reaction
    if (state.tension > 0.8 && state.phase !== "RESOLUTION") {
      // The system is screaming for resolution
      mod.entropyAllowance -= 0.5;
    }

    return mod;
  }

  public static computeScore(field: FieldEvaluation, narrative: NarrativePressure): number {
    const mod = this.getNarrativeModulation(narrative);

    // Apply the Field's Bias to its own vector before Narrative Modulation
    const biasedVoiceLeading = field.score.voiceLeading;
    const biasedStability = field.score.tonalStability * field.biasVector.preferStability;
    const biasedNovelty = field.score.novelty * field.biasVector.preferChromaticism;
    const biasedTension = field.score.narrativeAlignment * field.biasVector.preferTension;

    // The Dual-Force Equation
    const weighted =
      field.score.fieldFit * 1.0 +
      biasedVoiceLeading * 0.9 +
      biasedStability * mod.stabilityPressure +
      biasedNovelty * mod.entropyAllowance +
      biasedTension * mod.tensionPressure;

    return weighted;
  }

  public static updateNarrative(state: NarrativePressure, event: HarmonicEvent | null, totalSlots: number): NarrativePressure {
    if (!event) {
      return {
        ...state,
        phase: this.computePhase(state.memory.length + 1, totalSlots)
      };
    }

    const chordData = Chord.get(event.chord);
    
    // Tonal heuristic for tension change
    // Using simple pitch-class matching or quality
    const isTonic = chordData.tonic === state.tonalAnchor.tonic && chordData.quality !== "Diminished" && chordData.quality !== "Augmented";

    let deltaTension = 0;
    if (event.fieldId === "CHROMATIC") deltaTension = +0.2;
    else if (event.fieldId === "DOMINANT") deltaTension = +0.15;
    else if (event.fieldId === "TONAL" && isTonic) deltaTension = -0.3;
    else if (event.fieldId === "CONTRAPUNTAL") deltaTension = +0.05;

    const newTension = Math.max(0, Math.min(1, state.tension + deltaTension));
    const newPhase = this.computePhase(state.memory.length + 1, totalSlots);

    return {
      ...state,
      tension: newTension,
      phase: newPhase,
      memory: [...state.memory, event]
    };
  }

  private static computePhase(eventsPassed: number, totalSlots: number): NarrativePhase {
    // Simple structural progression based on time (eventsPassed vs totalSlots)
    const progress = eventsPassed / totalSlots;

    if (progress < 0.25) return "EXPOSITION";
    if (progress < 0.6) return "DEVELOPMENT";
    if (progress < 0.8) return "CLIMAX";
    return "RESOLUTION";
  }
}
