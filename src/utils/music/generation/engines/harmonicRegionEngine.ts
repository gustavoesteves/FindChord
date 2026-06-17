import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import { HarmonicRegion } from '../models/GenerationContext';
import { PhraseFunctionEngine } from './phraseFunctionEngine';

export class HarmonicRegionEngine {
  private phraseFunctionEngine = new PhraseFunctionEngine();

  /**
   * Groups individual chords into a unified macro-functional block (HarmonicRegion) for substitution.
   */
  public extractRegion(id: string, name: string, chords: CanonicalChordEvent[], startMeasure: number, endMeasure: number): HarmonicRegion {
    const regionFunction = this.phraseFunctionEngine.determineFunction(chords);

    return {
      id,
      name,
      function: regionFunction,
      originalChords: chords,
      startMeasure,
      endMeasure
    };
  }
}
