import type { GenerationRequest, HarmonicRegion } from '../models/GenerationContext';
import { HarmonicRoute } from '../models/HarmonicRoute';
import { HarmonicCompatibilityEngine } from './harmonicCompatibilityEngine';
import { OpportunityEngine } from './opportunityEngine';
import { WhyNotEngine } from './whyNotEngine';

export class HarmonicPossibilityEngine {
  private compatibilityEngine = new HarmonicCompatibilityEngine();
  private opportunityEngine = new OpportunityEngine();
  private whyNotEngine = new WhyNotEngine();

  /**
   * Generates alternative harmonic routes for a given region, constrained by the goals and preservation contract.
   */
  public generateRoutes(
    region: HarmonicRegion,
    request: GenerationRequest,
    melody: import('../models/GenerationContext').MelodicPhrase
  ): HarmonicRoute[] {
    const validRoutes: HarmonicRoute[] = [];
    
    // In a real implementation, we would mutate the region's chords based on music theory,
    // applying the Goals and respecting the Constraints.
    // Here we generate some mock/architectural dummy routes for the pipeline testing.

    const mockCandidates = [
      {
        id: 'r1',
        label: 'Tonal Drift',
        chords: [{ ...region.originalChords[0], symbol: 'Em7' }] // Mock
      },
      {
        id: 'r2',
        label: 'Sovereignty Violation',
        chords: [{ ...region.originalChords[0], symbol: 'E7(b9)' }] // Will be rejected by Compatibility
      }
    ];

    for (const candidate of mockCandidates) {
      // 1. Compatibility Check
      const isCompatible = this.compatibilityEngine.isCompatible(candidate.chords, melody);
      
      if (!isCompatible) {
        this.whyNotEngine.logExclusion({
          rejectedChords: candidate.chords.map(c => c.symbol),
          reason: 'Violates Melodic Sovereignty (structural friction)'
        });
        continue;
      }

      // 2. Constraints Check (Mock logic)
      const violatesConstraint = request.constraints.some(c => c.type === 'PreserveTonalCenter' && candidate.label === 'Modulation');
      if (violatesConstraint) {
        this.whyNotEngine.logExclusion({
          rejectedChords: candidate.chords.map(c => c.symbol),
          reason: 'Violates Harmonic Constraint (PreserveTonalCenter)'
        });
        continue;
      }

      // 3. Score Opportunity & Delta
      const opportunity = this.opportunityEngine.evaluateOpportunity(region.originalChords, candidate.chords);
      const delta = this.opportunityEngine.calculateDelta(region.originalChords, candidate.chords);

      validRoutes.push({
        id: candidate.id,
        routeLabel: candidate.label,
        derivedFromRegionId: region.id,
        chords: candidate.chords,
        explorationDelta: delta,
        opportunity: opportunity
      });
    }

    return validRoutes;
  }
}
