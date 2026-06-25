import { Interval } from "tonal";
import type { GravityField } from "./GravityField";
import type { PhraseContext } from "../PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "../MelodicInterpretationEngine";
import type { TrajectoryInterpretation } from "../../models/MelodicInterpretation";
import type { PathwayMetrics } from "../HorizontalHarmonyEngine";

export class TonalGravityField implements GravityField {
  id = "tonal";
  name = "Tonal Clássico";

  generateCandidates(anchorPitch: string, phraseContext: PhraseContext): TrajectoryInterpretation[] {
    const raw = MelodicInterpretationEngine.getInterpretations(anchorPitch, phraseContext.selectedCenter);
    
    // Tonal field heavily restricts to DIATONIC, allowing some DOMINANT
    return raw.filter(interp => {
      const behavior = interp.selectedMeaning.behavior;
      return behavior === "DIATONIC" || behavior === "DOMINANT";
    });
  }

  scoreTransition(
    _prevChord: string, 
    _nextChord: string, 
    prevBass: string, 
    nextBass: string, 
    _phraseContext: PhraseContext
  ): PathwayMetrics {
    
    // Tonal scoring favors 4ths (V-I, ii-V) and diatonic stepwise
    const bassInterval = Interval.distance(prevBass + "4", nextBass + "4");
    const intervalName = Interval.get(bassInterval).name;
    const absSemitones = Math.abs(Interval.semitones(intervalName) || 0);

    let score = 0;

    // Perfect 4th up or 5th down (Cycle of 5ths)
    if (absSemitones === 5 || absSemitones === 7) score += 40;
    
    // Diatonic step
    if (absSemitones === 2) score += 20;

    return {
      smoothness: 10,
      commonToneRetention: 10,
      chromaticMotion: 0,
      bassCoherence: score,
      archetypeStrength: score,
      totalScore: score
    };
  }
}
