import type { TonalRegion, TonalRegionNode } from '../models/FunctionalAnalysis';

export function getRegionRank(region: TonalRegion): number {
  if (region.isHomeKey) return 3;

  switch (region.type) {
    case 'ESTABLISHED_MODULATION':
      return 2;
    case 'REGIONAL_SHIFT':
      return 1;
    case 'TONICIZATION':
      return 0;
  }
}

export function buildTonalRegionTree(regions: TonalRegion[]): TonalRegionNode | null {
  if (regions.length === 0) return null;

  // 1. Mapeia as regiões planas para nós da árvore com IDs estáveis
  const nodes: TonalRegionNode[] = regions.map((r, index) => ({
    id: `region-node-${index}`,
    region: r,
    children: []
  }));

  // 2. A primeira região representa a tonalidade de partida (Home Key) e atua como a raiz da árvore
  const root = nodes[0];
  let currentParent = root;

  // 3. Montagem iterativa da hierarquia baseada em ranks
  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeRank = getRegionRank(node.region);
    const parentRank = getRegionRank(currentParent.region);

    if (nodeRank < parentRank) {
      // O nó atual é subordinado ao pai atual (ex: tonicização dentro de modulação estável ou home key)
      currentParent.children.push(node);
      Object.defineProperty(node, 'parent', {
        value: currentParent,
        enumerable: false,
        writable: true,
        configurable: true
      });
      // Se não for uma folha local pura (Rank > 0), ele se torna o novo escopo/pai ativo
      if (nodeRank > 0) {
        currentParent = node;
      }
    } else {
      // O nó atual tem rank igual ou superior. Subimos a árvore de pais até encontrar um nó de rank estritamente maior
      let p = currentParent;
      while (p.parent && nodeRank >= getRegionRank(p.region)) {
        p = p.parent;
      }
      p.children.push(node);
      Object.defineProperty(node, 'parent', {
        value: p,
        enumerable: false,
        writable: true,
        configurable: true
      });
      currentParent = node;
    }
  }

  return root;
}

export function getDeepestNesting(node: TonalRegionNode, currentLevel: number = 0): number {
  if (node.children.length === 0) return currentLevel;
  let maxSubLevel = currentLevel;
  for (const child of node.children) {
    maxSubLevel = Math.max(maxSubLevel, getDeepestNesting(child, currentLevel + 1));
  }
  return maxSubLevel;
}
