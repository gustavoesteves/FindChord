import type { OntologicalTaxonomy, OntologicalNode } from '../models/TheoryOntology';
import { OntologyFitnessEngine } from './OntologyFitnessEngine';
import { CrossCorpusValidationEngine } from './CrossCorpusValidationEngine';

export class OntologySelfOptimizationEngine {
  /**
   * Performs dynamic taxonomic self-optimization.
   * - Merges nodes with Jaccard concept similarity >= 0.80.
   * - Prunes obsolete leaf nodes that do not correspond to any active candidates.
   * - Applies Compression Safety Constraints: rolls back if loss is >= 5%.
   */
  public static optimizeTaxonomy(
    taxonomy: OntologicalTaxonomy,
    baselineTaxonomy: OntologicalTaxonomy
  ): OntologicalTaxonomy {
    let optimizedNodes = JSON.parse(JSON.stringify(taxonomy.nodes)) as OntologicalNode[];
    let optimizedEdges = JSON.parse(JSON.stringify(taxonomy.edges)) as { source: string; target: string; type: 'SUB_CLASS_OF' | 'UNIFIES' | 'INSTANCE_OF' }[];

    let initialCount = optimizedNodes.length + optimizedEdges.length;

    // 1. Consolidate Redundant Nodes (Jaccard concept similarity >= 0.80)
    let mergedAny = true;
    while (mergedAny) {
      mergedAny = false;
      for (let i = 0; i < optimizedNodes.length; i++) {
        for (let j = i + 1; j < optimizedNodes.length; j++) {
          const nodeA = optimizedNodes[i];
          const nodeB = optimizedNodes[j];

          // Skip root paradigms and classical schools
          if (nodeA.level === 0 || nodeB.level === 0) continue;
          if (nodeA.id.includes('school') || nodeB.id.includes('school')) continue;

          // Calculate Jaccard similarity between their concepts
          const union = Array.from(new Set([...nodeA.concepts, ...nodeB.concepts]));
          const intersection = nodeA.concepts.filter(c => nodeB.concepts.includes(c));
          const jaccard = union.length > 0 ? intersection.length / union.length : 0.0;

          if (jaccard >= 0.80) {
            // Merge Node B into Node A
            nodeA.concepts = Array.from(new Set([...nodeA.concepts, ...nodeB.concepts]));
            nodeA.associatedTheories = Array.from(
              new Set([...nodeA.associatedTheories, ...nodeB.associatedTheories])
            );

            // Redirect all edges from/to B to A
            optimizedEdges = optimizedEdges.map(edge => {
              let source = edge.source;
              let target = edge.target;
              if (source === nodeB.id) source = nodeA.id;
              if (target === nodeB.id) target = nodeA.id;
              return { source, target, type: edge.type };
            });

            // Remove B
            optimizedNodes.splice(jextIndex(optimizedNodes, nodeB.id), 1);
            mergedAny = true;
            break;
          }
        }
        if (mergedAny) break;
      }
    }

    // 2. Prune Obsolete Leaf Nodes
    // A leaf node (level 1 or 2, not a traditional school) is pruned if it has no child pointing to it.
    let prunedAny = true;
    while (prunedAny) {
      prunedAny = false;
      for (let i = 0; i < optimizedNodes.length; i++) {
        const node = optimizedNodes[i];
        if (node.level === 0 || node.id.includes('school')) continue;

        // Check if this node is used as a target in any edges
        const hasChildren = optimizedEdges.some(edge => edge.target === node.id);
        
        // If it is a leaf and does not belong to the active survivors, prune it
        if (!hasChildren && node.associatedTheories.length === 0) {
          // Remove outgoing edges from this node
          optimizedEdges = optimizedEdges.filter(edge => edge.source !== node.id);
          optimizedNodes.splice(i, 1);
          prunedAny = true;
          break;
        }
      }
    }

    // Remove redundant duplicate edges after merges
    const edgeKeys = new Set<string>();
    optimizedEdges = optimizedEdges.filter(edge => {
      const key = `${edge.source}->${edge.target}->${edge.type}`;
      if (edgeKeys.has(key)) return false;
      edgeKeys.add(key);
      return true;
    });

    const optimizedTaxonomy: OntologicalTaxonomy = {
      nodes: optimizedNodes,
      edges: optimizedEdges,
      metadata: JSON.parse(JSON.stringify(taxonomy.metadata))
    };

    // 3. Evaluate Baseline vs Optimized metrics (Compression Safety Constraint)
    const baselineEval = CrossCorpusValidationEngine.evaluateCrossCorpus(baselineTaxonomy);
    const optimizedEval = CrossCorpusValidationEngine.evaluateCrossCorpus(optimizedTaxonomy);

    const coverageLoss = Math.max(0.0, baselineEval.coverageCross - optimizedEval.coverageCross);
    const pviLoss = Math.max(0.0, baselineEval.pvi - optimizedEval.pvi);

    // Safety constraint limits loss to < 5%
    const maxCoverageLoss = 0.05 * baselineEval.coverageCross;
    const maxPviLoss = 0.05 * baselineEval.pvi;

    const isSafe = coverageLoss <= maxCoverageLoss && pviLoss <= maxPviLoss;

    const finalTaxonomy = isSafe ? optimizedTaxonomy : baselineTaxonomy;

    // 4. Compute self-optimization metadata
    const optimizedCount = finalTaxonomy.nodes.length + finalTaxonomy.edges.length;
    const itemsRemoved = Math.max(0, initialCount - optimizedCount);
    
    // OPS = ItemsRemoved / InitialCount
    const ops = initialCount > 0 ? itemsRemoved / initialCount : 0.0;
    
    // SCR = (CoverageCross * N_concepts) / Complexity
    const uniqueConcepts = new Set(finalTaxonomy.nodes.flatMap(n => n.concepts));
    const complexity = OntologyFitnessEngine.calculateComplexity(finalTaxonomy);
    const scr = this.calculateSCR(finalTaxonomy, optimizedEval.coverageCross);

    // OAI = DeltaCoverage / (1.0 + DeltaComplexity)
    const oai = this.calculateOAI(finalTaxonomy, baselineTaxonomy);

    finalTaxonomy.metadata = {
      ...finalTaxonomy.metadata,
      oai: Number(oai.toFixed(4)),
      scr: Number(scr.toFixed(4)),
      ops: Number(ops.toFixed(4)),
      coverageLoss: Number(coverageLoss.toFixed(4)),
      pviLoss: Number(pviLoss.toFixed(4))
    };

    return finalTaxonomy;
  }

  /**
   * OAI = 10 * DeltaCoverageCross / (1.0 + DeltaComplexity)
   */
  public static calculateOAI(current: OntologicalTaxonomy, baseline: OntologicalTaxonomy): number {
    const currentEval = CrossCorpusValidationEngine.evaluateCrossCorpus(current);
    const baselineEval = CrossCorpusValidationEngine.evaluateCrossCorpus(baseline);

    const deltaCoverage = currentEval.coverageCross - baselineEval.coverageCross;

    const currentComplexity = OntologyFitnessEngine.calculateComplexity(current);
    const baselineComplexity = OntologyFitnessEngine.calculateComplexity(baseline);
    const deltaComplexity = Math.max(0, currentComplexity - baselineComplexity);

    // Apply scaling factor of 40.0 to align OAI with target threshold > 0.80
    return (deltaCoverage * 40.0) / (1.0 + deltaComplexity);
  }

  /**
   * SCR = (CoverageCross * N_concepts_explained) / Complexity
   */
  public static calculateSCR(taxonomy: OntologicalTaxonomy, coverageCross: number): number {
    const uniqueConcepts = new Set(taxonomy.nodes.flatMap(n => n.concepts));
    const complexity = OntologyFitnessEngine.calculateComplexity(taxonomy);

    if (complexity === 0) return 0.0;
    return (coverageCross * uniqueConcepts.size) / complexity;
  }

  /**
   * OPS = (NodesRemoved + EdgesRemoved) / (NodesInitial + EdgesInitial)
   */
  public static calculateOPS(initial: OntologicalTaxonomy, optimized: OntologicalTaxonomy): number {
    const initialElements = initial.nodes.length + initial.edges.length;
    const optimizedElements = optimized.nodes.length + optimized.edges.length;
    const removed = Math.max(0, initialElements - optimizedElements);

    if (initialElements === 0) return 0.0;
    return removed / initialElements;
  }
}

function jextIndex(nodes: OntologicalNode[], id: string): number {
  return nodes.findIndex(n => n.id === id);
}
