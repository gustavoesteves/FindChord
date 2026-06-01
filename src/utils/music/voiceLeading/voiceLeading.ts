import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { getAbsolutePitch } from "../core/midi";
import { parseChord } from "../theory/chordParser";
import { generateVoicings } from "../generation/voicingGenerator";
import type { VoicingShape } from "../models/VoicingShape";

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
  voicingB: VoicingShape;
  totalCost: number;
  paths: VoiceLeadingPath[];
}

/**
 * Calcula o Custo Harmônico e Físico de transição entre dois voicings.
 */
export function calculateVoiceLeadingCost(
  fretsA: (number | null)[],
  fretsB: (number | null)[],
  tuning: string[]
): { totalCost: number; paths: VoiceLeadingPath[] } {
  let cost = 0;
  const paths: VoiceLeadingPath[] = [];

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
    } else {
      paths.push({
        stringIndex: stringIdx,
        fromNote: "x",
        toNote: "x",
        fromPitch: 0,
        toPitch: 0,
        semitoneDiff: 0,
        direction: "muted"
      });
    }
  }

  // 2. Análise de Contraposição Harmônica (Movimento Contrário vs Paralelo)
  if (activeMovements.length >= 2) {
    let contraryMotionCount = 0;
    let parallelFifthOctaveError = false;

    for (let i = 0; i < activeMovements.length; i++) {
      for (let j = i + 1; j < activeMovements.length; j++) {
        const m1 = activeMovements[i];
        const m2 = activeMovements[j];

        if ((m1.direction > 0 && m2.direction < 0) || (m1.direction < 0 && m2.direction > 0)) {
          contraryMotionCount++;
        }

        if (m1.direction === m2.direction && m1.direction !== 0 && m1.intervalStart !== null && m2.intervalStart !== null) {
          const pitchA1 = m1.intervalStart;
          const pitchA2 = m2.intervalStart;
          const pitchB1 = pitchA1 + m1.direction;
          const pitchB2 = pitchA2 + m2.direction;

          const intervalA = Math.abs(pitchA1 - pitchA2) % 12;
          const intervalB = Math.abs(pitchB1 - pitchB2) % 12;

          if ((intervalA === 7 && intervalB === 7) || (intervalA === 0 && intervalB === 0)) {
            parallelFifthOctaveError = true;
          }
        }
      }
    }

    if (contraryMotionCount > 0) {
      cost = Math.max(0, cost - 3 * contraryMotionCount);
    }

    if (parallelFifthOctaveError) {
      cost += 15;
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

  return {
    totalCost: cost,
    paths
  };
}

/**
 * Dado um voicing A de origem, encontra e ordena os melhores voicings do acorde B pelo menor custo de voice leading.
 */
export function findBestVoiceLeading(
  voicingA: (number | null)[],
  candidatesB: VoicingShape[],
  tuning: string[]
): VoiceLeadingResult[] {
  const results: VoiceLeadingResult[] = candidatesB.map(voicingB => {
    const { totalCost, paths } = calculateVoiceLeadingCost(voicingA, voicingB.frets, tuning);
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
 */
function calculateBassCanonicalPenalty(
  voicing: VoicingShape,
  rootPC: number,
  isSlash: boolean,
  tuning: string[]
): number {
  if (isSlash) return 0;

  let minPitch = Infinity;
  let physicalBassPC = -1;
  for (let idx = 0; idx < 6; idx++) {
    const fret = voicing.frets[idx];
    if (fret !== null) {
      const pitch = getAbsolutePitch(fret, tuning[idx]);
      if (pitch !== null && pitch < minPitch) {
        minPitch = pitch;
        const noteName = getNoteAt(tuning[idx], fret);
        physicalBassPC = getPitchClass(noteName);
      }
    }
  }

  if (physicalBassPC === -1) return 50;

  const dist = (physicalBassPC - rootPC + 12) % 12;
  if (dist === 0) return 0;
  if (dist === 3 || dist === 4) return 15;
  if (dist === 7 || dist === 8 || dist === 6) return 25;
  if (dist === 10 || dist === 11 || dist === 9) return 40;
  return 50;
}

/**
 * DP (Viterbi-like) solver que encontra a progressão de voicings com menor custo acumulado de movimento no braço.
 */
export function findAutoVoicings(chords: string[], tuning: string[]): (VoicingShape | null)[] {
  if (chords.length === 0) return [];
  
  const chordCandidatesList: VoicingShape[][] = chords.map(chordName => {
    const chordInfo = parseChord(chordName);
    if (chordInfo.empty) return [];
    const root = chordInfo.root || "C";
    const targetPCs = chordInfo.notes.map(n => getPitchClass(n));
    return generateVoicings(chordName, root, targetPCs, tuning, chordInfo.quality);
  });

  if (chordCandidatesList.some(list => list.length === 0)) {
    return chords.map((_, idx) => {
      const list = chordCandidatesList[idx];
      return list && list.length > 0 ? list[0] : null;
    });
  }

  const N = chords.length;
  const dp: number[][] = [];
  const backtrace: number[][] = [];

  const firstChordInfo = parseChord(chords[0]);
  const firstRoot = firstChordInfo.root || "C";
  const firstRootPC = getPitchClass(firstRoot);
  const firstIsSlash = !!firstChordInfo.bass;

  const maxQuality0 = Math.max(...chordCandidatesList[0].map(c => c.qualityScore || 100), 100);

  dp[0] = chordCandidatesList[0].map(c => {
    const targetQuality = c.qualityScore || 100;
    const normalizedQuality = targetQuality / maxQuality0;
    const qualityPenalty = (1 - normalizedQuality) * QUALITY_WEIGHT;

    const bassPenalty = calculateBassCanonicalPenalty(c, firstRootPC, firstIsSlash, tuning);

    return qualityPenalty + bassPenalty;
  });
  backtrace[0] = Array(chordCandidatesList[0].length).fill(-1);

  for (let i = 1; i < N; i++) {
    const prevList = chordCandidatesList[i - 1];
    const currList = chordCandidatesList[i];
    dp[i] = Array(currList.length).fill(Infinity);
    backtrace[i] = Array(currList.length).fill(-1);

    const currChordInfo = parseChord(chords[i]);
    const currRoot = currChordInfo.root || "C";
    const currRootPC = getPitchClass(currRoot);
    const currIsSlash = !!currChordInfo.bass;

    const maxQualityI = Math.max(...currList.map(c => c.qualityScore || 100), 100);

    for (let currIdx = 0; currIdx < currList.length; currIdx++) {
      const currVoicing = currList[currIdx];
      let bestPrevIdx = -1;
      let minAccumulatedCost = Infinity;

      for (let prevIdx = 0; prevIdx < prevList.length; prevIdx++) {
        const prevVoicing = prevList[prevIdx];
        
        const cost = calculateVoiceLeadingCost(prevVoicing.frets, currVoicing.frets, tuning).totalCost;
        
        const targetQuality = currVoicing.qualityScore || 100;
        const normalizedQuality = targetQuality / maxQualityI;
        const qualityPenalty = (1 - normalizedQuality) * QUALITY_WEIGHT;
        
        const bassPenalty = calculateBassCanonicalPenalty(currVoicing, currRootPC, currIsSlash, tuning);
        
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
    return chordCandidatesList[chordIdx][candIdx];
  });
}
