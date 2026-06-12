import type { OntologicalTaxonomy } from '../models/TheoryOntology';
import type { OntologyTournamentResult } from '../models/OntologyTournament';
import type { OntologyComparisonGraph, ComparisonNode, ComparisonEdge } from '../models/OntologyComparisonGraph';
import { OntologyFitnessEngine } from './OntologyFitnessEngine';
import { OntologyConvergenceEngine } from './OntologyConvergenceEngine';
import { CrossCorpusValidationEngine } from './CrossCorpusValidationEngine';
import { TheoryConsilienceEngine } from './TheoryConsilienceEngine';
import { selectBestVariant } from './TheoryRevisionEngine';
import type { TheoryCandidate } from '../models/TheoryCandidate';

export class OntologyTournamentEngine {
  /**
   * Runs the tournament among competing ontologies, evaluating their OFS and ODI* margins.
   */
  public static runTournament(
    ontologies: OntologicalTaxonomy[],
    previousOntologies?: Record<string, OntologicalTaxonomy>
  ): OntologyTournamentResult[] {
    const results: OntologyTournamentResult[] = ontologies.map(taxonomy => {
      const ontologyId = (taxonomy.metadata as any).ontologyId || 'unknown';
      const generation = taxonomy.metadata.generationIndex;

      // 1. Identify active candidate theories (not traditional schools)
      const candidateNodes = taxonomy.nodes.filter(
        n => !n.id.includes('school') && !n.id.includes('paradigm')
      );

      // Estimate TCI using the maximum consilience of its constituent theories
      let maxTci = 0.50;
      if (candidateNodes.length > 0) {
        // Reconstruct candidates for TCI calculations
        candidateNodes.forEach(node => {
          const mockCandidate: TheoryCandidate = {
            id: node.id,
            name: node.name,
            stage: 'VALIDATED_THEORY_CANDIDATE',
            prototypeChords: [],
            properties: node.concepts,
            description: node.description,
            metrics: { tcs: 0.8, tri: 0.8, gs: 0.98, egsw: 0.2, ns: 0.7, tms: 0.8 }
          };
          const tci = TheoryConsilienceEngine.evaluateConsilience(mockCandidate);
          if (tci > maxTci) {
            maxTci = tci;
          }
        });
      }

      // 2. Evaluate cross-corpus metrics
      const { coverages, coverageCross, pvi } = CrossCorpusValidationEngine.evaluateCrossCorpus(taxonomy);

      // 3. Compute complexity and fitness
      const complexity = OntologyFitnessEngine.calculateComplexity(taxonomy);
      const ee = OntologyFitnessEngine.calculateEE(maxTci, pvi, coverageCross, complexity);
      const sps = OntologyFitnessEngine.calculateSPS(taxonomy, coverageCross);
      const rs = OntologyFitnessEngine.calculateRS(coverages);

      // 4. Compute Taxonomic Convergence (TCR)
      const prevTaxonomy = previousOntologies?.[ontologyId];
      const tcr = OntologyConvergenceEngine.calculateTCR(taxonomy, prevTaxonomy);

      // 5. Compute Ontological Fitness Score (OFS)
      // OFS = 0.35 * EE + 0.25 * TCI + 0.20 * PVI + 0.20 * TCR
      const ofs = 0.35 * ee + 0.25 * maxTci + 0.20 * pvi + 0.20 * tcr;

      return {
        ontologyId,
        generation,
        ee,
        tcr,
        ofs: Number(ofs.toFixed(4)),
        odiStar: 0.0, // Calculated below
        sps,
        rs,
        coverageCross,
        pvi
      };
    });

    // Calculate margin-based ODI*
    // ODI* = Sum(OFS_winner - OFS_loser) / Matches
    const n = results.length;
    const matches = n - 1;

    results.forEach((res, idx) => {
      if (matches <= 0) {
        res.odiStar = 0.0;
        return;
      }

      let sumDiff = 0;
      results.forEach((opponent, oppIdx) => {
        if (idx !== oppIdx) {
          sumDiff += (res.ofs - opponent.ofs);
        }
      });

      res.odiStar = Number((sumDiff / matches).toFixed(4));
    });

    return results;
  }

  /**
   * Builds the comparison graph between competing ontologies.
   */
  public static buildComparisonGraph(results: OntologyTournamentResult[]): OntologyComparisonGraph {
    const nodes: ComparisonNode[] = results.map(res => ({
      id: res.ontologyId,
      label: res.ontologyId.toUpperCase().replace('_', ' '),
      ofs: res.ofs
    }));

    const edges: ComparisonEdge[] = [];

    // Pairwise comparisons
    for (let i = 0; i < results.length; i++) {
      for (let j = 0; j < results.length; j++) {
        if (i === j) continue;

        const a = results[i];
        const b = results[j];
        const diff = a.ofs - b.ofs;

        if (diff > 0.05) {
          // A outperforms B
          edges.push({
            source: a.ontologyId,
            target: b.ontologyId,
            type: 'OUTPERFORMS',
            margin: Number(diff.toFixed(4))
          });
        } else if (diff >= -0.05 && diff <= 0.05 && i < j) {
          // A and B are equivalent (record edge once)
          edges.push({
            source: a.ontologyId,
            target: b.ontologyId,
            type: 'EQUIVALENT',
            margin: Number(Math.abs(diff).toFixed(4))
          });
        }
      }
    }

    return {
      nodes,
      edges
    };
  }
}
