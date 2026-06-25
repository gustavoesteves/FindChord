import { Interval } from "tonal";
import type { GravityField } from "./GravityField";
import type { PhraseContext } from "../PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "../MelodicInterpretationEngine";
import type { TrajectoryInterpretation } from "../../models/MelodicInterpretation";
import type { PathwayMetrics } from "../HorizontalHarmonyEngine";

export class ChromaticGravityField implements GravityField {
  id = "chromatic";
  name = "Cromático Linear";

  generateCandidates(anchorPitch: string, phraseContext: PhraseContext): TrajectoryInterpretation[] {
    const raw = MelodicInterpretationEngine.getInterpretations(anchorPitch, phraseContext.selectedCenter);
    
    // Chromatic field embraces all behaviors, especially CHROMATIC and MODAL
    return raw;
  }

  scoreTransition(
    _prevChord: string, 
    _nextChord: string, 
    prevBass: string, 
    nextBass: string, 
    _phraseContext: PhraseContext
  ): PathwayMetrics {
    
    // Chromatic scoring aggressively rewards semitone bass motion
    const bassInterval = Interval.distance(prevBass + "4", nextBass + "4");
    const intervalName = Interval.get(bassInterval).name;
    const absSemitones = Math.abs(Interval.semitones(intervalName) || 0);

    let chromaticMotion = 0;
    
    if (absSemitones === 1) { // Semitone motion is god-tier
      chromaticMotion = 100;
    } else if (absSemitones === 0) { // Pedal point is okay
      chromaticMotion = 20;
    } else { // Anything else is heavily penalized
      chromaticMotion = -50; 
    }

    return {
      smoothness: 20,
      commonToneRetention: 10,
      chromaticMotion: chromaticMotion,
      bassCoherence: chromaticMotion,
      archetypeStrength: chromaticMotion,
      totalScore: chromaticMotion
    };
  }
}
