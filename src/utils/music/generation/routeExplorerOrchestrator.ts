import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import { GenerationRequest } from './models/GenerationContext';
import { HarmonicRoute, WhyNotExclusion } from './models/HarmonicRoute';
import { MelodyExtractionEngine, RawMelodyNote } from './engines/melodyExtractionEngine';
import { HarmonicRegionEngine } from './engines/harmonicRegionEngine';
import { HarmonicPossibilityEngine } from './engines/harmonicPossibilityEngine';

export interface ExplorationResult {
  routes: HarmonicRoute[];
  exclusions: WhyNotExclusion[];
}

export class RouteExplorerOrchestrator {
  private melodyEngine = new MelodyExtractionEngine();
  private regionEngine = new HarmonicRegionEngine();
  private possibilityEngine = new HarmonicPossibilityEngine();

  /**
   * Orchestrates the entire F13-A1 compositional pipeline.
   * Given a raw melody and a chord progression, extracts anchors, forms regions, 
   * and generates curated harmonic routes based on user goals and constraints.
   */
  public explore(
    regionId: string,
    rawNotes: RawMelodyNote[],
    chords: CanonicalChordEvent[],
    request: GenerationRequest
  ): ExplorationResult {
    // 1. Extract sovereign melody
    const melody = this.melodyEngine.extractMelodicPhrase(regionId + '-melody', rawNotes);

    // 2. Form the atomic unit of substitution (Harmonic Region)
    const phraseAnalysis = this.regionEngine.extractRegion(
      regionId,
      'Target Region',
      chords,
      1, // mock start measure
      chords.length // mock end measure
    );
    
    // For this prototype, we just process the first region.
    const region = phraseAnalysis.regions[0];

    // 3. Generate possibilities (injecting Goals, Constraints, and preserving Melody)
    // The PossibilityEngine internally calls CompatibilityEngine, OpportunityEngine and WhyNotEngine.
    // However, since WhyNotEngine is instantiated inside PossibilityEngine in our mock, we need a way to get the exclusions.
    // For architectural purity, we can just return what we have in this prototype.
    // In a real scenario, WhyNotEngine could be passed down as a dependency injection.
    
    // For now, we will just call generateRoutes. The exclusions are tracked inside the PossibilityEngine's whyNotEngine.
    // We will cast/access it for the mock.
    const routes = this.possibilityEngine.generateRoutes(region, request, melody);

    // Sort routes by delta (lowest risk first, or highest impact first depending on UX)
    // Let's sort by highest opportunity structural impact for now
    routes.sort((a, b) => b.opportunity.structuralImpact - a.opportunity.structuralImpact);

    // Hacky extraction of WhyNot exclusions for the architectural mock
    const whyNotEngine = (this.possibilityEngine as any).whyNotEngine;
    const exclusions = whyNotEngine ? whyNotEngine.getExclusions() : [];
    
    // Clear it for the next run
    if (whyNotEngine) {
      whyNotEngine.clear();
    }

    return {
      routes,
      exclusions
    };
  }
}
