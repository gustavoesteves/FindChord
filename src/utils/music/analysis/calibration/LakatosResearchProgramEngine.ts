import type { ResearchProgram } from '../models/ResearchProgram';
import type { ScientificHypothesis } from '../models/ScientificHypothesis';
import type { OntologicalTaxonomy, OntologicalNode, TheoryPrediction } from '../models/TheoryOntology';
import { OntologyFitnessEngine } from './OntologyFitnessEngine';
import { CrossCorpusValidationEngine } from './CrossCorpusValidationEngine';

export class LakatosResearchProgramEngine {
  /**
   * Helper to check if a node ID is protected as part of the Hard Core.
   * Nodes of level 0 (Paradigm), containing 'school', or matching a Hard Core principle id are protected.
   */
  public static isHardCoreNode(nodeId: string, program: ResearchProgram): boolean {
    if (program.hardCorePrinciples.some(p => p.id === nodeId)) return true;
    const node = program.taxonomy.nodes.find(n => n.id === nodeId);
    if (node && (node.level === 0 || node.id.includes('school'))) return true;
    return false;
  }

  /**
   * Calculates the complexity of the Protective Belt of a research program.
   * Complexity = Count of protective hypotheses + Count of auxiliary (non-Hard Core) taxonomy nodes.
   */
  public static calculateBeltComplexity(program: ResearchProgram): number {
    const auxiliaryNodes = program.taxonomy.nodes.filter(
      node => !LakatosResearchProgramEngine.isHardCoreNode(node.id, program)
    );
    return program.protectiveBeltHypotheses.length + auxiliaryNodes.length;
  }

  /**
   * Evaluates the progressiveness of a research program.
   * LPI_t = (Coverage_t - Coverage_{t-1}) * PVI_t - beta * (Complexity_t - Complexity_{t-1})
   */
  public static evaluateProgressiveness(
    program: ResearchProgram,
    newCoverage: number,
    newPVI: number,
    prevCoverage: number,
    currentComplexity: number,
    prevComplexity: number,
    beta: number = 0.15
  ): ResearchProgram {
    const deltaCoverage = newCoverage - prevCoverage;
    const deltaComplexity = currentComplexity - prevComplexity;
    const lpi = deltaCoverage * newPVI - beta * deltaComplexity;
    const isProgressive = lpi > 0.0;

    return {
      ...program,
      state: {
        ...program.state,
        lpi: Number(lpi.toFixed(4)),
        isProgressive
      }
    };
  }

  /**
   * Calculates the Epistemic Allocation Weights (EAW) using Softmax over a composite score:
   * Score_p = 0.5 * LPI_p + 0.3 * Coverage_p + 0.2 * RepS_w_p
   * EAW_p = exp(Score_p / tau) / Sum(exp(Score_j / tau))
   */
  public static calculateEAWs(
    programs: ResearchProgram[],
    repSwMap: Record<string, number>,
    coverageMap: Record<string, number>,
    temperature: number = 0.20
  ): ResearchProgram[] {
    const scores = programs.map(p => {
      const lpi = p.state.lpi;
      const coverage = coverageMap[p.id] ?? 0.0;
      const repSw = repSwMap[p.id] ?? 0.0;
      const score = 0.5 * lpi + 0.3 * coverage + 0.2 * repSw;
      return { programId: p.id, score };
    });

    const expScores = scores.map(s => Math.exp(s.score / temperature));
    const sumExp = expScores.reduce((sum, val) => sum + val, 0);

    return programs.map(p => {
      const idx = scores.findIndex(s => s.programId === p.id);
      const expVal = idx !== -1 ? expScores[idx] : 0.0;
      const eaw = sumExp > 0 ? expVal / sumExp : 0.0;

      return {
        ...p,
        state: {
          ...p.state,
          eaw: Number(eaw.toFixed(4))
        }
      };
    });
  }

  /**
   * Absorbs an observed anomaly by adding a new auxiliary hypothesis to the protective belt.
   */
  public static absorbAnomaly(
    program: ResearchProgram,
    _anomalyId: string,
    hypothesis: ScientificHypothesis
  ): ResearchProgram {
    const exists = program.protectiveBeltHypotheses.some(h => h.id === hypothesis.id);
    const newBelt = exists
      ? program.protectiveBeltHypotheses
      : [...program.protectiveBeltHypotheses, hypothesis];

    return {
      ...program,
      protectiveBeltHypotheses: newBelt,
      state: {
        ...program.state,
        cumulativeAnomaliesObserved: program.state.cumulativeAnomaliesObserved + 1,
        cumulativeAnomaliesExplained: program.state.cumulativeAnomaliesExplained + 1
      }
    };
  }

  /**
   * Performs taxonomic self-optimization on the research program's taxonomy.
   * Hard Core nodes are protected and completely skipped during mergers and pruning.
   */
  public static optimizeProgramTaxonomy(program: ResearchProgram): ResearchProgram {
    const taxonomy = program.taxonomy;
    let optimizedNodes = JSON.parse(JSON.stringify(taxonomy.nodes)) as OntologicalNode[];
    let optimizedEdges = JSON.parse(JSON.stringify(taxonomy.edges)) as { source: string; target: string; type: 'SUB_CLASS_OF' | 'UNIFIES' | 'INSTANCE_OF' }[];

    const initialCount = optimizedNodes.length + optimizedEdges.length;

    // 1. Consolidate Redundant Nodes (Jaccard concept similarity >= 0.80)
    let mergedAny = true;
    while (mergedAny) {
      mergedAny = false;
      for (let i = 0; i < optimizedNodes.length; i++) {
        for (let j = i + 1; j < optimizedNodes.length; j++) {
          const nodeA = optimizedNodes[i];
          const nodeB = optimizedNodes[j];

          // Hard Core node protection
          if (
            LakatosResearchProgramEngine.isHardCoreNode(nodeA.id, program) ||
            LakatosResearchProgramEngine.isHardCoreNode(nodeB.id, program)
          ) {
            continue;
          }

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

            // Redirect edges
            optimizedEdges = optimizedEdges.map(edge => {
              let source = edge.source;
              let target = edge.target;
              if (source === nodeB.id) source = nodeA.id;
              if (target === nodeB.id) target = nodeA.id;
              return { source, target, type: edge.type };
            });

            // Remove B
            optimizedNodes.splice(j, 1);
            mergedAny = true;
            break;
          }
        }
        if (mergedAny) break;
      }
    }

    // 2. Prune Obsolete Leaf Nodes
    let prunedAny = true;
    while (prunedAny) {
      prunedAny = false;
      for (let i = 0; i < optimizedNodes.length; i++) {
        const node = optimizedNodes[i];

        // Hard Core node protection
        if (LakatosResearchProgramEngine.isHardCoreNode(node.id, program)) {
          continue;
        }

        const hasChildren = optimizedEdges.some(edge => edge.target === node.id);
        if (!hasChildren && node.associatedTheories.length === 0) {
          // Remove outgoing edges from this node
          optimizedEdges = optimizedEdges.filter(edge => edge.source !== node.id);
          optimizedNodes.splice(i, 1);
          prunedAny = true;
          break;
        }
      }
    }

    // Remove duplicates
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
      metadata: {
        ...taxonomy.metadata
      }
    };

    // Evaluate
    const optimizedEval = CrossCorpusValidationEngine.evaluateCrossCorpus(optimizedTaxonomy);
    const baselineEval = CrossCorpusValidationEngine.evaluateCrossCorpus(taxonomy);

    const coverageLoss = Math.max(0.0, baselineEval.coverageCross - optimizedEval.coverageCross);
    const pviLoss = Math.max(0.0, baselineEval.pvi - optimizedEval.pvi);

    // Apply safety rollback if loss is >= 5%
    const isSafe = coverageLoss <= 0.05 * baselineEval.coverageCross && pviLoss <= 0.05 * baselineEval.pvi;
    const finalTaxonomy = isSafe ? optimizedTaxonomy : taxonomy;

    const optimizedCount = finalTaxonomy.nodes.length + finalTaxonomy.edges.length;
    const itemsRemoved = Math.max(0, initialCount - optimizedCount);
    const ops = initialCount > 0 ? itemsRemoved / initialCount : 0.0;

    // SCR
    const uniqueConcepts = new Set(finalTaxonomy.nodes.flatMap(n => n.concepts));
    const complexity = OntologyFitnessEngine.calculateComplexity(finalTaxonomy);
    const scr = complexity > 0 ? (optimizedEval.coverageCross * uniqueConcepts.size) / complexity : 0.0;

    // OAI
    const oai = (coverageLoss * 40.0) / (1.0 + Math.max(0, complexity - OntologyFitnessEngine.calculateComplexity(taxonomy)));

    finalTaxonomy.metadata = {
      ...finalTaxonomy.metadata,
      oai: Number(oai.toFixed(4)),
      scr: Number(scr.toFixed(4)),
      ops: Number(ops.toFixed(4)),
      coverageLoss: Number(coverageLoss.toFixed(4)),
      pviLoss: Number(pviLoss.toFixed(4))
    };

    return {
      ...program,
      taxonomy: finalTaxonomy
    };
  }

  /**
   * Combines predictions of multiple research programs based on their consensus:
   * MPC(claim) = Sum(EAW_p * PVI_p * RepS_w_p * Confidence_p(claim))
   * We aggregate predictions by scenarioId and predictedResolution.
   */
  public static predictConsensus(
    programs: ResearchProgram[],
    repSwMap: Record<string, number>,
    predictionsByProgram: Record<string, TheoryPrediction[]>
  ): TheoryPrediction[] {
    const consolidatedMap: Record<string, TheoryPrediction> = {};
    const consensusScores: Record<string, number> = {};

    programs.forEach(program => {
      const eaw = program.state.eaw;
      const repSw = repSwMap[program.id] ?? 0.0;
      const predictions = predictionsByProgram[program.id] || [];

      // Evaluate PVI (predictive value index) for the program's taxonomy
      const evalResult = CrossCorpusValidationEngine.evaluateCrossCorpus(program.taxonomy);
      const pvi = evalResult.pvi;

      const weight = eaw * pvi * repSw;

      predictions.forEach(pred => {
        const key = `${pred.scenarioId}->${pred.predictedResolution}`;
        const score = weight * pred.confidence;

        consensusScores[key] = (consensusScores[key] ?? 0) + score;

        if (!consolidatedMap[key]) {
          consolidatedMap[key] = {
            ...pred,
            confidence: 0, // Will be updated to consensus score
            candidateId: 'consensus_orchestrator'
          };
        }
      });
    });

    // Update confidences to consolidated MPC scores
    const results: TheoryPrediction[] = [];
    Object.entries(consolidatedMap).forEach(([key, pred]) => {
      const mpcScore = Number((consensusScores[key] ?? 0.0).toFixed(4));
      results.push({
        ...pred,
        confidence: mpcScore
      });
    });

    return results;
  }
}
