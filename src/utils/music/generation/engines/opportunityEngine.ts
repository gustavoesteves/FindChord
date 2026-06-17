import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import { HarmonicOpportunity } from '../models/HarmonicRoute';

export class OpportunityEngine {
  /**
   * Evaluates the risk and return vector for a generated candidate route.
   */
  public evaluateOpportunity(originalChords: CanonicalChordEvent[], newChords: CanonicalChordEvent[]): HarmonicOpportunity {
    // Architectural Mock implementation
    
    // For testing purposes, if the first chord changes completely (e.g. C -> Em), impact is higher
    const isSameRoot = originalChords[0]?.symbol.charAt(0) === newChords[0]?.symbol.charAt(0);
    
    return {
      novelty: isSameRoot ? 0.3 : 0.8,
      structuralImpact: isSameRoot ? 0.2 : 0.7,
      melodicRisk: 0.4,       // Standard baseline risk
      reversibility: isSameRoot ? 0.9 : 0.5
    };
  }

  /**
   * Calculates the Exploration Delta (0-100) representing how radically different the new route is.
   */
  public calculateDelta(originalChords: CanonicalChordEvent[], newChords: CanonicalChordEvent[]): number {
    const opp = this.evaluateOpportunity(originalChords, newChords);
    
    // Delta is a weighted average of novelty and structural impact, scaled to 0-100
    const rawDelta = (opp.novelty * 0.6) + (opp.structuralImpact * 0.4);
    
    return Math.round(rawDelta * 100);
  }
}
