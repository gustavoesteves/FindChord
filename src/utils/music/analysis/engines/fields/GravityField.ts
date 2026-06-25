import type { PhraseContext } from "../PhraseAnalysisEngine";
import type { HarmonicSeed } from "../../models/HarmonicSeed";

export interface GravityField {
  id: string;
  name: string;

  /**
   * Generates structural intentions (Archetype Seeds) based on the phrase context.
   */
  generateArchetypeSeeds(phraseContext: PhraseContext): HarmonicSeed[];
}
