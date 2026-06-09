import type { FunctionalRole } from './FunctionalEquivalence';

export type ApparentRole =
  | 'TONIC'
  | 'PREDOMINANT'
  | 'DOMINANT'
  | 'DOMINANT_PROLONGATION'
  | 'LINEAR'
  | 'UNRESOLVED';

export type ApparentResolutionType = 'RESOLVED' | 'DEFERRED' | 'INTERRUPTED' | 'UNCONFIRMED';

export type ResolutionStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE';

export type ApparentSubtype =
  | 'ITALIAN_AUGMENTED_SIXTH'
  | 'FRENCH_AUGMENTED_SIXTH'
  | 'GERMAN_AUGMENTED_SIXTH'
  | 'CADENTIAL_64'
  | 'DECEPTIVE_RESOLUTION';

export interface ResolutionAnalysis {
  status: ApparentResolutionType;
  strength: ResolutionStrength;
  distance: number; // 1 for immediate (i+1), 2 for i+2, 3 for i+3, 0 if unresolved
  targetChordIndex?: number;
  leadingToneResolved?: boolean;
  seventhResolved?: boolean;
  evidence: string; // Detail on the physical/functional voice leading resolution
}

export interface ApparentFunctionEvent {
  chordIndex: number;
  originalRoman: string;
  originalRole: FunctionalRole;
  apparentRole: ApparentRole;
  apparentSubtype?: ApparentSubtype;
  resolution: ResolutionAnalysis;
}

export interface ApparentFunctionLayerData {
  events: ApparentFunctionEvent[];
  apparentSignature: string; // e.g., "DOMINANT:R1>DOMINANT_PROLONGATION:R1"
}
