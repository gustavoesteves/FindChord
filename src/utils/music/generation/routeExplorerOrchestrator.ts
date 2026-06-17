import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import { GenerationRequest } from './models/GenerationContext';
import { HarmonicRoute, WhyNotExclusion } from './models/HarmonicRoute';
import { ExplorationNode } from './models/ExplorationState';
import { MelodyExtractionEngine, RawMelodyNote } from './engines/melodyExtractionEngine';
import { HarmonicRegionEngine } from './engines/harmonicRegionEngine';
import { HarmonicPossibilityEngine } from './engines/harmonicPossibilityEngine';
import { WhyThisEngine } from './engines/whyThisEngine';

export interface ExplorationResult {
  nodes: ExplorationNode[];
  exclusions: WhyNotExclusion[];
}

export class RouteExplorerOrchestrator {
  private melodyEngine = new MelodyExtractionEngine();
  private regionEngine = new HarmonicRegionEngine();
  private possibilityEngine = new HarmonicPossibilityEngine();
  private whyThisEngine = new WhyThisEngine();

  /**
   * Orchestrates the entire F13-A1/F13-A2.0 compositional pipeline.
   * Given a raw melody, a chord progression, and optionally a parent node,
   * generates curated ExplorationNodes (stateful mutations) with Distance Metrics and Positive Explainability.
   */
  public explore(
    regionId: string,
    rawNotes: RawMelodyNote[],
    chords: CanonicalChordEvent[],
    request: GenerationRequest,
    parentNode?: ExplorationNode
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

      // 4. Wrap Routes into ExplorationNodes with State Tracking
    const nodes: ExplorationNode[] = routes.map(route => {
      const isMutation = !!parentNode;
      
      // Calculate distances
      // In a real implementation we would compute structural differences.
      // We will map the explorationDelta as fromOriginal, and fromParent as half of that (mock heuristic).
      const fromOriginal = route.explorationDelta;
      const fromParent = isMutation ? Math.round(route.explorationDelta * 0.5) : fromOriginal;
      
      const node: ExplorationNode = {
        nodeId: `node_${route.id}_${Date.now()}`,
        parentId: parentNode?.nodeId,
        routeDepth: parentNode ? parentNode.routeDepth + 1 : 1, // Depth from the root (roots are 1 in UI typically, or 0. Let's use parent + 1)
        mutationType: isMutation ? 'modal_expansion' : 'identity', // Mock derivation
        route: route,
        distance: { fromOriginal, fromParent },
        accepted: false,
        createdAt: Date.now()
      };
      
      // We can also attach WhyThis directly into the UI state or inside the node if we want.
      // For now, the WhyThisEngine is ready to be called by the UI when the node is expanded.
      // Let's attach it to the route's opportunity payload or leave it for the UI layer to compute on demand.
      // In a real scenario, the UI calls `whyThisEngine.explain(region.originalChords, route)` when clicking.
      return node;
    });

    // Sort nodes by opportunity structural impact
    nodes.sort((a, b) => b.route.opportunity.structuralImpact - a.route.opportunity.structuralImpact);

    // Hacky extraction of WhyNot exclusions for the architectural mock
    const whyNotEngine = (this.possibilityEngine as any).whyNotEngine;
    const exclusions = whyNotEngine ? whyNotEngine.getExclusions() : [];
    
    // Clear it for the next run
    if (whyNotEngine) {
      whyNotEngine.clear();
    }

    return {
      nodes,
      exclusions
    };
  }
}
