import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type {
  HarmonicNarrativeFacts,
  NarrativeFact,
  PeriodRelationFact,
  StandalonePhraseFact,
  SecondaryDominantPreparationFact,
  PrimaryDominantResolutionFact,
  ModalBorrowingColorationFact,
  ChromaticApproachPassingFact,
  RegionalModulationFact,
  PhraseOpeningProlongationFact,
  PhrasePreCadentialPreparationFact
} from '../models/HarmonicNarrative';
import { HarmonicGraphEngine } from './knowledgeGraphEngine';
import { buildHarmonicKnowledgeGraph } from './knowledgeGraphBuilder';
import { getKeyRelation } from '../../theory/tonalRelations';

/**
 * Analisa o Grafo de Conhecimento Harmônico e extrai fatos estruturados (F9A).
 * 
 * @param analysis - Resultado da análise funcional
 * @returns HarmonicNarrativeFacts com fatos globais e locais
 */
export function extractNarrativeFacts(analysis: FunctionalAnalysis): HarmonicNarrativeFacts {
  const overviewFacts: NarrativeFact[] = [];
  const chordFacts: Record<number, NarrativeFact[]> = {};

  const graph = analysis.knowledgeGraph || buildHarmonicKnowledgeGraph(analysis);
  const engine = new HarmonicGraphEngine(graph);

  const phraseGroups = engine.getNodesByType('PHRASE_GROUP');
  const phrases = engine.getNodesByType('PHRASE');
  const regions = engine.getNodesByType('REGION');
  const chords = engine.getNodesByType('CHORD');

  // ──────────────────────────────────────────────────────────────
  // 1. EXTRAÇÃO DE FATOS GERAIS (OVERVIEW)
  // ──────────────────────────────────────────────────────────────

  // 1.1 Relações de Período (F8)
  phraseGroups.forEach((pg) => {
    if (pg.properties.type === 'PERIOD') {
      const phraseIndices = pg.properties.phraseIndices as number[];
      if (phraseIndices && phraseIndices.length >= 2) {
        const antIdx = phraseIndices[0];
        const consIdx = phraseIndices[1];
        
        overviewFacts.push({
          type: 'PERIOD_RELATION',
          priority: 100,
          sourceEngine: 'F8',
          antecedentPhraseIndex: antIdx,
          consequentPhraseIndex: consIdx,
          periodName: pg.properties.name as string || 'Período',
          confidence: pg.properties.confidence as number || 1.0
        } as PeriodRelationFact);
      }
    }
  });

  // 1.2 Frases Independentes (F8)
  phrases.forEach((phraseNode) => {
    const phraseIdx = phraseNode.properties.index as number;
    const isPartOfPeriod = phraseGroups.some((pg) => {
      if (pg.properties.type === 'PERIOD') {
        const phraseIndices = pg.properties.phraseIndices as number[];
        return phraseIndices && phraseIndices.includes(phraseIdx);
      }
      return false;
    });

    if (!isPartOfPeriod) {
      const startIndex = phraseNode.properties.startIndex as number;
      const initialChord = analysis.chords[startIndex];
      let initialKey = '';
      if (initialChord && initialChord.state) {
        const modeLabel = initialChord.state.mode === 'IONIAN' ? 'Maior' : 'Menor';
        initialKey = `${initialChord.state.root} ${modeLabel}`;
      }

      overviewFacts.push({
        type: 'STANDALONE_PHRASE',
        priority: 50,
        sourceEngine: 'F8',
        phraseIndex: phraseIdx,
        initialKey
      } as StandalonePhraseFact);
    }
  });

  // 1.3 Modulações Regionais (Infra-1)
  regions.forEach((regNode) => {
    const regIdx = regNode.properties.index as number;
    const outgoing = engine.getOutgoingRelations(regNode.id);
    outgoing.forEach((edge) => {
      if (edge.relation === 'MODULATES_TO') {
        const targetNode = engine.getNodeById(edge.targetId);
        if (targetNode && targetNode.type === 'REGION') {
          const targetIdx = targetNode.properties.index as number;

          const fromRoot = regNode.properties.root as string;
          const fromMode = regNode.properties.mode as 'MAJOR' | 'MINOR';
          const toRoot = targetNode.properties.root as string;
          const toMode = targetNode.properties.mode as 'MAJOR' | 'MINOR';

          const fromKey = `${fromRoot} ${fromMode === 'MAJOR' ? 'Maior' : 'Menor'}`;
          const toKey = `${toRoot} ${toMode === 'MAJOR' ? 'Maior' : 'Menor'}`;

          const rel = getKeyRelation(
            { root: fromRoot, mode: fromMode },
            { root: toRoot, mode: toMode }
          );

          overviewFacts.push({
            type: 'REGIONAL_MODULATION',
            priority: 80,
            sourceEngine: 'GRAPH',
            sourceRegionIndex: regIdx,
            targetRegionIndex: targetIdx,
            fromKey,
            toKey,
            relation: rel
          } as RegionalModulationFact);
        }
      }
    });
  });

  // Sort overview facts: Priority descending, then index ascending
  overviewFacts.sort((a, b) => b.priority - a.priority);

  // ──────────────────────────────────────────────────────────────
  // 2. EXTRAÇÃO DE FATOS POR ACORDE (CHORD-LEVEL)
  // ──────────────────────────────────────────────────────────────
  chords.forEach((chordNode) => {
    const cIdx = chordNode.properties.index as number;
    const cFacts: NarrativeFact[] = [];
    const chordObj = analysis.chords[cIdx];
    if (!chordObj) return;

    const outgoing = engine.getOutgoingRelations(chordNode.id);

    // 2.1 Dominantes Secundárias e Substitutos de Trítono (F6/PREPARES)
    const preparesEdges = outgoing.filter(e => e.relation === 'PREPARES');
    preparesEdges.forEach((edge) => {
      const targetNode = engine.getNodeById(edge.targetId);
      if (targetNode && targetNode.type === 'CHORD') {
        const targetIdx = targetNode.properties.index as number;
        const secFunc = edge.properties?.type as string || 'SECONDARY_DOMINANT';
        const targetDegree = edge.properties?.targetDegree as string || '';

        cFacts.push({
          type: 'SECONDARY_DOMINANT_PREPARATION',
          priority: 100,
          sourceEngine: 'F6',
          sourceChordIndex: cIdx,
          targetChordIndex: targetIdx,
          secondaryFunction: secFunc,
          targetDegree
        } as SecondaryDominantPreparationFact);
      }
    });

    // 2.2 Resoluções Cadenciais Primárias (F7/RESOLVES)
    const resolvesEdges = outgoing.filter(e => e.relation === 'RESOLVES');
    resolvesEdges.forEach((edge) => {
      const targetNode = engine.getNodeById(edge.targetId);
      if (targetNode && targetNode.type === 'CHORD') {
        const targetIdx = targetNode.properties.index as number;
        const deceptive = !!edge.properties?.deceptive;
        const plagal = !!edge.properties?.plagal;
        const strength = edge.properties?.strength as string || 'STRONG';

        cFacts.push({
          type: 'PRIMARY_DOMINANT_RESOLUTION',
          priority: 90,
          sourceEngine: 'F7',
          sourceChordIndex: cIdx,
          targetChordIndex: targetIdx,
          deceptive,
          plagal,
          strength
        } as PrimaryDominantResolutionFact);
      }
    });

    // 2.3 Empréstimo Modal (F6/MODAL_BORROWING)
    if (chordObj.modal?.modalBorrowing) {
      cFacts.push({
        type: 'MODAL_BORROWING_COLORATION',
        priority: 85,
        sourceEngine: 'F6',
        chordIndex: cIdx,
        sourceMode: chordObj.modal.modalBorrowing.sourceMode,
        modeName: chordObj.modal.modalBorrowing.modeName
      } as ModalBorrowingColorationFact);
    }

    // 2.4 Aproximação Cromática / Diminutos de Passagem (F6/CHROMATIC_APPROACH)
    const hasChromatic = chordObj.modal?.contextualFunction === 'CHROMATIC_APPROACH' ||
                         chordObj.modal?.contextualFunction === 'PASSING_DIMINISHED' ||
                         chordObj.modal?.contextualFunction === 'COMMON_TONE_DIMINISHED' ||
                         chordObj.modal?.contextualFunction === 'NEIGHBOR_DIMINISHED' ||
                         (chordObj.semantic?.causes || []).includes('CHROMATIC_APPROACH') ||
                         (chordObj.semantic?.causes || []).includes('PASSING_DIMINISHED') ||
                         (chordObj.semantic?.causes || []).includes('COMMON_TONE_DIMINISHED') ||
                         (chordObj.semantic?.causes || []).includes('NEIGHBOR_DIMINISHED');
    if (hasChromatic) {
      cFacts.push({
        type: 'CHROMATIC_APPROACH_PASSING',
        priority: 70,
        sourceEngine: 'F6',
        chordIndex: cIdx
      } as ChromaticApproachPassingFact);
    }

    // 2.5 Prolongamento de Abertura (F6/PROLONGATION)
    const isProlongation = chordObj.semantic?.intent === 'PROLONGATION' ||
                           (chordObj.semantic?.supports || []).includes('PHRASE_OPENING');
    if (isProlongation) {
      let keyCenter = '';
      if (chordObj.state) {
        const modeLabel = chordObj.state.mode === 'IONIAN' ? 'Maior' : 'Menor';
        keyCenter = `${chordObj.state.root} ${modeLabel}`;
      }

      cFacts.push({
        type: 'PHRASE_OPENING_PROLONGATION',
        priority: 60,
        sourceEngine: 'F6',
        chordIndex: cIdx,
        keyCenter
      } as PhraseOpeningProlongationFact);
    }

    // 2.6 Preparação Pré-Cadencial / Subdominante (F6/PREPARATION)
    const isPreCadential = chordObj.semantic?.phraseRole === 'PRE_CADENTIAL' ||
                           (chordObj.semantic?.supports || []).includes('CADENCE_PREPARATION');
    if (isPreCadential) {
      cFacts.push({
        type: 'PHRASE_PRE_CADENTIAL_PREPARATION',
        priority: 65,
        sourceEngine: 'F6',
        chordIndex: cIdx
      } as PhrasePreCadentialPreparationFact);
    }

    if (cFacts.length > 0) {
      // Ordena por prioridade decrescente para que o fato principal fique no topo
      cFacts.sort((a, b) => b.priority - a.priority);
      chordFacts[cIdx] = cFacts;
    }
  });

  return {
    overviewFacts,
    chordFacts
  };
}
