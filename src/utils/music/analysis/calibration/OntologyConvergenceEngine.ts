import type { OntologicalTaxonomy } from '../models/TheoryOntology';

export class OntologyConvergenceEngine {
  /**
   * Computes the Taxonomic Convergence Ratio (TCR) between current and previous taxonomies.
   * TCR = 1.0 - (TaxonomicChanges / TotalNodes)
   */
  public static calculateTCR(current: OntologicalTaxonomy, previous?: OntologicalTaxonomy): number {
    if (!previous || previous.nodes.length === 0) {
      return 1.0; // Default when no previous generation exists
    }

    let changes = 0;
    const prevNodeMap = new Map(previous.nodes.map(n => [n.id, n]));

    // 1. Added or parent-moved nodes
    current.nodes.forEach(node => {
      const prev = prevNodeMap.get(node.id);
      if (!prev) {
        changes += 1.0; // Added node
      } else if (node.parentId !== prev.parentId) {
        changes += 1.0; // Node moved in taxonomy
      }
    });

    // 2. Deleted nodes
    previous.nodes.forEach(node => {
      if (!current.nodes.some(n => n.id === node.id)) {
        changes += 1.0; // Deleted node
      }
    });

    // 3. New/Changed edges
    const prevEdgeSet = new Set(previous.edges.map(e => `${e.source}->${e.target}->${e.type}`));
    current.edges.forEach(edge => {
      const key = `${edge.source}->${edge.target}->${edge.type}`;
      if (!prevEdgeSet.has(key)) {
        changes += 0.5; // Added edge
      }
    });

    const totalNodes = current.nodes.length;
    if (totalNodes === 0) return 1.0;

    const tcr = Math.max(0.0, 1.0 - (changes / totalNodes));
    return Number(tcr.toFixed(4));
  }

  /**
   * Detects if the taxonomy has stabilized based on TCR history.
   * Converged if the last 3 generations have TCR >= 0.80.
   */
  public static detectConvergence(history: OntologicalTaxonomy[]): boolean {
    if (history.length < 3) return false;

    const recentTCRs: number[] = [];
    for (let i = history.length - 2; i >= 0 && i >= history.length - 4; i--) {
      const current = history[i + 1];
      const previous = history[i];
      recentTCRs.push(this.calculateTCR(current, previous));
    }

    if (recentTCRs.length < 2) return false;
    return recentTCRs.every(tcr => tcr >= 0.80);
  }
}
