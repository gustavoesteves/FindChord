import type { HarmonicPerspective, PerspectiveCluster, RouteCategory } from "../models/SuggestedRoute";

export class PerspectiveClusterer {
  public static clusterize(routes: HarmonicPerspective[]): PerspectiveCluster[] {
    if (!routes || routes.length === 0) return [];

    const clustersMap = new Map<RouteCategory, HarmonicPerspective[]>();

    for (const route of routes) {
      if (!clustersMap.has(route.category)) {
        clustersMap.set(route.category, []);
      }
      clustersMap.get(route.category)!.push(route);
    }

    const clusters: PerspectiveCluster[] = [];

    for (const [category, perspectives] of clustersMap.entries()) {
      // Ordena as perspectivas do cluster pelo score
      perspectives.sort((a, b) => (b.overallPerspectiveScore || 0) - (a.overallPerspectiveScore || 0));

      const topPerspective = perspectives[0];
      
      clusters.push({
        id: `cluster_${category.toLowerCase()}`,
        category,
        name: this.getClusterName(category),
        topPerspectiveId: topPerspective.id,
        perspectives,
        overallClusterScore: topPerspective.overallPerspectiveScore || 0
      });
    }

    // Ordena os clusters baseando-se no overallClusterScore (que é o score do campeão de cada cluster)
    clusters.sort((a, b) => b.overallClusterScore - a.overallClusterScore);

    // Gerar argumentação inter-cluster (comparando com o cluster vencedor)
    if (clusters.length > 1) {
      const winningCluster = clusters[0];
      for (let i = 1; i < clusters.length; i++) {
        clusters[i].tradeoffsAgainstWinningCluster = this.generateTradeoffs(clusters[i], winningCluster);
      }
    }

    return clusters;
  }

  private static getClusterName(category: RouteCategory): string {
    switch (category) {
      case 'TENSION': return 'Intensificar a resolução';
      case 'SURPRISE': return 'Quebrar a expectativa';
      case 'COLOR': return 'Adicionar nova cor harmônica';
      case 'MOTION': return 'Criar mais movimento';
      default: return 'Caminho Alternativo';
    }
  }

  private static generateTradeoffs(cluster: PerspectiveCluster, winningCluster: PerspectiveCluster): string[] {
    const tradeoffs: string[] = [];
    
    if (cluster.category === 'COLOR' && winningCluster.category === 'TENSION') {
      tradeoffs.push('Este caminho opta por focar em texturas modais exóticas, em forte oposição à agressividade cromática sugerida pelo Caminho Principal.');
    } else if (cluster.category === 'TENSION' && winningCluster.category !== 'TENSION') {
      tradeoffs.push('Introduz tensão cromática altamente direcional, contrastando com a abordagem mais fluída ou previsível do Caminho Principal.');
    } else if (cluster.category === 'SURPRISE') {
      tradeoffs.push('Prioriza resoluções não-convencionais para surpreender o ouvinte, distanciando-se do destino natural esperado pelo Caminho Principal.');
    } else if (cluster.category === 'MOTION') {
      tradeoffs.push('Foca em manter a propulsão rítmico-harmônica e o movimento tonal clássico, sem depender de substituições disruptivas.');
    } else if (cluster.category === 'COLOR') {
      tradeoffs.push('Escurece ou ilumina a narrativa usando modos paralelos, mudando a cor emocional ao invés de forçar tensões estruturais.');
    } else {
      tradeoffs.push('Representa uma filosofia narrativa divergente em relação à recomendação principal.');
    }

    return tradeoffs;
  }
}
