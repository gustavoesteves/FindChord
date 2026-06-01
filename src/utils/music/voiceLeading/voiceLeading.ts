import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { getAbsolutePitch } from "../core/midi";
import { parseChord } from "../theory/chordParser";
import { generateVoicings } from "../generation/voicingGenerator";
import type { VoicingShape } from "../models/VoicingShape";
import type { AnalyzedVoicing } from "../models/AnalyzedVoicing";
import { buildAnalyzedVoicing } from "../analysis/voicingAnalyzer";
import { SCORING_WEIGHTS } from "../constants/scoringWeights";

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

  // Armazena as correspondências de índices para detecção de trítono
  const resolvedSeventhsIdx: number[] = [];
  const resolvedThirdsIdx: number[] = [];

  for (let vIdx = 0; vIdx < numVoices; vIdx++) {
    const voiceA = voicesA[vIdx];
    const voiceB = voicesB[vIdx];
    const infoA = voiceA.info;
    const infoB = voiceB.info;
    if (!infoA || !infoB) continue;

    const diff = voiceB.pitch - voiceA.pitch;

    // Regra 1 (Sétima para Terça)
    if (infoA.role === "seventh" && infoB.role === "third" && (diff === -1 || diff === -2)) {
      seventhToThird = true;
      functionalBonus += SCORING_WEIGHTS.viterbiSeventhToThirdResolutionBonus; // -15
      resolvedSeventhsIdx.push(vIdx);
      continue; // Regra de prioridade única por voz
    }

    // Regra 2 (Terça para Tônica/Sétima)
    if (infoA.role === "third" && (infoB.role === "root" || infoB.role === "seventh") && (diff === 1 || diff === 2)) {
      thirdToRoot = true;
      functionalBonus += SCORING_WEIGHTS.viterbiThirdToRootResolutionBonus; // -10
      resolvedThirdsIdx.push(vIdx);
      continue; // Regra de prioridade única por voz
    }

    // Regra 3 (Resolução de Tensões)
    if (infoA.role === "tension" && (infoB.role === "root" || infoB.role === "third" || infoB.role === "fifth") && (Math.abs(diff) === 1 || Math.abs(diff) === 2)) {
      functionalBonus += SCORING_WEIGHTS.viterbiTensionResolutionBonus; // -5
    }
  }

  // Detecção Fidedigna do Combo de Trítono Dominante resolvido
  let tritonePairResolved = false;
  for (const sIdx of resolvedSeventhsIdx) {
    for (const tIdx of resolvedThirdsIdx) {
      const pcA1 = voicesA[sIdx].pitchClass;
      const pcA2 = voicesA[tIdx].pitchClass;
      const pcDiff = Math.abs(pcA1 - pcA2) % 12;
      if (pcDiff === 6) {
        tritonePairResolved = true;
        functionalBonus += SCORING_WEIGHTS.viterbiTritoneResolutionComboBonus; // -15
        break;
      }
    }
    if (tritonePairResolved) break;
  }

  // Teto funcional limítrofe
  functionalBonus = Math.max(functionalBonus, SCORING_WEIGHTS.viterbiMaxFunctionalBonus); // Teto: -20

  return {
    seventhToThird,
    thirdToRoot,
    tritonePairResolved,
    functionalBonus
  };
}

/**
 * Calcula o Custo Harmônico e Físico de transição consumindo EXCLUSIVAMENTE AnalyzedVoicing.
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

  // Mapear direções para identificar movimento contrário ou paralelo
  const activeMovements: { stringIdx: number; direction: number; intervalStart: number | null }[] = [];

  // 1. Calcular deslocamentos individuais nas cordas
  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
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
        activeMovements.push({ stringIdx, direction: 1, intervalStart: pitchA });
      } else if (diff < 0) {
        direction = "down";
        activeMovements.push({ stringIdx, direction: -1, intervalStart: pitchA });
      } else {
        activeMovements.push({ stringIdx, direction: 0, intervalStart: pitchA });
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

  // 2. Regras Estritas de Contraponto e Condução por Vozes Adjacentes
  if (activeMovements.length >= 2) {
    let contraryMotionCount = 0;
    let parallelFifthOctaveError = false;

    for (let i = 0; i < activeMovements.length; i++) {
      for (let j = i + 1; j < activeMovements.length; j++) {
        const mv1 = activeMovements[i];
        const mv2 = activeMovements[j];

        if (mv1.direction !== 0 && mv2.direction !== 0) {
          if (mv1.direction * mv2.direction < 0) {
            contraryMotionCount++;
          } else if (mv1.direction === mv2.direction) {
            // Detecção de Quintas e Oitavas Paralelas Proibidas
            if (mv1.intervalStart !== null && mv2.intervalStart !== null) {
              const startInterval = Math.abs(mv2.intervalStart - mv1.intervalStart) % 12;
              const endInterval = Math.abs((mv2.intervalStart + mv2.direction) - (mv1.intervalStart + mv1.direction)) % 12;
              const isPerfectInterval = startInterval === 7 || startInterval === 0;
              if (isPerfectInterval && startInterval === endInterval) {
                parallelFifthOctaveError = true;
              }
            }
          }
        }
      }
    }

    if (contraryMotionCount > 0) {
      cost = Math.max(0, cost - 3 * contraryMotionCount);
    }

    if (parallelFifthOctaveError) {
      cost += SCORING_WEIGHTS.viterbiParallelPerfectPenalty; // +20
    }
  }

  const fretsANonNull = fretsA.filter(f => f !== null && f > 0) as number[];
  const fretsBNonNull = fretsB.filter(f => f !== null && f > 0) as number[];

  if (fretsANonNull.length > 0 && fretsBNonNull.length > 0) {
    const minFretA = Math.min(...fretsANonNull);
    const minFretB = Math.min(...fretsBNonNull);
    const positionShift = Math.abs(minFretB - minFretA);
    cost += positionShift * 2;
  }

  // 3. Condução Semântica/Funcional das Vozes (Fase SATB)
  const functionalReport = detectFunctionalResolutions(voicingA, voicingB);
  cost += functionalReport.functionalBonus;
  cost = Math.max(0, cost);

  return {
    totalCost: cost,
    paths
  };
}

/**
 * Encontra e ordena os melhores candidatos B consumindo EXCLUSIVAMENTE AnalyzedVoicing.
 */
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

/**
 * Calcula a penalidade de baixo quando a nota mais grave não é a tônica em acordes simples.
 * Consome semântica limpa do inversionType do DTO VoicingClassification.
 */
function calculateBassCanonicalPenalty(voicing: AnalyzedVoicing, isSlash: boolean): number {
  if (isSlash) return 0;
  
  const inv = voicing.classification.inversionType;
  if (inv === "root") return 0;
  if (inv === "first") return 15;
  if (inv === "second") return 25;
  if (inv === "third") return 40;
  return 50; // Exotic inversion
}

/**
 * Viterbi-like solver que encontra a progressão de aberturas de menor custo,
 * operando EXCLUSIVAMENTE sobre o DTO unificado AnalyzedVoicing.
 */
export function findAutoVoicings(chords: string[], tuning: string[]): (VoicingShape | null)[] {
  if (chords.length === 0) return [];
  
  // 1. Gerar e analisar candidatos (povoando DTO Agregado AnalyzedVoicing para cada acorde)
  const chordCandidatesList: AnalyzedVoicing[][] = chords.map(chordName => {
    const chordInfo = parseChord(chordName);
    if (chordInfo.empty) return [];
    const root = chordInfo.root || "C";
    const targetPCs = chordInfo.notes.map(n => getPitchClass(n));
    const bassPC = chordInfo.bass ? getPitchClass(chordInfo.bass) : null;
    const generatedShapes = generateVoicings(chordName, root, targetPCs, tuning, chordInfo.quality, bassPC);
    
    // Converter VoicingShape candidates em AnalyzedVoicing DTOs unificados
    return generatedShapes.map(shape => buildAnalyzedVoicing(shape, tuning));
  });

  if (chordCandidatesList.some(list => list.length === 0)) {
    return chords.map((_, idx) => {
      const list = chordCandidatesList[idx];
      return list && list.length > 0 ? list[0].shape : null;
    });
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
        
        // Transição operando puramente sobre DTOs
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
  let bestLastIdx = 0;
  let minFinalCost = Infinity;
  for (let j = 0; j < lastDp.length; j++) {
    if (lastDp[j] < minFinalCost) {
      minFinalCost = lastDp[j];
      bestLastIdx = j;
    }
  }

  const pathIndices: number[] = [];
  let currIdx = bestLastIdx;
  for (let i = N - 1; i >= 0; i--) {
    pathIndices.push(currIdx);
    currIdx = backtrace[i][currIdx];
  }
  pathIndices.reverse();

  return pathIndices.map((candIdx, chordIdx) => {
    return chordCandidatesList[chordIdx][candIdx].shape;
  });
}
