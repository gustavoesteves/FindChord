export interface OntologyTournamentResult {
  ontologyId: string;
  generation: number;
  ee: number;             // Epistemic Efficiency
  tcr: number;            // Taxonomic Convergence Ratio
  ofs: number;            // Ontological Fitness Score
  odiStar: number;        // Margin-based Ontological Dominance Index (ODI*)
  sps: number;            // Structural Parsimony Score
  rs: number;             // Robustness Score
  coverageCross: number;  // Average cross-corpus coverage
  pvi: number;            // Predictive Validity Index
}
