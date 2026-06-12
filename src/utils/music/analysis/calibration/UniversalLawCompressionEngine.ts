import type { UniversalLaw } from '../models/UniversalLaw';
import type { LawDependencyGraph, LawDependencyEdge, LawDependency, FundamentalLaw } from '../models/LawDependencyGraph';

export class UniversalLawCompressionEngine {
  /**
   * Helper to retrieve a law's accuracy in a universe under various evaluation structures.
   */
  private static getLawAccuracy(
    uniIdx: number,
    lawId: string,
    evaluationsByUniverse: Record<string, any>[]
  ): number {
    const uniEval = evaluationsByUniverse[uniIdx];
    if (!uniEval) return 0.0;

    // Check direct lawAccuracies key
    if (uniEval.lawAccuracies && uniEval.lawAccuracies[lawId] !== undefined) {
      return uniEval.lawAccuracies[lawId];
    }

    // Check direct mapping lawId -> accuracy
    if (uniEval[lawId] !== undefined) {
      if (typeof uniEval[lawId] === 'number') {
        return uniEval[lawId];
      }
      if (typeof uniEval[lawId] === 'object' && uniEval[lawId].accuracy !== undefined) {
        return uniEval[lawId].accuracy;
      }
    }

    // Check nested mapping: programId -> { lawAccuracies: { lawId -> accuracy } }
    let maxAcc = 0.0;
    Object.values(uniEval).forEach((progEval: any) => {
      if (progEval && progEval.lawAccuracies && progEval.lawAccuracies[lawId] !== undefined) {
        maxAcc = Math.max(maxAcc, progEval.lawAccuracies[lawId]);
      }
    });

    return maxAcc;
  }

  /**
   * Evaluates if a law is predictive in a universe (accuracy >= threshold).
   */
  private static isLawPredictive(
    uniIdx: number,
    lawId: string,
    evaluationsByUniverse: Record<string, any>[],
    threshold: number = 0.65
  ): boolean {
    return this.getLawAccuracy(uniIdx, lawId, evaluationsByUniverse) >= threshold;
  }

  /**
   * Builds the dependency graph, computes implication scores, resolves cycles, and finds fundamental laws.
   */
  public static buildDependencyGraph(
    laws: UniversalLaw[],
    evaluationsByUniverse: Record<string, any>[],
    predictiveThreshold: number = 0.65,
    injectMockEdges?: LawDependencyEdge[]
  ): LawDependencyGraph {
    const nodes = laws.map(l => l.id);
    let edges: LawDependencyEdge[] = [];

    const universesCount = evaluationsByUniverse.length;

    if (injectMockEdges && injectMockEdges.length > 0) {
      edges = [...injectMockEdges];
    } else {

    // 1. Calculate Directed Implication Scores (DIS) and build edges
    for (let i = 0; i < laws.length; i++) {
      for (let j = 0; j < laws.length; j++) {
        if (i === j) continue;

        const lawA = laws[i].id;
        const lawB = laws[j].id;

        // Calculate count of predictive occurrences
        let countA = 0;
        let countAB = 0;

        for (let u = 0; u < universesCount; u++) {
          const isAPred = this.isLawPredictive(u, lawA, evaluationsByUniverse, predictiveThreshold);
          const isBPred = this.isLawPredictive(u, lawB, evaluationsByUniverse, predictiveThreshold);

          if (isAPred) {
            countA++;
            if (isBPred) {
              countAB++;
            }
          }
        }

        const disAtoB = countA > 0 ? countAB / countA : 0.0;

        // Check if reciprocal score can be computed
        let countB = 0;
        for (let u = 0; u < universesCount; u++) {
          if (this.isLawPredictive(u, lawB, evaluationsByUniverse, predictiveThreshold)) {
            countB++;
          }
        }
        const disBtoA = countB > 0 ? countAB / countB : 0.0;

        // Formulate relation type:
        // We only add derivation if B depends on A (disAtoB >= 0.80) and B does not imply A (disBtoA < 0.80)
        // Redundancy if both imply each other >= 0.80
        // To avoid double addition, we only add edges when i < j (for redundancy) or when type matches
        if (disAtoB >= 0.80 && disBtoA >= 0.80) {
          if (i < j) {
            edges.push({
              source: lawA,
              target: lawB,
              type: 'REDUNDANCY',
              score: Number(Math.min(disAtoB, disBtoA).toFixed(4))
            });
          }
        } else if (disAtoB >= 0.80 && disBtoA < 0.80) {
          edges.push({
            source: lawA,
            target: lawB,
            type: 'DERIVATION',
            score: Number(disAtoB.toFixed(4))
          });
        }
      }
    }
    }

    // 2. Cycle Detection and Breaking (for DERIVATION edges)
    let initialCyclesCount = 0;
    const findCycle = (graphEdges: LawDependencyEdge[]): LawDependencyEdge[] | null => {
      const adj = new Map<string, LawDependencyEdge[]>();
      nodes.forEach(n => adj.set(n, []));
      graphEdges.filter(e => e.type === 'DERIVATION').forEach(e => adj.get(e.source)!.push(e));

      const visited = new Set<string>();
      const recStack = new Set<string>();
      const edgeHistory: LawDependencyEdge[] = [];

      const dfs = (curr: string): LawDependencyEdge[] | null => {
        visited.add(curr);
        recStack.add(curr);

        const neighbors = adj.get(curr) || [];
        for (const edge of neighbors) {
          if (!visited.has(edge.target)) {
            edgeHistory.push(edge);
            const cycle = dfs(edge.target);
            if (cycle) return cycle;
            edgeHistory.pop();
          } else if (recStack.has(edge.target)) {
            // Found a cycle! Collect cycle edges.
            const cycleStartIdx = edgeHistory.findIndex(e => e.source === edge.target || e.target === edge.target);
            const cycleEdges = cycleStartIdx !== -1 ? edgeHistory.slice(cycleStartIdx) : [];
            cycleEdges.push(edge);
            return cycleEdges;
          }
        }

        recStack.delete(curr);
        return null;
      };

      for (const node of nodes) {
        if (!visited.has(node)) {
          const cycle = dfs(node);
          if (cycle) return cycle;
        }
      }
      return null;
    };

    // Count initial cycles by running detection and breaking them
    let activeEdges = [...edges];
    let cycle = findCycle(activeEdges);
    while (cycle !== null) {
      initialCyclesCount++;

      // Find edge with the lowest implication score or lowest score delta to break the cycle
      let edgeToBreak = cycle[0];
      let minScore = cycle[0].score;

      cycle.forEach(e => {
        if (e.score < minScore) {
          minScore = e.score;
          edgeToBreak = e;
        }
      });

      // Remove the cycle-closing edge from activeEdges
      activeEdges = activeEdges.filter(e => !(e.source === edgeToBreak.source && e.target === edgeToBreak.target));
      cycle = findCycle(activeEdges);
    }

    // 3. Hierarchy Index computation
    const totalEdgesCount = edges.filter(e => e.type === 'DERIVATION').length;
    const hierarchyIndex = totalEdgesCount > 0
      ? Math.max(0.0, 1.0 - initialCyclesCount / totalEdgesCount)
      : 1.0;

    // 4. Identify Fundamental Laws (in-degree of 0 for DERIVATION edges)
    const derivationEdges = activeEdges.filter(e => e.type === 'DERIVATION');
    const fundamentalLawIds = nodes.filter(nodeId => {
      return !derivationEdges.some(e => e.target === nodeId);
    });

    // 5. Build dependencies format (LawDependency)
    const dependencies: LawDependency[] = derivationEdges.map(e => ({
      parentLawId: e.source,
      childLawId: e.target,
      explanatoryPower: e.score
    }));

    // Helper to find all descendants of a node in the DAG
    const getDescendants = (startNode: string): string[] => {
      const descendants = new Set<string>();
      const queue = [startNode];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const children = derivationEdges.filter(e => e.source === curr).map(e => e.target);
        children.forEach(c => {
          if (!descendants.has(c)) {
            descendants.add(c);
            queue.push(c);
          }
        });
      }
      return Array.from(descendants);
    };

    // Build fundamental laws format (FundamentalLaw)
    const fundamentalLaws: FundamentalLaw[] = fundamentalLawIds.map(lawId => {
      const descendants = getDescendants(lawId);
      return {
        lawId,
        descendants,
        compressionGain: descendants.length
      };
    });

    // 6. Law Compression Ratio (LCR)
    // LCR = 1.0 - fundamentalLaws / universalLaws
    const lcr = laws.length > 0 ? 1.0 - fundamentalLaws.length / laws.length : 0.0;

    return {
      nodes,
      edges: activeEdges,
      dependencies,
      fundamentalLaws,
      metrics: {
        lcr: Number(lcr.toFixed(4)),
        hierarchyIndex: Number(hierarchyIndex.toFixed(4))
      }
    };
  }

  /**
   * Measures the loss of explanation by temporarily ablating a law.
   * Returns the count of universes that become unexplained (no active law >= threshold).
   */
  public static runAblationTest(
    lawId: string,
    laws: UniversalLaw[],
    evaluationsByUniverse: Record<string, any>[],
    predictiveThreshold: number = 0.65
  ): number {
    const universesCount = evaluationsByUniverse.length;

    let baseExplainedCount = 0;
    let ablatedExplainedCount = 0;

    for (let u = 0; u < universesCount; u++) {
      // Check if universe is explained in baseline (at least one law is predictive)
      let baseExplained = false;
      laws.forEach(l => {
        if (this.isLawPredictive(u, l.id, evaluationsByUniverse, predictiveThreshold)) {
          baseExplained = true;
        }
      });
      if (baseExplained) baseExplainedCount++;

      // Check if universe is explained when ablated (at least one other law is predictive)
      let ablatedExplained = false;
      laws.forEach(l => {
        if (l.id !== lawId && this.isLawPredictive(u, l.id, evaluationsByUniverse, predictiveThreshold)) {
          ablatedExplained = true;
        }
      });
      if (ablatedExplained) ablatedExplainedCount++;
    }

    return baseExplainedCount - ablatedExplainedCount;
  }
}
