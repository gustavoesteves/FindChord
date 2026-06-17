import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import { HarmonicRegion, PhraseAnalysis } from '../models/GenerationContext';
import { PhraseFunctionEngine } from './phraseFunctionEngine';

export class HarmonicRegionEngine {
  private phraseFunctionEngine = new PhraseFunctionEngine();

  /**
   * Groups individual chords into a unified macro-functional block (HarmonicRegion) for substitution.
   * Returns the full PhraseAnalysis containing the regions.
   */
  public extractRegion(id: string, name: string, chords: CanonicalChordEvent[], startMeasure: number, endMeasure: number): PhraseAnalysis {
    const analysis = this.phraseFunctionEngine.analyzePhrase(chords);

    const region: HarmonicRegion = {
      id,
      name,
      function: analysis.functionNarrative as HarmonicRegion['function'],
      originalChords: chords,
      startMeasure,
      endMeasure
    };
    
    analysis.regions.push(region);

    return analysis;
  }
}
