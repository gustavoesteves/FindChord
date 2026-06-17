import type { OntologicalNode } from './OntologicalNode';
import type { DriftProfile } from './FunctionalDrift';

export type SafetyMode = 'strict' | 'creative' | 'experimental';

export interface SubstitutionProposal {
  candidateId: string;           
  replacementNodes: OntologicalNode[]; // Permite substituições 1-para-N futuramente
  preservationScore: number;     // Quão fiel o candidato é ao original isoladamente
  expectedDrift: DriftProfile;   // O laudo completo simulado
  mutationIntent: string[];      // Intenções extraídas (ex: ['increase_color', 'reduce_tension'])
}
