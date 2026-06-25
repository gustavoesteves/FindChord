import { ChordSpelling } from "./ChordSpelling";

export interface VoiceLeadingResult {
  commonTones: number;
  totalMovement: number;
  chromaticApproaches: number;
  overallCost: number; // Lower is better
  smoothnessScore: number; // 0.0 to 1.0 (Higher is better)
}

export class VoiceLeadingPrimitiveEngine {
  
  /**
   * Evaluates the transition between two chords based on counterpoint principles.
   */
  public static evaluateTransition(chordA: string, chordB: string): VoiceLeadingResult {
    const pitchesA = ChordSpelling.getPitches(chordA);
    const pitchesB = ChordSpelling.getPitches(chordB);

    if (pitchesA.length === 0 || pitchesB.length === 0) {
      return { commonTones: 0, totalMovement: 0, chromaticApproaches: 0, overallCost: 10, smoothnessScore: 0.1 };
    }

    let commonTones = 0;
    let chromaticApproaches = 0;
    let totalMovement = 0;

    const setB = new Set(pitchesB);

    // Rule 1: Maximize common tones
    for (const pA of pitchesA) {
      if (setB.has(pA)) {
        commonTones++;
      } else {
        // Find the closest voice in B to move to (greedy approach for Voice Leading)
        let minDelta = Infinity;
        for (const pB of pitchesB) {
          // calculate shortest distance on pitch class circle
          let dist = Math.abs(pA - pB);
          if (dist > 6) dist = 12 - dist;
          
          if (dist < minDelta) {
            minDelta = dist;
          }
        }

        totalMovement += minDelta;

        // Rule 3: Reward chromatic approach (distance of exactly 1 semitone)
        if (minDelta === 1) {
          chromaticApproaches++;
        }
      }
    }

    // Heuristic weighting
    // A transition with 2 common tones and 1 chromatic approach is excellent.
    // Total cost formula: Base penalty for movement - reward for common tones - reward for chromatic approach
    const cost = (totalMovement * 1.5) - (commonTones * 2.0) - (chromaticApproaches * 3.0);
    
    // Normalize into a 0.0 to 1.0 smoothness score
    // If cost <= -5, score is 1.0. If cost >= 10, score is 0.1
    const clampedCost = Math.max(-5, Math.min(10, cost));
    // map [-5, 10] -> [1.0, 0.1]
    const smoothnessScore = 1.0 - ((clampedCost + 5) / 15) * 0.9;

    return {
      commonTones,
      totalMovement,
      chromaticApproaches,
      overallCost: cost,
      smoothnessScore
    };
  }
}
