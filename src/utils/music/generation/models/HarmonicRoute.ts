import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';

/**
 * Evaluates the risk and return of a generated route.
 */
export interface HarmonicOpportunity {
  novelty: number;          // Distance from original solution
  structuralImpact: number; // How much the global perception changes
  melodicRisk: number;      // Friction/sensitivity with melodic anchors
  reversibility: number;    // How easy to revert (e.g. extensions vs key change)
}

/**
 * Rejection reason for discarded routes.
 */
export interface WhyNotExclusion {
  rejectedChords: string[];
  reason: string;
}

/**
 * Represents a single generated path/alternative for a given HarmonicRegion.
 */
export interface HarmonicRoute {
  id: string;
  routeLabel: string;               // e.g. "Cadential Deflection", "Tonal Drift"
  derivedFromRegionId: string;      // The original HarmonicRegion this route replaces
  chords: CanonicalChordEvent[];
  
  // Audacity score (0-100)
  explorationDelta: number;
  
  opportunity: HarmonicOpportunity;
}
