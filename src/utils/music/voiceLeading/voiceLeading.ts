import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { getAbsolutePitch } from "../core/midi";
import { parseChord } from "../theory/chordParser";
import { generateVoicings } from "../generation/voicingGenerator";
import type { VoicingShape } from "../models/VoicingShape";
import type { AnalyzedVoicing } from "../models/AnalyzedVoicing";
import { buildAnalyzedVoicing } from "../analysis/voicingAnalyzer";
import { SCORING_WEIGHTS } from "../constants/scoringWeights";
import type { ResolvedProgression } from "../models/ResolvedProgression";
import type { VoiceLeadingTransition } from "../models/VoiceLeadingTransition";

// Importar as Regras Modulares
import { ParallelFifthsRule } from "./rules/ParallelFifthsRule";
import { ParallelOctavesRule } from "./rules/ParallelOctavesRule";
import { ContraryMotionRule } from "./rules/ContraryMotionRule";
import { FunctionalResolutionRule } from "./rules/FunctionalResolutionRule";

// Instâncias das Regras Modulares
const parallelFifthsRule = new ParallelFifthsRule();
const parallelOctavesRule = new ParallelOctavesRule();
const contraryMotionRule = new ContraryMotionRule();
const functionalResolutionRule = new FunctionalResolutionRule();

export interface VoiceLeadingPath {
  stringIndex: number;
  fromNote: string;
  toNote: string;
  fromPitch: number;
  toPitch: number;
  semitoneDiff: number;
  direction: "up" | "down" | "stay" | "muted" | "unmuted";
}

export interface VoiceLeadingResult {
  voicingB: AnalyzedVoicing;
  totalCost: number;
  paths: VoiceLeadingPath[];
}

export interface FunctionalResolutionReport {
  seventhToThird: boolean;
  thirdToRoot: boolean;
  tritonePairResolved: boolean;
  functionalBonus: number;
}

export function detectFunctionalResolutions(
  voicingA: AnalyzedVoicing,
  voicingB: AnalyzedVoicing
): FunctionalResolutionReport {
  let seventhToThird = false;
  let thirdToRoot = false;
  let functionalBonus = 0;

  const voicesA = [...voicingA.roles.voices].sort((a, b) => a.pitch - b.pitch);
  const voicesB = [...voicingB.roles.voices].sort((a, b) => a.pitch - b.pitch);
  const numVoices = Math.min(voicesA.length, voicesB.length);

  const resolvedSeventhsIdx: number[] = [];
  const resolvedThirdsIdx: number[] = [];

  for (let vIdx = 0; vIdx < numVoices; vIdx++) {
    const voiceA = voicesA[vIdx];
    const voiceB = voicesB[vIdx];
    const infoA = voiceA.info;
    const infoB = voiceB.info;
    if (!infoA || !infoB) continue;

    const diff = voiceB.pitch - voiceA.pitch;

    if (infoA.role === "seventh" && infoB.role === "third" && (diff === -1 || diff === -2)) {
      seventhToThird = true;
      functionalBonus += SCORING_WEIGHTS.viterbiSeventhToThirdResolutionBonus;
      resolvedSeventhsIdx.push(vIdx);
      continue;
    }

    if (infoA.role === "third" && (infoB.role === "root" || infoB.role === "seventh") && (diff === 1 || diff === 2)) {
      thirdToRoot = true;
      functionalBonus += SCORING_WEIGHTS.viterbiThirdToRootResolutionBonus;
      resolvedThirdsIdx.push(vIdx);
      continue;
    }

    if (infoA.role === "tension" && (infoB.role === "root" || infoB.role === "third" || infoB.role === "fifth") && (Math.abs(diff) === 1 || Math.abs(diff) === 2)) {
      functionalBonus += SCORING_WEIGHTS.viterbiTensionResolutionBonus;
    }
  }

  let tritonePairResolved = false;
  for (const sIdx of resolvedSeventhsIdx) {
    for (const tIdx of resolvedThirdsIdx) {
      const pcA1 = voicesA[sIdx].pitchClass;
      const pcA2 = voicesA[tIdx].pitchClass;
      const pcDiff = Math.abs(pcA1 - pcA2) % 12;
      if (pcDiff === 6) {
        tritonePairResolved = true;
        functionalBonus += SCORING_WEIGHTS.viterbiTritoneResolutionComboBonus;
        break;
      }
    }
    if (tritonePairResolved) break;
  }

  functionalBonus = Math.max(functionalBonus, SCORING_WEIGHTS.viterbiMaxFunctionalBonus);

  return {
    seventhToThird,
    thirdToRoot,
    tritonePairResolved,
    functionalBonus
  };
}

/**
 * Calcula o Custo Harmônico e Físico de transição consumindo as Regras Modulares.
 */
export function calculateVoiceLeadingCost(
  voicingA: AnalyzedVoicing,
  voicingB: AnalyzedVoicing,
  tuning: string[]
): { totalCost: number; paths: VoiceLeadingPath[] } {
  let cost = 0;
  const paths: VoiceLeadingPath[] = [];

  const fretsA = voicingA.shape.frets;
  const fretsB = voicingB.shape.frets;

  // 1. Calcular deslocamentos individuais nas cordas
  for (let stringIdx = 0; stringIdx < tuning.length; stringIdx++) {
    const baseNote = tuning[stringIdx];
    const fretA = fretsA[stringIdx];
    const fretB = fretsB[stringIdx];

    const pitchA = getAbsolutePitch(fretA, baseNote);
    const pitchB = getAbsolutePitch(fretB, baseNote);

    const noteAName = fretA !== null ? getNoteAt(baseNote, fretA) : "x";
    const noteBName = fretB !== null ? getNoteAt(baseNote, fretB) : "x";

    if (pitchA !== null && pitchB !== null) {
      const diff = pitchB - pitchA;
      const absDiff = Math.abs(diff);
      let cellCost: number;

      let direction: "up" | "down" | "stay" = "stay";
      if (diff > 0) {
        direction = "up";
      } else if (diff < 0) {
        direction = "down";
      }

      if (absDiff === 0) {
        cellCost = 0;
      } else if (absDiff === 1) {
        cellCost = 1;
      } else if (absDiff === 2) {
        cellCost = 2;
      } else if (absDiff > 7) {
        cellCost = 10;
      } else {
        cellCost = absDiff;
      }

      cost += cellCost;
      
      paths.push({
        stringIndex: stringIdx,
        fromNote: noteAName,
        toNote: noteBName,
        fromPitch: pitchA,
        toPitch: pitchB,
        semitoneDiff: diff,
        direction
      });
    } else if (pitchA !== null && pitchB === null) {
      cost += 5;
      paths.push({
        stringIndex: stringIdx,
        fromNote: noteAName,
        toNote: "x",
        fromPitch: pitchA,
        toPitch: 0,
        semitoneDiff: 0,
        direction: "muted"
      });
    } else if (pitchA === null && pitchB !== null) {
      cost += 5;
      paths.push({
        stringIndex: stringIdx,
        fromNote: "x",
        toNote: noteBName,
        fromPitch: 0,
        toPitch: pitchB,
        semitoneDiff: 0,
        direction: "unmuted"
      });
    }
  }

  // 2. Regras Estritas de Contraponto (Modularizadas)
  const isParallelFifth = parallelFifthsRule.evaluate(voicingA, voicingB, tuning) > 0;
  const isParallelOctave = parallelOctavesRule.evaluate(voicingA, voicingB, tuning) > 0;
  if (isParallelFifth || isParallelOctave) {
    cost += SCORING_WEIGHTS.viterbiParallelPerfectPenalty; // +20
  }

  // Movimento contrário
  const contraryCount = contraryMotionRule.evaluate(voicingA, voicingB, tuning);
  if (contraryCount > 0) {
    cost = Math.max(0, cost + contraryCount * contraryMotionRule.weight); // -3 por movimento contrário
  }

  // 3. Condução Semântica/Funcional das Vozes
  const functionalResolutionBonus = functionalResolutionRule.evaluate(voicingA, voicingB, tuning);
  cost += functionalResolutionBonus;

  // Penalidade de mudança de posição física (Shift de traste)
  const fretsANonNull = fretsA.filter(f => f !== null && f > 0) as number[];
  const fretsBNonNull = fretsB.filter(f => f !== null && f > 0) as number[];

  if (fretsANonNull.length > 0 && fretsBNonNull.length > 0) {
    const minFretA = Math.min(...fretsANonNull);
    const minFretB = Math.min(...fretsBNonNull);
    const positionShift = Math.abs(minFretB - minFretA);
    cost += positionShift * 2;
  }

  cost = Math.max(0, cost);

  return {
    totalCost: cost,
    paths
  };
}

export function findBestVoiceLeading(
  voicingA: AnalyzedVoicing,
  candidatesB: AnalyzedVoicing[],
  tuning: string[]
): VoiceLeadingResult[] {
  const results: VoiceLeadingResult[] = candidatesB.map(voicingB => {
    const { totalCost, paths } = calculateVoiceLeadingCost(voicingA, voicingB, tuning);
    return {
      voicingB,
      totalCost,
      paths
    };
  });

  return results.sort((a, b) => a.totalCost - b.totalCost).slice(0, 5);
}

const QUALITY_WEIGHT = 40;

function calculateBassCanonicalPenalty(voicing: AnalyzedVoicing, isSlash: boolean): number {
  if (isSlash) return 0;
  
  const inv = voicing.classification.inversionType;
  if (inv === "root") return 0;
  if (inv === "first") return 15;
  if (inv === "second") return 25;
  if (inv === "third") return 40;
  return 50;
}

function buildTransitionsForPath(
  path: AnalyzedVoicing[],
  tuning: string[]
): VoiceLeadingTransition[] {
  const transitions: VoiceLeadingTransition[] = [];
  for (let i = 1; i < path.length; i++) {
    const vA = path[i - 1];
    const vB = path[i];
    
    let fretDist = 0;
    let commonCount = 0;
    for (let sIdx = 0; sIdx < tuning.length; sIdx++) {
      const fA = vA.shape.frets[sIdx];
      const fB = vB.shape.frets[sIdx];
      if (fA !== null && fB !== null) {
        fretDist += Math.abs(fB - fA);
        const pitchA = getAbsolutePitch(fA, tuning[sIdx]);
        const pitchB = getAbsolutePitch(fB, tuning[sIdx]);
        if (pitchA !== null && pitchB !== null && pitchA === pitchB) {
          commonCount++;
        }
      }
    }

    const { totalCost } = calculateVoiceLeadingCost(vA, vB, tuning);

    transitions.push({
      fromVoicing: vA.shape.frets.map(f => f === null ? -1 : f),
      toVoicing: vB.shape.frets.map(f => f === null ? -1 : f),
      fretDistance: fretDist,
      commonVoicesCount: commonCount,
      voiceLeadingCost: totalCost,
      totalTransitionCost: totalCost
    });
  }
  return transitions;
}

/**
 * Resolvedor Viterbi avançado que suporta extração de caminhos candidatos alternativos
 * de forma lazy e desacoplada.
 */
export function findAutoVoicingsAdvanced(
  chords: string[],
  tuning: string[],
  includeAlternatives: boolean = false,
  candidatesOverride?: AnalyzedVoicing[][],
  maxCandidatesLimit: number = 20
): {
  solution: ResolvedProgression;
  alternatives?: ResolvedProgression[];
} {
  if (chords.length === 0) {
    return {
      solution: { progression: [], bestPath: [], totalCost: 0, transitions: [] }
    };
  }

  const chordCandidatesList: AnalyzedVoicing[][] = candidatesOverride || chords.map(chordName => {
    const chordInfo = parseChord(chordName);
    if (chordInfo.empty) return [];
    const root = chordInfo.root || "C";
    const targetPCs = chordInfo.notes.map(n => getPitchClass(n));
    const bassPC = chordInfo.bass ? getPitchClass(chordInfo.bass) : null;
    const generatedShapes = generateVoicings(chordName, root, targetPCs, tuning, chordInfo.quality, bassPC);
    return generatedShapes.slice(0, maxCandidatesLimit).map(shape => buildAnalyzedVoicing(shape, tuning));
  });

  if (chordCandidatesList.some(list => list.length === 0)) {
    const bestPath = chords.map((_, idx) => {
      const list = chordCandidatesList[idx];
      return list && list.length > 0 ? list[0] : null;
    });
    return {
      solution: {
        progression: chords,
        bestPath,
        totalCost: 9999,
        transitions: []
      }
    };
  }

  const N = chords.length;
  const dp: number[][] = [];
  const backtrace: number[][] = [];

  const firstChordInfo = parseChord(chords[0]);
  const firstIsSlash = !!firstChordInfo.bass;
  const maxQuality0 = Math.max(...chordCandidatesList[0].map(c => c.shape.qualityScore || 100), 100);

  dp[0] = chordCandidatesList[0].map(c => {
    const targetQuality = c.shape.qualityScore || 100;
    const normalizedQuality = targetQuality / maxQuality0;
    const qualityPenalty = (1 - normalizedQuality) * QUALITY_WEIGHT;
    const bassPenalty = calculateBassCanonicalPenalty(c, firstIsSlash);
    return qualityPenalty + bassPenalty;
  });
  backtrace[0] = Array(chordCandidatesList[0].length).fill(-1);

  for (let i = 1; i < N; i++) {
    const prevList = chordCandidatesList[i - 1];
    const currList = chordCandidatesList[i];
    dp[i] = Array(currList.length).fill(Infinity);
    backtrace[i] = Array(currList.length).fill(-1);

    const currChordInfo = parseChord(chords[i]);
    const currIsSlash = !!currChordInfo.bass;
    const maxQualityI = Math.max(...currList.map(c => c.shape.qualityScore || 100), 100);

    for (let currIdx = 0; currIdx < currList.length; currIdx++) {
      const currVoicing = currList[currIdx];
      let bestPrevIdx = -1;
      let minAccumulatedCost = Infinity;

      for (let prevIdx = 0; prevIdx < prevList.length; prevIdx++) {
        const prevVoicing = prevList[prevIdx];
        const cost = calculateVoiceLeadingCost(prevVoicing, currVoicing, tuning).totalCost;
        const targetQuality = currVoicing.shape.qualityScore || 100;
        const normalizedQuality = targetQuality / maxQualityI;
        const qualityPenalty = (1 - normalizedQuality) * QUALITY_WEIGHT;
        const bassPenalty = calculateBassCanonicalPenalty(currVoicing, currIsSlash);
        const accumulatedCost = dp[i - 1][prevIdx] + cost + qualityPenalty + bassPenalty;

        if (accumulatedCost < minAccumulatedCost) {
          minAccumulatedCost = accumulatedCost;
          bestPrevIdx = prevIdx;
        }
      }

      dp[i][currIdx] = minAccumulatedCost;
      backtrace[i][currIdx] = bestPrevIdx;
    }
  }

  const lastDp = dp[N - 1];
  const sortedLastIndices = lastDp
    .map((cost, idx) => ({ cost, idx }))
    .sort((a, b) => a.cost - b.cost);

  const reconstructPath = (lastIdx: number): (AnalyzedVoicing | null)[] => {
    const pathIndices: number[] = [];
    let currIdx = lastIdx;
    for (let i = N - 1; i >= 0; i--) {
      pathIndices.push(currIdx);
      currIdx = backtrace[i][currIdx];
    }
    pathIndices.reverse();
    return pathIndices.map((candIdx, chordIdx) => chordCandidatesList[chordIdx][candIdx]);
  };

  const bestLastIdx = sortedLastIndices[0].idx;
  const bestPath = reconstructPath(bestLastIdx);
  const bestTransitions = buildTransitionsForPath(bestPath.filter((v): v is AnalyzedVoicing => v !== null), tuning);

  const solution: ResolvedProgression = {
    progression: chords,
    bestPath,
    totalCost: sortedLastIndices[0].cost,
    transitions: bestTransitions
  };

  const result: {
    solution: ResolvedProgression;
    alternatives?: ResolvedProgression[];
  } = { solution };

  if (includeAlternatives && sortedLastIndices.length > 1) {
    const alternatives: ResolvedProgression[] = [];
    const limit = Math.min(sortedLastIndices.length, 4);
    for (let k = 1; k < limit; k++) {
      const altIdx = sortedLastIndices[k].idx;
      const altPath = reconstructPath(altIdx);
      const altTransitions = buildTransitionsForPath(altPath.filter((v): v is AnalyzedVoicing => v !== null), tuning);
      alternatives.push({
        progression: chords,
        bestPath: altPath,
        totalCost: sortedLastIndices[k].cost,
        transitions: altTransitions
      });
    }
    result.alternatives = alternatives;
  }

  return result;
}

/**
 * Mantém retrocompatibilidade estrita com a assinatura original.
 */
export function findAutoVoicings(chords: string[], tuning: string[]): (VoicingShape | null)[] {
  const result = findAutoVoicingsAdvanced(chords, tuning, false);
  return result.solution.bestPath.map(av => av ? av.shape : null);
}
