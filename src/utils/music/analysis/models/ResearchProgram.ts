import type { OntologicalTaxonomy } from './TheoryOntology';
import type { ScientificHypothesis } from './ScientificHypothesis';

export interface ResearchAxiom {
  id: string;
  statement: string;
  domain: 'FUNCTIONAL' | 'MODAL' | 'SYMMETRIC' | 'TRANSFORMATIONAL' | 'VOICE_LEADING' | 'HYBRID';
}

export interface ResearchProgram {
  id: string; // e.g., 'rp_functional', 'rp_symmetric', 'rp_transformational'
  name: string;
  hardCorePrinciples: ResearchAxiom[]; // fundamental unchangeable principles
  protectiveBeltHypotheses: ScientificHypothesis[]; // auxiliary hypotheses
  taxonomy: OntologicalTaxonomy;
  state: {
    generation: number;
    lpi: number;
    aar: number;
    isProgressive: boolean;
    eaw: number;
    cumulativeAnomaliesObserved: number;
    cumulativeAnomaliesExplained: number;
  };
}
