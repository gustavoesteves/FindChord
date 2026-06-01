import { noteToMidi } from "../core/midi";
import { SCORING_WEIGHTS } from "../constants/scoringWeights";

/**
 * Calcula o Voice Distribution Score (Métrica Acústica de Espaçamento Físico)
 */
export function calculateVoiceDistributionScore(notes: string[]): number {
  const activeNotes = notes.filter(n => n && n !== "x");
  if (activeNotes.length < 3) return 0;

  const pitches = activeNotes.map(n => noteToMidi(n)).sort((a, b) => a - b);
  const n = pitches.length;
  
  const intervals: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    intervals.push(pitches[i + 1] - pitches[i]);
  }

  let score = 0;

  // 1. Regra do Baixo Grave (Low Interval Limit - LIL)
  const bassPitch = pitches[0];
  const firstInterval = intervals[0];

  if (bassPitch < 48) { // Abaixo de Dó 3 (C3) - região grave e sub-grave
    if (firstInterval < 5) {
      // Intervalos de terça ou menor na região muito grave embolam o som
      score -= 15;
    } else if (firstInterval >= 7 && firstInterval <= 12) {
      // Quintas, oitavas ou décimas são ótimas para o baixo
      score += 12;
    }
  } else if (bassPitch < 60) { // Região média-grave (C3 a B3)
    if (firstInterval < 3) {
      // Segundas embolam na região média-grave
      score -= 8;
    } else if (firstInterval >= 4 && firstInterval <= 8) {
      score += 6;
    }
  }

  // 2. Extensão total (Total Span)
  const totalSpan = pitches[n - 1] - pitches[0];
  if (totalSpan >= 18) {
    // Open Voicing - mais de uma oitava e meia. Soa rico e espacial
    score += 10;
  } else if (totalSpan < 12) {
    // Muito comprimido - todas as notas apertadas em menos de uma oitava
    score -= 10;
  }

  // 3. Alinhamento com a Série Harmônica (gaps maiores embaixo, menores em cima)
  if (intervals.length >= 2) {
    if (intervals[0] > intervals[1]) {
      score += 8; // Conforma-se à ressonância natural da série harmônica
    } else if (intervals[0] < intervals[1] && intervals[0] <= 3) {
      score -= 5; // Evita que o acorde fique top-heavy e sem sustentação grave
    }
  }

  return score;
}

/**
 * Pontua a qualidade física, ergonômica e acústica de um dedilhado com base em propriedades abstratas.
 */
export function scoreVoicingQuality(frets: (number | null)[], notes: string[]): number {

  // 1. Identificar cordas tocadas
  let firstPlayed = -1;
  let lastPlayed = -1;
  let activeCount = 0;
  for (let idx = 0; idx < 6; idx++) {
    if (frets[idx] !== null) {
      if (firstPlayed === -1) firstPlayed = idx;
      lastPlayed = idx;
      activeCount++;
    }
  }

  // 2. DENSIDADE E GAPS: Penalidade por buracos internos (cordas mutadas no meio)
  let compactness = 0;
  if (firstPlayed !== -1 && lastPlayed !== -1) {
    let internalGaps = 0;
    for (let idx = firstPlayed + 1; idx < lastPlayed; idx++) {
      if (frets[idx] === null) {
        internalGaps++;
      }
    }
    if (internalGaps > 0) {
      if (activeCount <= 4 && internalGaps === 1) {
        // Um único gap interno em acordes de até 4 vozes é extremamente comum e fácil de abafar (ex: Drop 3, Shell voicings)
        compactness -= SCORING_WEIGHTS.fourVoiceSingleGapPenalty;
      } else {
        compactness -= internalGaps * SCORING_WEIGHTS.internalGapPenalty;
      }
    }
  }

  // Bônus para blocos compactos e completos
  let hasGaps = false;
  if (firstPlayed !== -1 && lastPlayed !== -1) {
    for (let idx = firstPlayed + 1; idx < lastPlayed; idx++) {
      if (frets[idx] === null) hasGaps = true;
    }
  }
  if (!hasGaps && activeCount >= 4) {
    compactness += SCORING_WEIGHTS.compactBlockBonus;
  }

  // 3. ERGONOMETRIA E STRETCH: Penalidade de stretch geral
  let ergonomics = 0;
  let minFret = Infinity;
  let maxFret = -Infinity;
  for (let idx = 0; idx < 6; idx++) {
    const f = frets[idx];
    if (f !== null && f > 0) {
      if (f < minFret) minFret = f;
      if (f > maxFret) maxFret = f;
    }
  }

  if (minFret !== Infinity && maxFret !== -Infinity) {
    const stretch = maxFret - minFret;
    if (stretch > 3) {
      ergonomics -= SCORING_WEIGHTS.largeStretchPenalty;
    } else if (stretch === 0 && activeCount >= 4) {
      ergonomics += SCORING_WEIGHTS.barreBonus;
    }
  }

  // 4. REDUNDÂNCIA: Penalidade suave por vozes extras repetidas além de 4
  let redundancy = 0;
  if (activeCount > 4) {
    const redundancyCount = activeCount - 4;
    redundancy -= redundancyCount * SCORING_WEIGHTS.redundantVoicePenalty;
  }

  // 5. DISTRIBUIÇÃO ACÚSTICA: Voice Distribution Score
  const distribution = calculateVoiceDistributionScore(notes);

  // Somando todas as frentes (anatômica, ergonômica, acústica) com base 100
  const score = SCORING_WEIGHTS.baseScore + compactness + ergonomics + redundancy + distribution;

  return Math.max(10, score);
}
