import type { FunctionalChord, PhraseRole } from "../models/FunctionalAnalysis";

export type RegionType = 'NARRATIVE' | 'PROLONGATION' | 'CADENTIAL' | 'TRANSITION';

export interface OntologyRegion {
  id: string;
  tickStart: number;
  tickEnd: number;
  measures: number[];
  dominantRole: PhraseRole;
  dominantAttractor: string;
  confidence: number;
  regionType: RegionType;
  nodes: FunctionalChord[];
}
