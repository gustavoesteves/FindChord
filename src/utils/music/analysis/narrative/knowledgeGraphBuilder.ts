import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type { HarmonicKnowledgeGraph, HarmonicNode, HarmonicEdge } from '../models/HarmonicGraph';

/**
 * Constrói o Grafo de Conhecimento Harmônico (Knowledge Graph) a partir dos resultados analíticos.
 * 
 * @param analysis - Objeto FunctionalAnalysis contendo acordes, regiões, frases e cadências.
 * @returns HarmonicKnowledgeGraph estruturado.
 */
export function buildHarmonicKnowledgeGraph(analysis: FunctionalAnalysis): HarmonicKnowledgeGraph {
  const nodes: HarmonicNode[] = [];
  const edges: HarmonicEdge[] = [];

  const chords = analysis.chords || [];
  const regions = analysis.regions || [];
  const phrases = analysis.phrases || [];
  const phraseGroups = analysis.phraseGroups || [];
  const cadences = analysis.cadences || [];

  // 1. CONSTRUÇÃO DE NÓS (com IDs estáveis)

  // 1.1 Nós de Acordes (CHORD)
  chords.forEach((c) => {
    nodes.push({
      id: `chord:${c.index}`,
      type: 'CHORD',
      label: `${c.chordSymbol} (${c.romanNumeral})`,
      properties: {
        index: c.index,
        chordSymbol: c.chordSymbol,
        romanNumeral: c.romanNumeral,
        scaleDegree: c.scaleDegree,
        harmonicFunction: c.harmonicFunction,
        confidence: c.confidence,
        isDiatonic: c.isDiatonic,
        intent: c.semantic?.intent,
        phraseRole: c.semantic?.phraseRole,
        causes: c.semantic?.causes || [],
        supports: c.semantic?.supports || [],
        explanation: c.semantic?.explanation || []
      }
    });
  });

  // 1.2 Nós de Regiões (REGION)
  regions.forEach((reg, regIdx) => {
    nodes.push({
      id: `region:${regIdx}`,
      type: 'REGION',
      label: `Região ${reg.baseCenter.root} ${reg.baseCenter.mode === 'MAJOR' ? 'Maior' : 'Menor'}`,
      properties: {
        index: regIdx,
        root: reg.baseCenter.root,
        mode: reg.baseCenter.mode,
        startIndex: reg.startIndex,
        endIndex: reg.endIndex,
        confidence: reg.confidence,
        type: reg.type,
        stabilityScore: reg.stabilityScore
      }
    });
  });

  // 1.3 Nós de Frases (PHRASE)
  phrases.forEach((p) => {
    nodes.push({
      id: `phrase:${p.index}`,
      type: 'PHRASE',
      label: `Frase ${p.index + 1}`,
      properties: {
        index: p.index,
        startIndex: p.startIndex,
        endIndex: p.endIndex,
        formalRole: p.formalRole || 'STANDALONE',
        phraseGroupId: p.phraseGroupId,
        sectionLabel: p.sectionLabel
      }
    });
  });

  // 1.4 Nós de Grupos de Frase (PHRASE_GROUP)
  phraseGroups.forEach((g) => {
    nodes.push({
      id: `phrase_group:${g.index}`,
      type: 'PHRASE_GROUP',
      label: `Grupo ${g.name}`,
      properties: {
        index: g.index,
        type: g.type,
        phraseIndices: g.phraseIndices,
        confidence: g.confidence,
        name: g.name,
        sectionLabel: g.sectionLabel
      }
    });
  });

  // 1.5 Nós de Cadências (CADENCE)
  cadences.forEach((cad, cadIdx) => {
    nodes.push({
      id: `cadence:${cadIdx}`,
      type: 'CADENCE',
      label: `Cadência ${cad.name}`,
      properties: {
        index: cadIdx,
        name: cad.name,
        type: cad.type,
        startIndex: cad.startIndex,
        endIndex: cad.endIndex,
        strength: cad.strength,
        cadentialWeight: cad.cadentialWeight,
        resolutionStatus: cad.resolution.status
      }
    });
  });

  // Helper para gerar IDs únicos de arestas
  const addEdge = (sourceId: string, targetId: string, relation: HarmonicEdge['relation'], properties?: Record<string, unknown>) => {
    const id = `${sourceId}->${relation}->${targetId}`;
    edges.push({ id, sourceId, targetId, relation, properties });
  };

  // 2. CONSTRUÇÃO DE ARESTAS (Relações)

  // 2.1 Relação de Sequenciamento Temporal (FOLLOWS)
  // chord:i -> FOLLOWS -> chord:i+1 (i points to i+1 in temporal progression)
  for (let i = 0; i < chords.length - 1; i++) {
    addEdge(`chord:${i}`, `chord:${i + 1}`, 'FOLLOWS');
  }
  // phrase:i -> FOLLOWS -> phrase:i+1
  for (let i = 0; i < phrases.length - 1; i++) {
    addEdge(`phrase:${i}`, `phrase:${i + 1}`, 'FOLLOWS');
  }

  // 2.2 Relação de Hierarquia de Continuação (CONTAINS)
  // region -> CONTAINS -> phrase
  regions.forEach((reg, regIdx) => {
    phrases.forEach((phrase) => {
      // Se a frase está contida no intervalo da região harmônica
      if (phrase.startIndex >= reg.startIndex && phrase.endIndex <= reg.endIndex) {
        addEdge(`region:${regIdx}`, `phrase:${phrase.index}`, 'CONTAINS');
      }
    });
  });

  // phrase -> CONTAINS -> chord
  phrases.forEach((phrase) => {
    for (let cIdx = phrase.startIndex; cIdx <= phrase.endIndex; cIdx++) {
      if (cIdx < chords.length) {
        addEdge(`phrase:${phrase.index}`, `chord:${cIdx}`, 'CONTAINS');
      }
    }
  });

  // 2.3 Relação de Pertença a Grupo Formal (PART_OF)
  // phrase -> PART_OF -> phrase_group
  phraseGroups.forEach((g) => {
    g.phraseIndices.forEach((pIdx) => {
      addEdge(`phrase:${pIdx}`, `phrase_group:${g.index}`, 'PART_OF');
    });
  });

  // 2.4 Relação de Finalização Sintática (ENDS_WITH)
  // phrase -> ENDS_WITH -> cadence
  phrases.forEach((phrase) => {
    if (phrase.terminatingCadence) {
      const pCad = phrase.terminatingCadence;
      const matchIdx = cadences.findIndex((cad) => 
        cad.type === pCad.type && 
        cad.startIndex === pCad.startIndex && 
        cad.endIndex === pCad.endIndex
      );
      if (matchIdx !== -1) {
        addEdge(`phrase:${phrase.index}`, `cadence:${matchIdx}`, 'ENDS_WITH');
      }
    }
  });

  // 2.5 Relação de Destino de Resolução Cadencial (RESOLVES_TO)
  // cadence -> RESOLVES_TO -> chord
  cadences.forEach((cad, cadIdx) => {
    if (cad.resolution.targetChordIndex !== undefined && cad.resolution.targetChordIndex < chords.length) {
      addEdge(`cadence:${cadIdx}`, `chord:${cad.resolution.targetChordIndex}`, 'RESOLVES_TO');
    }
  });

  // 2.6 Relações Formais de Pareamento de Frases (ANSWERS)
  // phrase:0 (Antecedente) -> ANSWERS -> phrase:1 (Consequente)
  phraseGroups.forEach((g) => {
    if (g.type === 'PERIOD' && g.phraseIndices.length >= 2) {
      const p1Idx = g.phraseIndices[0];
      const p2Idx = g.phraseIndices[1];
      const phrase1 = phrases.find(p => p.index === p1Idx);
      const phrase2 = phrases.find(p => p.index === p2Idx);
      if (phrase1?.formalRole === 'ANTECEDENT' && phrase2?.formalRole === 'CONSEQUENT') {
        addEdge(`phrase:${p1Idx}`, `phrase:${p2Idx}`, 'ANSWERS', { type: g.name });
      }
    }
  });

  // 2.7 Transição entre Regiões (MODULATES_TO)
  // region:i -> MODULATES_TO -> region:i+1
  for (let i = 0; i < regions.length - 1; i++) {
    addEdge(`region:${i}`, `region:${i + 1}`, 'MODULATES_TO');
  }

  // 2.8 Conectividade Harmônica Direta (Acorde para Acorde)
  // - PREPARES: dominante secundária ou aproximação preparando o alvo correspondente
  chords.forEach((c) => {
    if (c.secondary) {
      const dist = c.secondary.contextualAnalysis?.resolutionDistance ?? 
        (c.resolutionEvidence?.targetChordIndex !== undefined ? c.resolutionEvidence.targetChordIndex - c.index : 1);
      const targetIdx = c.index + dist;
      if (targetIdx < chords.length) {
        addEdge(`chord:${c.index}`, `chord:${targetIdx}`, 'PREPARES', {
          type: c.secondary.contextualFunction,
          targetDegree: c.secondary.secondaryTarget
        });
      }
    }
  });

  // - RESOLVES: dominante primário resolvendo na tônica esperada diatônica
  cadences.forEach((cad) => {
    if ((cad.type === 'AUTHENTIC' || cad.type === 'PLAGAL') && cad.chordIndexes.length >= 2) {
      const domIdx = cad.chordIndexes[cad.chordIndexes.length - 2];
      const resIdx = cad.chordIndexes[cad.chordIndexes.length - 1];
      if (domIdx < chords.length && resIdx < chords.length) {
        addEdge(`chord:${domIdx}`, `chord:${resIdx}`, 'RESOLVES', {
          deceptive: cad.resolution.status === 'DECEPTIVE',
          plagal: cad.type === 'PLAGAL',
          strength: cad.strength
        });
      }
    }
  });

  return { nodes, edges };
}
