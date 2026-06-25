import type { PhraseContext } from "../PhraseAnalysisEngine";
import type { TrajectoryInterpretation } from "../../models/MelodicInterpretation";
import type { PathwayMetrics } from "../HorizontalHarmonyEngine";

export interface GravityField {
  id: string;
  name: string;

  /**
   * Defines which chords/interpretations are valid for this anchor under this field's philosophy.
   */
  generateCandidates(
    anchorPitch: string,
    phraseContext: PhraseContext
  ): TrajectoryInterpretation[];

  /**
   * Scores the transition between two harmony events based on this field's philosophy.
   */
  scoreTransition(
    prevChord: string,
    nextChord: string,
    prevBass: string,
    nextBass: string,
    phraseContext: PhraseContext,
    prevMelody?: string,
    nextMelody?: string
  ): PathwayMetrics;
}
