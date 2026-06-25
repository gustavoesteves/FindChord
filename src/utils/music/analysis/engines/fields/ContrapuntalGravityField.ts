import { Interval } from "tonal";
import type { GravityField } from "./GravityField";
import type { PhraseContext } from "../PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "../MelodicInterpretationEngine";
import type { TrajectoryInterpretation } from "../../models/MelodicInterpretation";
import type { PathwayMetrics } from "../HorizontalHarmonyEngine";

export class ContrapuntalGravityField implements GravityField {
  id = "contrapuntal";
  name = "Contraponto de Baixo";

  generateCandidates(anchorPitch: string, phraseContext: PhraseContext): TrajectoryInterpretation[] {
    // Allows everything. Harmony is secondary to the bass line here.
    return MelodicInterpretationEngine.getInterpretations(anchorPitch, phraseContext.selectedCenter);
  }

  scoreTransition(
    _prevChord: string, 
    _nextChord: string, 
    prevBass: string, 
    nextBass: string, 
    _phraseContext: PhraseContext,
    prevMelody?: string,
    nextMelody?: string
  ): PathwayMetrics {
    
    // We care about bass motion (smooth, stepwise, diatonic or chromatic) 
    // and contrary motion against the melody.
    const bassInterval = Interval.distance(prevBass + "4", nextBass + "4");
    const absBassSemitones = Math.abs(Interval.semitones(bassInterval) || 0);

    let score = 0;

    // 1. Smooth Bass Motion is heavily rewarded
    if (absBassSemitones === 1 || absBassSemitones === 2) {
      score += 50; // Stepwise motion
    } else if (absBassSemitones === 3 || absBassSemitones === 4) {
      score += 20; // 3rds
    } else if (absBassSemitones === 0) {
      score -= 10; // Pedal is okay but boring for contrapuntal
    } else {
      score -= 30; // Leaps are bad
    }

    // 2. Contrary Motion (if melody info is available)
    if (prevMelody && nextMelody) {
      const melodyInterval = Interval.semitones(Interval.distance(prevMelody + "4", nextMelody + "4")) || 0;
      const bassDirection = Interval.semitones(bassInterval) || 0;

      // Melody goes up, bass goes down (or vice versa)
      if ((melodyInterval > 0 && bassDirection < 0) || (melodyInterval < 0 && bassDirection > 0)) {
        score += 40; // Contrary motion is beautiful
      } else if (melodyInterval === 0 && bassDirection !== 0) {
        score += 20; // Oblique motion
      } else if (melodyInterval !== 0 && bassDirection === 0) {
        score += 20; // Oblique motion
      } else {
        score -= 20; // Parallel or similar motion is weak in counterpoint
      }
    }

    return {
      smoothness: score,
      commonToneRetention: 0,
      chromaticMotion: 0,
      bassCoherence: score,
      archetypeStrength: score,
      totalScore: score
    };
  }
}
