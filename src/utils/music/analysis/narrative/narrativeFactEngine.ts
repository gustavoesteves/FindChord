import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type {
  HarmonicNarrativeFacts,
  NarrativeFact,
  SecondaryDominantPreparationFact,
  PrimaryDominantResolutionFact,
  ModalBorrowingColorationFact,
  ChromaticApproachPassingFact,
  PhraseOpeningProlongationFact,
  PhrasePreCadentialPreparationFact
} from '../models/HarmonicNarrative';
import { HarmonicGraphEngine } from './knowledgeGraphEngine';
import { buildHarmonicKnowledgeGraph } from './knowledgeGraphBuilder';

/**
 * Analisa o Grafo de Conhecimento Harmônico e extrai fatos estruturados (F9A).
 * 
 * @param analysis - Resultado da análise funcional
 * @returns HarmonicNarrativeFacts com fatos globais e locais
 */
export function extractNarrativeFacts(analysis: FunctionalAnalysis): HarmonicNarrativeFacts {
  const chordFacts: Record<number, NarrativeFact[]> = {};

  const graph = analysis.knowledgeGraph || buildHarmonicKnowledgeGraph(analysis);
  const engine = new HarmonicGraphEngine(graph);

  const chords = engine.getNodesByType('CHORD');

  // ──────────────────────────────────────────────────────────────

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
    chordFacts
  };
}
