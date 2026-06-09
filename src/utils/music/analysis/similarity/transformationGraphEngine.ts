import type { 
  TransformationOpportunity, 
  TransformationNode, 
  TransformationEdge, 
  TransformationGraph, 
  RecommendationPath,
  TransformationFamily
} from '../models/Discovery';

/**
 * Mapeia o mecanismo de transformação para a respectiva família conceitual.
 */
function getFamilyForMechanism(mechanism: string): TransformationFamily {
  switch (mechanism) {
    case 'TRITONE_SUBSTITUTION':
      return 'FUNCTIONAL_SUBSTITUTION';
    case 'MODAL_BORROWING':
      return 'MODAL_REINTERPRETATION';
    case 'CADENTIAL_REINTERPRETATION':
      return 'CADENTIAL_REINTERPRETATION';
    case 'FUNCTIONAL_COMPRESSION':
      return 'PATH_OPTIMIZATION';
    case 'FUNCTIONAL_EXPANSION':
      return 'TENSION_INJECTION';
    default:
      return 'FUNCTIONAL_SUBSTITUTION';
  }
}

/**
 * Constrói o TransformationGraph a partir de uma lista de oportunidades detectadas.
 */
export function buildTransformationGraph(opportunities: TransformationOpportunity[]): TransformationGraph {
  const nodes: TransformationNode[] = opportunities.map(opp => {
    // Computa a dificuldade pedagógica baseada no custo físico e na confiança da detecção
    const pedagogicalDifficulty = Number(((opp.physicalComplexity * 0.7) + ((1.0 - opp.confidence) * 0.3)).toFixed(4));

    return {
      id: `node:${opp.id}`,
      opportunityId: opp.id,
      family: getFamilyForMechanism(opp.mechanism),
      confidence: opp.confidence,
      musicalImpact: opp.musicalImpact,
      similarityImpact: opp.similarityImpact,
      physicalComplexity: opp.physicalComplexity,
      pedagogicalDifficulty,
      references: opp.references
    };
  });

  const edges: TransformationEdge[] = [];

  // Mapeia os nós de volta ao index da oportunidade para detecção rápida de relações
  const nodeMap = new Map<string, { node: TransformationNode; opp: TransformationOpportunity }>();
  nodes.forEach(node => {
    const opp = opportunities.find(o => o.id === node.opportunityId);
    if (opp) {
      nodeMap.set(node.id, { node, opp });
    }
  });

  // 1. Detecção de Conflitos e Habilitadores
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      const dataA = nodeMap.get(nodeA.id);
      const dataB = nodeMap.get(nodeB.id);

      if (!dataA || !dataB) continue;

      // CONFLITOS: Oportunidades no mesmo acorde conflitam (ex: substituir e emprestar ao mesmo tempo)
      if (dataA.opp.chordIndex === dataB.opp.chordIndex) {
        // Evita duplicar arestas de conflito direcionadas se já existe na direção oposta
        const exists = edges.some(e => e.relation === 'CONFLICTS_WITH' && e.from === nodeB.id && e.to === nodeA.id);
        if (!exists) {
          edges.push({
            from: nodeA.id,
            to: nodeB.id,
            relation: 'CONFLICTS_WITH'
          });
        }
      }

      // HABILITADORES (ENABLES):
      // A habilita B se:
      // - A é TENSION_INJECTION (Expansão)
      // - B é FUNCTIONAL_SUBSTITUTION ou CADENTIAL_REINTERPRETATION
      // - B faz referência explícita ao índice do acorde de A (references)
      if (
        nodeA.family === 'TENSION_INJECTION' &&
        (nodeB.family === 'FUNCTIONAL_SUBSTITUTION' || nodeB.family === 'CADENTIAL_REINTERPRETATION') &&
        nodeB.references && nodeB.references.includes(dataA.opp.chordIndex)
      ) {
        edges.push({
          from: nodeA.id,
          to: nodeB.id,
          relation: 'ENABLES',
          stateDelta: [nodeB.opportunityId]
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Auxiliar para verificar se existe conflito entre dois nós no grafo.
 */
function hasConflict(nodeA: TransformationNode, nodeB: TransformationNode, edges: TransformationEdge[]): boolean {
  return edges.some(e => 
    e.relation === 'CONFLICTS_WITH' && 
    ((e.from === nodeA.id && e.to === nodeB.id) || (e.from === nodeB.id && e.to === nodeA.id))
  );
}

/**
 * Auxiliar para verificar se todos os pré-requisitos (ENABLES) de um nó estão presentes no caminho.
 */
function checkPrerequisites(
  node: TransformationNode, 
  currentPathNodes: TransformationNode[], 
  edges: TransformationEdge[]
): boolean {
  // Encontra todas as arestas ENABLES que apontam para o nó
  const enablers = edges
    .filter(e => e.relation === 'ENABLES' && e.to === node.id)
    .map(e => e.from);

  if (enablers.length === 0) return true; // Sem dependências

  // Verifica se pelo menos um habilitador funcional está presente no caminho atual
  return enablers.some(fromId => currentPathNodes.some(n => n.id === fromId));
}

/**
 * Encontra recursivamente subconjuntos de nós livres de conflito.
 */
function findConflictFreeSubsets(
  remainingNodes: TransformationNode[],
  currentPath: TransformationNode[],
  edges: TransformationEdge[],
  allSubsets: TransformationNode[][]
) {
  if (currentPath.length > 0) {
    allSubsets.push([...currentPath]);
  }

  for (let i = 0; i < remainingNodes.length; i++) {
    const nextNode = remainingNodes[i];
    
    // Verifica se conflita com algum nó já no caminho
    const conflict = currentPath.some(n => hasConflict(n, nextNode, edges));
    if (conflict) continue;

    // Verifica se os pré-requisitos lógicos do nó estão satisfeitos no caminho
    if (!checkPrerequisites(nextNode, currentPath, edges)) continue;

    currentPath.push(nextNode);
    findConflictFreeSubsets(remainingNodes.slice(i + 1), currentPath, edges, allSubsets);
    currentPath.pop();
  }
}

/**
 * Gera e ordena caminhos recomendáveis de transformações.
 */
export function generateRecommendedPaths(
  opportunities: TransformationOpportunity[],
  graph: TransformationGraph
): RecommendationPath[] {
  const allSubsets: TransformationNode[][] = [];
  
  // Ordena os nós do grafo por chordIndex para garantir a sequência temporal linear na geração
  const sortedNodes = [...graph.nodes].sort((a, b) => {
    const oppA = opportunities.find(o => o.id === a.opportunityId);
    const oppB = opportunities.find(o => o.id === b.opportunityId);
    return (oppA?.chordIndex ?? 0) - (oppB?.chordIndex ?? 0);
  });

  findConflictFreeSubsets(sortedNodes, [], graph.edges, allSubsets);

  const paths: RecommendationPath[] = allSubsets.map(nodes => {
    const accumulatedImpact = Number(nodes.reduce((sum, n) => sum + n.musicalImpact, 0).toFixed(4));
    const accumulatedDifficulty = Number(nodes.reduce((sum, n) => sum + n.pedagogicalDifficulty, 0).toFixed(4));

    return {
      steps: nodes,
      accumulatedImpact,
      accumulatedDifficulty
    };
  });

  // Ordenação Pedagógica: prioriza maior score pedagógico
  // pedagogicalScore = accumulatedImpact - (accumulatedDifficulty * 0.5)
  paths.sort((a, b) => {
    const scoreA = a.accumulatedImpact - (a.accumulatedDifficulty * 0.5);
    const scoreB = b.accumulatedImpact - (b.accumulatedDifficulty * 0.5);
    return scoreB - scoreA;
  });

  // Filtra caminhos vazios e limita às top 5 recomendações
  return paths.filter(p => p.steps.length > 0).slice(0, 5);
}
