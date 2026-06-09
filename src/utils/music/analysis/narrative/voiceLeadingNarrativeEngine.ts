import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type {
  VoiceLeadingLayerData,
  VoiceLeadingEvent,
  VoiceMovement,
  VoiceLeadingDirection
} from '../models/VoiceLeadingLayer';
import type { AnalyzedVoicing } from '../../models/AnalyzedVoicing';
import { getAbsolutePitch } from '../../core/midi';
import { ParallelFifthsRule } from '../../voiceLeading/rules/ParallelFifthsRule';
import { ParallelOctavesRule } from '../../voiceLeading/rules/ParallelOctavesRule';
import {
  findAutoVoicingsAdvanced,
  detectFunctionalResolutions,
  calculateVoiceLeadingCost
} from '../../voiceLeading/voiceLeading';

const parallelFifthsRule = new ParallelFifthsRule();
const parallelOctavesRule = new ParallelOctavesRule();

/**
 * Motor de Análise de Condução de Vozes (F13).
 * Resolve o encadeamento de vozes contrapontístico ideal usando Viterbi e computa as métricas
 * físicas da transição (paralelismos, notas comuns, vozes retidas, custos e suavidade).
 */
export function resolveVoiceLeadingNarrative(
  analysis: FunctionalAnalysis,
  customTuning?: string[]
): VoiceLeadingLayerData {
  const tuning = customTuning || ["E4", "B3", "G3", "D3", "A2", "E2"];

  if (!analysis || !analysis.chords || analysis.chords.length <= 1) {
    return {
      events: [],
      totalFretDistance: 0,
      totalVoiceLeadingCost: 0,
      totalParallelPerfectViolations: 0,
      averageSmoothness: 1.0,
      voiceLeadingSignature: '',
      tuningUsed: tuning
    };
  }

  const chordSymbols = analysis.chords.map(c => c.chordSymbol);
  
  // Resolve a progressão usando o motor Viterbi avançado
  const viterbiResult = findAutoVoicingsAdvanced(chordSymbols, tuning, false);
  const bestPath = viterbiResult.solution.bestPath;

  const events: VoiceLeadingEvent[] = [];
  let totalFretDistance = 0;
  let totalVoiceLeadingCost = 0;
  let totalParallelPerfectViolations = 0;
  let sumSmoothness = 0;

  const getPitchClasses = (v: AnalyzedVoicing): Set<number> => {
    const pcs = new Set<number>();
    v.roles.voices.forEach(voice => {
      if (voice.pitchClass !== undefined) {
        pcs.add(voice.pitchClass);
      }
    });
    return pcs;
  };

  const N = analysis.chords.length;

  for (let i = 1; i < N; i++) {
    const vA = bestPath[i - 1];
    const vB = bestPath[i];

    if (!vA || !vB) {
      // Evento Neutro normalizado para manter o invariante events.length === N - 1
      const neutralEvent: VoiceLeadingEvent = {
        transitionIndex: i - 1,
        fromChordIndex: i - 1,
        toChordIndex: i,
        aggregateFretDistance: 0,
        commonVoicesCount: 0,
        retainedVoicesCount: 0,
        voiceLeadingCost: 0,
        smoothnessScore: 0.0,
        parallelFifthsCount: 0,
        parallelOctavesCount: 0,
        resolutions: {
          seventhToThird: false,
          thirdToRoot: false,
          tritone: false
        },
        movements: [],
        resolutionEvidence: {}
      };
      events.push(neutralEvent);
      sumSmoothness += 0.0;
      continue;
    }

    // 1. Oitavas e Quintas Paralelas
    const parallelFifthsCount = parallelFifthsRule.evaluate(vA, vB, tuning);
    const parallelOctavesCount = parallelOctavesRule.evaluate(vA, vB, tuning);
    totalParallelPerfectViolations += (parallelFifthsCount + parallelOctavesCount);

    // 2. Resoluções Funcionais
    const resolutionsReport = detectFunctionalResolutions(vA, vB);
    const resolutions = {
      seventhToThird: resolutionsReport.seventhToThird,
      thirdToRoot: resolutionsReport.thirdToRoot,
      tritone: resolutionsReport.tritonePairResolved
    };

    // 3. Custos e Caminhos de Condução
    const { totalCost: voiceLeadingCost, paths } = calculateVoiceLeadingCost(vA, vB, tuning);
    totalVoiceLeadingCost += voiceLeadingCost;

    // 4. Distância de Traste Agregada
    let aggregateFretDistance = 0;
    for (let s = 0; s < tuning.length; s++) {
      const fA = vA.shape.frets[s];
      const fB = vB.shape.frets[s];
      if (fA !== null && fB !== null) {
        aggregateFretDistance += Math.abs(fB - fA);
      }
    }
    totalFretDistance += aggregateFretDistance;

    // 5. Notas Comuns (Pitch Class set intersection)
    const pcsA = getPitchClasses(vA);
    const pcsB = getPitchClasses(vB);
    let commonVoicesCount = 0;
    pcsA.forEach(pc => {
      if (pcsB.has(pc)) {
        commonVoicesCount++;
      }
    });

    // 6. Vozes Físicas Retidas (pitch idêntico na mesma corda física)
    let retainedVoicesCount = 0;
    for (let s = 0; s < tuning.length; s++) {
      const fA = vA.shape.frets[s];
      const fB = vB.shape.frets[s];
      if (fA !== null && fB !== null) {
        const pitchA = getAbsolutePitch(fA, tuning[s]);
        const pitchB = getAbsolutePitch(fB, tuning[s]);
        if (pitchA !== null && pitchB !== null && pitchA === pitchB) {
          retainedVoicesCount++;
        }
      }
    }

    // 7. Métrica de Suavidade Normalizada (smoothnessScore)
    const activeVoices = paths.filter(p => p.direction !== 'muted' && p.direction !== 'unmuted').length;
    const smoothnessScore = activeVoices > 0 
      ? Math.max(0, 1 - (voiceLeadingCost / (activeVoices * 12))) 
      : 1.0;
    sumSmoothness += smoothnessScore;

    // 8. Mapear movimentos individuais
    const movements: VoiceMovement[] = paths.map(p => {
      let direction: VoiceLeadingDirection = 'stay';
      if (p.direction === 'up' || p.direction === 'down' || p.direction === 'stay' || p.direction === 'muted' || p.direction === 'unmuted') {
        direction = p.direction as VoiceLeadingDirection;
      }
      return {
        stringIndex: p.stringIndex,
        fromNote: p.fromNote,
        toNote: p.toNote,
        fromPitch: p.fromPitch,
        toPitch: p.toPitch,
        semitoneDiff: p.semitoneDiff,
        direction
      };
    });

    events.push({
      transitionIndex: i - 1,
      fromChordIndex: i - 1,
      toChordIndex: i,
      aggregateFretDistance,
      commonVoicesCount,
      retainedVoicesCount,
      voiceLeadingCost,
      smoothnessScore,
      parallelFifthsCount,
      parallelOctavesCount,
      resolutions,
      movements,
      resolutionEvidence: {}
    });
  }

  const averageSmoothness = events.length > 0 ? sumSmoothness / events.length : 1.0;
  const voiceLeadingSignature = events.map(e => e.smoothnessScore.toFixed(2)).join('>');

  return {
    events,
    totalFretDistance,
    totalVoiceLeadingCost,
    totalParallelPerfectViolations,
    averageSmoothness,
    voiceLeadingSignature,
    tuningUsed: tuning
  };
}
