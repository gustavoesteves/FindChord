import type { OntologicalTaxonomy } from '../models/TheoryOntology';

export class OntologyFitnessEngine {
  /**
   * Computes the structural complexity of a taxonomy.
   * Complexity = Nodes + 0.5 * Edges + Depth
   */
  public static calculateComplexity(taxonomy: OntologicalTaxonomy): number {
    const nodesCount = taxonomy.nodes.length;
    const edgesCount = taxonomy.edges.length;
    const maxLevel = taxonomy.nodes.reduce((max, n) => Math.max(max, n.level), 0);
    const depth = maxLevel + 1; // root paradigm level = 0 -> depth at least 1

    return nodesCount + 0.5 * edgesCount + depth;
  }

  /**
   * Computes the Structural Parsimony Score (SPS).
   * SPS = (CoverageCross * 10) / (Nodes + Edges)
   */
  public static calculateSPS(taxonomy: OntologicalTaxonomy, coverageCross: number): number {
    const totalStructuralElements = taxonomy.nodes.length + taxonomy.edges.length;
    if (totalStructuralElements === 0) return 0.0;
    return Number(((coverageCross * 10.0) / totalStructuralElements).toFixed(4));
  }

  /**
   * Computes the Epistemic Efficiency (EE).
   * EE = 3.8 * (TCI * PVI * CoverageCross) / ln(1 + Complexity)
   */
  public static calculateEE(
    tci: number,
    pvi: number,
    coverageCross: number,
    complexity: number
  ): number {
    const logComplexity = Math.log(1.0 + complexity);
    if (logComplexity === 0) return 0.0;
    const ee = 3.8 * (tci * pvi * coverageCross) / logComplexity;
    return Number(ee.toFixed(4));
  }

  /**
   * Computes the Robustness Score (RS).
   * RS = 1.0 - stdDev(coverages)
   */
  public static calculateRS(coverages: number[]): number {
    if (coverages.length === 0) return 1.0;
    const mean = coverages.reduce((sum, val) => sum + val, 0) / coverages.length;
    const variance = coverages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / coverages.length;
    const stdDev = Math.sqrt(variance);

    return Number(Math.max(0.0, 1.0 - stdDev).toFixed(4));
  }
}
