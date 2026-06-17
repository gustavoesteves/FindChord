import type { CanonicalProgressionEvent } from '../../analysis/models/CanonicalProgressionEvent';
import type { FunctionalFingerprint } from './FunctionalFingerprint';
import type { HarmonicDNA } from './HarmonicDNA';

export interface OntologicalConfidence {
  dna: number;
  motif: number;
  archetype: number;
}

export interface OntologicalNode {
  nodeId: string;
  sourceEvent: CanonicalProgressionEvent;
  fingerprint: FunctionalFingerprint;
  dna: HarmonicDNA;
  
  motifMatches: { motifId: string, confidence: number }[];
  archetypeMatches: { archetypeId: string, confidence: number }[];
  
  confidence: OntologicalConfidence;
}
