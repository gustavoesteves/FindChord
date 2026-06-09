import type { HarmonicFingerprint } from '../models/HarmonicFingerprint';
import type { 
  SimilarityInsight, 
  InterpretiveInsight, 
  PedagogicalTransformation,
  EvidenceNode,
  EvidenceLink,
  EvidenceGraph,
  EvidenceTrace,
  EvidenceLayer,
  EvidenceRelation
} from '../models/Discovery';

/**
 * Constrói o grafo de evidência e calcula os caminhos de rastreamento (EvidenceTrace)
 * entre a progressão query, a progressão item do corpus e os resultados comparativos.
 */
export function buildEvidenceGraph(
  query: HarmonicFingerprint,
  item: HarmonicFingerprint,
  insights: SimilarityInsight[],
  interpretive: InterpretiveInsight[],
  transformations: PedagogicalTransformation[]
): EvidenceGraph {
  const nodes: EvidenceNode[] = [];
  const links: EvidenceLink[] = [];

  // Helper para adicionar nó evitando duplicados
  const addNode = (node: EvidenceNode) => {
    if (!nodes.some(n => n.id === node.id)) {
      nodes.push(node);
    }
  };

  // Helper para adicionar link evitando duplicados
  const addLink = (from: string, to: string, relation: EvidenceRelation) => {
    if (!links.some(l => l.from === from && l.to === to && l.relation === relation)) {
      links.push({ from, to, relation });
    }
  };

  // 1. Extração de Eventos Brutos da Query (Layer 5, 6 e 7)
  const feQ = query.layers.extendedLayers?.functionalEquivalence;
  if (feQ && feQ.events) {
    feQ.events.forEach(event => {
      addNode({
        id: `query:layer5:function:${event.chordIndex}`,
        layer: 'LAYER_5',
        sourceType: 'FUNCTION_EVENT',
        origin: 'QUERY',
        level: 'OBSERVATION',
        sourceIndex: event.chordIndex,
        weight: 1.0,
        summary: `Query Grafo Funcional: ${event.role} (${event.originalRoman})`,
        metadata: {
          role: event.role,
          roman: event.originalRoman,
          mechanism: event.mechanism,
          targetDegree: event.targetDegree
        }
      });
    });
  }

  const vlQ = query.layers.extendedLayers?.voiceLeading;
  if (vlQ && vlQ.events) {
    vlQ.events.forEach((event, index) => {
      addNode({
        id: `query:layer6:voice-leading:${index}`,
        layer: 'LAYER_6',
        sourceType: 'VOICE_LEADING_EVENT',
        origin: 'QUERY',
        level: 'OBSERVATION',
        sourceIndex: index,
        weight: 1.0,
        summary: `Query Voice Leading no acorde ${index}: suavidade = ${event.smoothnessScore}`,
        metadata: {
          smoothnessScore: event.smoothnessScore,
          thirdToRoot: event.resolutions.thirdToRoot,
          seventhToThird: event.resolutions.seventhToThird,
          tritone: event.resolutions.tritone
        }
      });
    });
  }

  const apQ = query.layers.extendedLayers?.apparentFunction;
  if (apQ && apQ.events) {
    apQ.events.forEach(event => {
      addNode({
        id: `query:layer7:apparent:${event.chordIndex}`,
        layer: 'LAYER_7',
        sourceType: 'APPARENT_FUNCTION_EVENT',
        origin: 'QUERY',
        level: 'INTERPRETATION',
        sourceIndex: event.chordIndex,
        weight: event.resolution.confidence,
        summary: `Query Função Aparente no acorde ${event.chordIndex}: ${event.apparentRole} (${event.apparentSubtype || 'nenhum'})`,
        metadata: {
          apparentRole: event.apparentRole,
          apparentSubtype: event.apparentSubtype,
          confidence: event.resolution.confidence,
          status: event.resolution.status,
          strength: event.resolution.strength,
          distance: event.resolution.distance
        }
      });

      // Link retrospectivo: Layer 7 deriva da Layer 5 funcional local
      addLink(`query:layer7:apparent:${event.chordIndex}`, `query:layer5:function:${event.chordIndex}`, 'DERIVES_FROM');
      // Link retrospectivo: Layer 7 é suportada pela condução física de vozes se houver
      if (event.chordIndex > 0) {
        addLink(`query:layer7:apparent:${event.chordIndex}`, `query:layer6:voice-leading:${event.chordIndex - 1}`, 'DERIVES_FROM');
      }
    });
  }

  // 2. Extração de Eventos Brutos do Match (Corpus Item) (Layer 5, 6 e 7)
  const feI = item.layers.extendedLayers?.functionalEquivalence;
  if (feI && feI.events) {
    feI.events.forEach(event => {
      addNode({
        id: `match:layer5:function:${event.chordIndex}`,
        layer: 'LAYER_5',
        sourceType: 'FUNCTION_EVENT',
        origin: 'MATCH',
        level: 'OBSERVATION',
        sourceIndex: event.chordIndex,
        weight: 1.0,
        summary: `Match Grafo Funcional: ${event.role} (${event.originalRoman})`,
        metadata: {
          role: event.role,
          roman: event.originalRoman,
          mechanism: event.mechanism,
          targetDegree: event.targetDegree
        }
      });
    });
  }

  const vlI = item.layers.extendedLayers?.voiceLeading;
  if (vlI && vlI.events) {
    vlI.events.forEach((event, index) => {
      addNode({
        id: `match:layer6:voice-leading:${index}`,
        layer: 'LAYER_6',
        sourceType: 'VOICE_LEADING_EVENT',
        origin: 'MATCH',
        level: 'OBSERVATION',
        sourceIndex: index,
        weight: 1.0,
        summary: `Match Voice Leading no acorde ${index}: suavidade = ${event.smoothnessScore}`,
        metadata: {
          smoothnessScore: event.smoothnessScore,
          thirdToRoot: event.resolutions.thirdToRoot,
          seventhToThird: event.resolutions.seventhToThird,
          tritone: event.resolutions.tritone
        }
      });
    });
  }

  const apI = item.layers.extendedLayers?.apparentFunction;
  if (apI && apI.events) {
    apI.events.forEach(event => {
      addNode({
        id: `match:layer7:apparent:${event.chordIndex}`,
        layer: 'LAYER_7',
        sourceType: 'APPARENT_FUNCTION_EVENT',
        origin: 'MATCH',
        level: 'INTERPRETATION',
        sourceIndex: event.chordIndex,
        weight: event.resolution.confidence,
        summary: `Match Função Aparente no acorde ${event.chordIndex}: ${event.apparentRole} (${event.apparentSubtype || 'nenhum'})`,
        metadata: {
          apparentRole: event.apparentRole,
          apparentSubtype: event.apparentSubtype,
          confidence: event.resolution.confidence,
          status: event.resolution.status,
          strength: event.resolution.strength,
          distance: event.resolution.distance
        }
      });

      addLink(`match:layer7:apparent:${event.chordIndex}`, `match:layer5:function:${event.chordIndex}`, 'DERIVES_FROM');
      if (event.chordIndex > 0) {
        addLink(`match:layer7:apparent:${event.chordIndex}`, `match:layer6:voice-leading:${event.chordIndex - 1}`, 'DERIVES_FROM');
      }
    });
  }

  // 3. Mapeamento dos Eixos de Similaridade (Nível CONCLUSION)
  insights.forEach(insight => {
    const axisId = `similarity:${insight.axis.toLowerCase()}`;
    let layer: EvidenceLayer = 'LAYER_5';
    if (insight.axis === 'STRUCTURAL') layer = 'LAYER_1';
    else if (insight.axis === 'HARMONIC') layer = 'LAYER_2';
    else if (insight.axis === 'FORMAL') layer = 'LAYER_3';
    else if (insight.axis === 'REGIONAL') layer = 'LAYER_4';
    else if (insight.axis === 'FUNCTIONAL') layer = 'LAYER_5';
    else if (insight.axis === 'VOICE_LEADING') layer = 'LAYER_6';
    else if (insight.axis === 'APPARENT_FUNCTION') layer = 'LAYER_7';

    addNode({
      id: axisId,
      layer,
      sourceType: 'SIMILARITY_AXIS',
      origin: 'COMPARISON',
      level: 'CONCLUSION',
      weight: insight.score,
      summary: `Similaridade ${insight.axis}: ${insight.explanation.pedagogical}`,
      metadata: {
        score: insight.score,
        importance: insight.importance,
        axis: insight.axis
      }
    });

    // Vincular o eixo aos nós brutos associados
    const nodeIds: string[] = [];
    if (insight.axis === 'FUNCTIONAL') {
      if (feQ && feQ.events) {
        feQ.events.forEach(e => {
          const target = `query:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(axisId, target, 'DERIVES_FROM');
          addLink(target, axisId, 'SUPPORTS');
        });
      }
      if (feI && feI.events) {
        feI.events.forEach(e => {
          const target = `match:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(axisId, target, 'DERIVES_FROM');
          addLink(target, axisId, 'SUPPORTS');
        });
      }
    } else if (insight.axis === 'VOICE_LEADING') {
      if (vlQ && vlQ.events) {
        vlQ.events.forEach((_, idx) => {
          const target = `query:layer6:voice-leading:${idx}`;
          nodeIds.push(target);
          addLink(axisId, target, 'DERIVES_FROM');
          addLink(target, axisId, 'SUPPORTS');
        });
      }
      if (vlI && vlI.events) {
        vlI.events.forEach((_, idx) => {
          const target = `match:layer6:voice-leading:${idx}`;
          nodeIds.push(target);
          addLink(axisId, target, 'DERIVES_FROM');
          addLink(target, axisId, 'SUPPORTS');
        });
      }
    } else if (insight.axis === 'APPARENT_FUNCTION') {
      if (apQ && apQ.events) {
        apQ.events.forEach(e => {
          const target = `query:layer7:apparent:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(axisId, target, 'DERIVES_FROM');
          addLink(target, axisId, 'SUPPORTS');
        });
      }
      if (apI && apI.events) {
        apI.events.forEach(e => {
          const target = `match:layer7:apparent:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(axisId, target, 'DERIVES_FROM');
          addLink(target, axisId, 'SUPPORTS');
        });
      }
    }

    insight.evidenceNodeIds = nodeIds;
  });

  // 4. Mapeamento de Insights Interpretativos (Nível INTERPRETATION)
  interpretive.forEach(ins => {
    // Tentar identificar o acorde de origem a partir das evidências (ex: "CADENTIAL_64 found at chord index 1")
    let chordIndex = -1;
    if (ins.evidence) {
      for (const ev of ins.evidence) {
        const m = ev.match(/index\s+(\d+)/i);
        if (m) {
          chordIndex = parseInt(m[1], 10);
          break;
        }
      }
    }

    const interpretiveId = `interpretation:apparent-subtype:${chordIndex !== -1 ? chordIndex : 'generic'}`;
    addNode({
      id: interpretiveId,
      layer: 'LAYER_7',
      sourceType: 'APPARENT_FUNCTION_EVENT',
      origin: 'COMPARISON',
      level: 'INTERPRETATION',
      sourceIndex: chordIndex !== -1 ? chordIndex : undefined,
      weight: ins.importance,
      summary: ins.explanation.pedagogical,
      metadata: {
        source: ins.source,
        importance: ins.importance
      }
    });

    const nodeIds: string[] = [];
    if (chordIndex !== -1) {
      const apparentTarget = `query:layer7:apparent:${chordIndex}`;
      nodeIds.push(apparentTarget);
      addLink(interpretiveId, apparentTarget, 'DERIVES_FROM');
      addLink(apparentTarget, interpretiveId, 'SUPPORTS');
    }
    
    // Vincula também ao eixo APPARENT_FUNCTION
    const parentAxis = 'similarity:apparent_function';
    if (nodes.some(n => n.id === parentAxis)) {
      addLink(parentAxis, interpretiveId, 'SUPPORTED_BY');
      addLink(interpretiveId, parentAxis, 'SUPPORTS');
    }

    ins.evidenceNodeIds = nodeIds;
  });

  // 5. Mapeamento de Transformações Pedagógicas (Nível CONCLUSION)
  transformations.forEach(trans => {
    const transId = `transformation:${trans.mechanism.toLowerCase()}`;
    addNode({
      id: transId,
      layer: trans.mechanism === 'CADENTIAL_REINTERPRETATION' ? 'LAYER_7' : 'LAYER_5',
      sourceType: 'TRANSFORMATION',
      origin: 'COMPARISON',
      level: 'CONCLUSION',
      weight: 0.85,
      summary: trans.pedagogicalDescription,
      metadata: {
        mechanism: trans.mechanism,
        effects: trans.effects
      }
    });

    const nodeIds: string[] = [];

    // Ligar às evidências funcionais da Query/Match dependendo do mecanismo
    if (trans.mechanism === 'TRITONE_SUBSTITUTION' && feQ && feI) {
      feQ.events.forEach(e => {
        if (e.mechanism === 'TRITONE_SUBSTITUTION') {
          const target = `query:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
          addLink(target, transId, 'SUPPORTS');
        }
      });
      feI.events.forEach(e => {
        if (e.mechanism === 'TRITONE_SUBSTITUTION') {
          const target = `match:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
          addLink(target, transId, 'SUPPORTS');
        }
      });
    } else if (trans.mechanism === 'MODAL_BORROWING' && feQ && feI) {
      feQ.events.forEach(e => {
        if (e.mechanism === 'MODAL_BORROWING') {
          const target = `query:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
          addLink(target, transId, 'SUPPORTS');
        }
      });
      feI.events.forEach(e => {
        if (e.mechanism === 'MODAL_BORROWING') {
          const target = `match:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
          addLink(target, transId, 'SUPPORTS');
        }
      });
    } else if (trans.mechanism === 'CADENTIAL_REINTERPRETATION' && apQ && apI) {
      apQ.events.forEach(e => {
        if (e.apparentSubtype) {
          const target = `query:layer7:apparent:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
          addLink(target, transId, 'SUPPORTS');
        }
      });
      apI.events.forEach(e => {
        if (e.apparentSubtype) {
          const target = `match:layer7:apparent:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
          addLink(target, transId, 'SUPPORTS');
        }
      });
    } else if (
      (trans.mechanism === 'FUNCTIONAL_COMPRESSION' || trans.mechanism === 'FUNCTIONAL_EXPANSION') &&
      feQ && feI
    ) {
      // Liga a todos os nós funcionais relevantes
      feQ.events.forEach(e => {
        if (e.role === 'PREDOMINANT' || e.mechanism === 'SECONDARY_FUNCTION') {
          const target = `query:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
        }
      });
      feI.events.forEach(e => {
        if (e.role === 'PREDOMINANT' || e.mechanism === 'SECONDARY_FUNCTION') {
          const target = `match:layer5:function:${e.chordIndex}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
        }
      });
    }

    // Se houver preservação de voice leading, vincula aos nós de voice leading correspondentes
    if (trans.effects.includes('VOICE_LEADING_PRESERVATION')) {
      if (vlQ && vlQ.events) {
        vlQ.events.forEach((_, idx) => {
          const target = `query:layer6:voice-leading:${idx}`;
          nodeIds.push(target);
          addLink(transId, target, 'DERIVES_FROM');
        });
      }
    }

    trans.evidenceNodeIds = nodeIds;
  });

  return { nodes, links };
}

/**
 * Computa caminhos logicamente navegáveis (EvidenceTrace) ligando nós
 * de alto nível (Transformações/Insights) até os nós brutos de observação.
 */
export function findEvidenceTraces(graph: EvidenceGraph): EvidenceTrace[] {
  const traces: EvidenceTrace[] = [];
  const conclusionNodes = graph.nodes.filter(n => n.level === 'CONCLUSION' || n.level === 'INTERPRETATION');

  conclusionNodes.forEach(startNode => {
    const path: string[] = [startNode.id];
    const visited = new Set<string>([startNode.id]);

    // BFS para encontrar caminhos até nós brutos (level: OBSERVATION)
    const queue: { current: string; path: string[] }[] = [{ current: startNode.id, path }];

    while (queue.length > 0) {
      const { current, path: currentPath } = queue.shift()!;
      const currentNode = graph.nodes.find(n => n.id === current);

      if (currentNode && currentNode.level === 'OBSERVATION') {
        // Encontramos um caminho navegável até uma observação bruta!
        traces.push({
          targetNodeId: startNode.id,
          path: [...currentPath]
        });
        continue;
      }

      // Encontrar vizinhos conectados por 'DERIVES_FROM' ou 'SUPPORTED_BY'
      const outgoingLinks = graph.links.filter(l => l.from === current && (l.relation === 'DERIVES_FROM' || l.relation === 'SUPPORTED_BY'));
      outgoingLinks.forEach(link => {
        if (!visited.has(link.to)) {
          visited.add(link.to);
          queue.push({
            current: link.to,
            path: [...currentPath, link.to]
          });
        }
      });
    }
  });

  return traces;
}
