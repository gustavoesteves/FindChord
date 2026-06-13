import type { UniversalLaw } from '../models/UniversalLaw';
import type { LawDependencyGraph } from '../models/LawDependencyGraph';
import type { MetaTheory } from '../models/MetaTheory';

export class MetaTheorySynthesisEngine {
  /**
   * Synthesizes a unified MetaTheory from the universal laws, dependency graph, and historical support metrics.
   *
   * @param laws List of universal/local laws evaluated in the system.
   * @param dependencyGraph Compressed dependency graph containing roots and edges.
   * @param historicalLawMetrics Historical independent rediscovery metrics from F11-W (containing HIRI).
   */
  public static synthesizeMetaTheory(
    laws: UniversalLaw[],
    dependencyGraph: LawDependencyGraph,
    historicalLawMetrics: Record<string, { hiri: number }>
  ): MetaTheory {
    // 1. Detect fundamental principles (roots of the dependency graph)
    let roots = dependencyGraph.fundamentalLaws.map(l => l.lawId);
    if (roots.length === 0) {
      // Safe fallback: find nodes in the graph with no incoming DERIVATION edges
      const nodesWithIncoming = new Set(
        dependencyGraph.edges
          .filter(e => e.type === 'DERIVATION')
          .map(e => e.target)
      );
      roots = dependencyGraph.nodes.filter(n => !nodesWithIncoming.has(n));
    }

    // 2. Traversal to gather all explained/derived laws
    const getDescendants = (nodeId: string): Set<string> => {
      const visited = new Set<string>();
      const queue = [nodeId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (!visited.has(current)) {
          visited.add(current);
          const targets = dependencyGraph.edges
            .filter(e => e.source === current && e.type === 'DERIVATION')
            .map(e => e.target);
          queue.push(...targets);
        }
      }
      return visited;
    };

    const explainedSet = new Set<string>();
    roots.forEach(root => {
      const desc = getDescendants(root);
      desc.forEach(d => explainedSet.add(d));
    });
    const explainedLawIds = Array.from(explainedSet);

    // 3. Explanatory Depth (ED) - average of max chain lengths from each root
    const getMaxPathLength = (nodeId: string, visited: Set<string>): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const outgoing = dependencyGraph.edges.filter(
        e => e.source === nodeId && e.type === 'DERIVATION'
      );
      if (outgoing.length === 0) {
        visited.delete(nodeId);
        return 0;
      }

      let maxDepth = 0;
      for (const edge of outgoing) {
        maxDepth = Math.max(maxDepth, 1 + getMaxPathLength(edge.target, visited));
      }

      visited.delete(nodeId);
      return maxDepth;
    };

    const maxPaths = roots.map(root => getMaxPathLength(root, new Set<string>()));
    const explanatoryDepth = roots.length > 0
      ? maxPaths.reduce((sum, val) => sum + val, 0) / roots.length
      : 0.0;

    // 4. Theoretical Unification Score (TUS)
    const totalLawsCount = laws.length;
    const theoreticalUnificationScore = totalLawsCount > 0
      ? explainedLawIds.length / totalLawsCount
      : 0.0;

    // 5. Historical Support Score (HSS) - average HIRI of roots
    const hiriScores = roots.map(root => {
      const metrics = historicalLawMetrics[root];
      return metrics ? metrics.hiri : 0.0;
    });
    const historicalSupport = roots.length > 0
      ? hiriScores.reduce((sum, val) => sum + val, 0) / roots.length
      : 0.0;

    // 6. Dominant Domains
    const dominantDomainsSet = new Set<UniversalLaw['domain']>();
    roots.forEach(rootId => {
      const law = laws.find(l => l.id === rootId);
      if (law) {
        dominantDomainsSet.add(law.domain);
      }
    });
    const dominantDomains = Array.from(dominantDomainsSet);

    // 7. Dynamic name & narrative synthesis
    const nameMap: Record<string, string> = {
      parsimonious_voice_leading: 'Economia de Movimento',
      symmetry_seeking: 'Simetria Estrutural',
      tonal_gravity: 'Gravidade Tonal'
    };

    const rootNames = roots.map(r => nameMap[r] || r);
    const name = `Teoria Harmônica Unificada baseada em: ${rootNames.join(' e ')}`;

    const principlesDescriptions = roots.map((rootId, idx) => {
      if (rootId === 'parsimonious_voice_leading') {
        return `${idx + 1}. Economia de Movimento (Voice Leading Parsimonioso): Conexão física mais curta e suave entre notas em transições de acordes.`;
      }
      if (rootId === 'symmetry_seeking') {
        return `${idx + 1}. Busca por Simetria Estrutural: Organização cíclica e geométrica equilibrada que desafia a atração funcional.`;
      }
      if (rootId === 'tonal_gravity') {
        return `${idx + 1}. Gravidade Tonal: Atração e polarização de centros de resolução tonal e fechamento cadencial.`;
      }
      const law = laws.find(l => l.id === rootId);
      return `${idx + 1}. Princípio base em ${law?.domain || 'DOMÍNIO'}: ${law?.statement || rootId}`;
    });

    const metaNarrative = `A harmonia emerge da interação dinâmica entre os seguintes princípios fundamentais:\n\n` +
      principlesDescriptions.join('\n') +
      `\n\nEsta formulação unificada atinge um Theoretical Unification Score (TUS) de ${(theoreticalUnificationScore * 100).toFixed(2)}%, explicando ${explainedLawIds.length} das ${totalLawsCount} leis harmônicas sob uma profundidade explicativa média de ${explanatoryDepth.toFixed(2)}, com suporte musicológico histórico de ${historicalSupport.toFixed(4)}.`;

    return {
      id: `mt_${roots.join('_')}`,
      name,
      metaNarrative,
      fundamentalPrinciples: roots,
      explainedLawIds,
      dominantDomains,
      theoreticalUnificationScore: Number(theoreticalUnificationScore.toFixed(4)),
      explanatoryDepth: Number(explanatoryDepth.toFixed(4)),
      historicalSupport: Number(historicalSupport.toFixed(4))
    };
  }
}
