import type { HarmonicKnowledgeGraph, HarmonicNode, HarmonicEdge, HarmonicNodeType } from '../models/HarmonicGraph';

/**
 * Engine de consulta e travessia sobre o Grafo de Conhecimento Harmônico.
 */
export class HarmonicGraphEngine {
  private graph: HarmonicKnowledgeGraph;
  private nodeMap = new Map<string, HarmonicNode>();
  private outgoingEdges = new Map<string, HarmonicEdge[]>();
  private incomingEdges = new Map<string, HarmonicEdge[]>();

  constructor(graph: HarmonicKnowledgeGraph) {
    this.graph = graph;
    // Indexa os nós e as arestas para buscas em O(1)
    graph.nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
      this.outgoingEdges.set(node.id, []);
      this.incomingEdges.set(node.id, []);
    });

    graph.edges.forEach((edge) => {
      const out = this.outgoingEdges.get(edge.sourceId) || [];
      out.push(edge);
      this.outgoingEdges.set(edge.sourceId, out);

      const inc = this.incomingEdges.get(edge.targetId) || [];
      inc.push(edge);
      this.incomingEdges.set(edge.targetId, inc);
    });
  }

  /**
   * Retorna um nó específico pelo seu ID estável.
   */
  getNodeById(id: string): HarmonicNode | null {
    return this.nodeMap.get(id) || null;
  }

  /**
   * Retorna todos os nós de um determinado tipo.
   */
  getNodesByType(type: HarmonicNodeType): HarmonicNode[] {
    return this.graph.nodes.filter((node) => node.type === type);
  }

  /**
   * Retorna todas as arestas de saída (outgoing edges) de um nó.
   */
  getOutgoingRelations(nodeId: string): HarmonicEdge[] {
    return this.outgoingEdges.get(nodeId) || [];
  }

  /**
   * Retorna todas as arestas de entrada (incoming edges) de um nó.
   */
  getIncomingRelations(nodeId: string): HarmonicEdge[] {
    return this.incomingEdges.get(nodeId) || [];
  }

  /**
   * Retorna os nós vizinhos diretos, opcionalmente filtrados por uma relação/aresta específica.
   */
  getNeighbors(nodeId: string, relation?: string): HarmonicNode[] {
    const neighbors: HarmonicNode[] = [];
    const seen = new Set<string>();

    const processEdge = (edge: HarmonicEdge, neighborId: string) => {
      if (relation && edge.relation !== relation) return;
      if (seen.has(neighborId)) return;
      
      const node = this.nodeMap.get(neighborId);
      if (node) {
        neighbors.push(node);
        seen.add(neighborId);
      }
    };

    this.getOutgoingRelations(nodeId).forEach((edge) => processEdge(edge, edge.targetId));
    this.getIncomingRelations(nodeId).forEach((edge) => processEdge(edge, edge.sourceId));

    return neighbors;
  }

  /**
   * Retorna todos os acordes pertencentes a uma determinada frase, ordenados por seu índice na timeline.
   */
  getPhraseChords(phraseId: string): HarmonicNode[] {
    const chords = this.getOutgoingRelations(phraseId)
      .filter((edge) => edge.relation === 'CONTAINS')
      .map((edge) => this.nodeMap.get(edge.targetId))
      .filter((node): node is HarmonicNode => node !== undefined && node.type === 'CHORD');

    return chords.sort((a, b) => (Number(a.properties.index) || 0) - (Number(b.properties.index) || 0));
  }

  /**
   * Retorna o acorde que resolve uma determinada cadência, se houver.
   */
  getCadenceResolution(cadenceId: string): HarmonicNode | null {
    const edge = this.getOutgoingRelations(cadenceId).find((e) => e.relation === 'RESOLVES_TO');
    if (edge) {
      return this.nodeMap.get(edge.targetId) || null;
    }
    return null;
  }

  /**
   * Retorna a frase consequente associada a uma frase antecedente, via pareamento formal.
   */
  getPeriodConsequent(phraseId: string): HarmonicNode | null {
    const edge = this.getOutgoingRelations(phraseId).find((e) => e.relation === 'ANSWERS');
    if (edge) {
      return this.nodeMap.get(edge.targetId) || null;
    }
    return null;
  }
}
