/**
 * Filtra dedilhados com base na quantidade máxima de cordas mutadas internamente (internal gaps)
 */
export function hasValidMutedGaps(frets: (number | null)[]): boolean {
  let firstPlayed = -1;
  let lastPlayed = -1;
  for (let idx = 0; idx < frets.length; idx++) {
    if (frets[idx] !== null) {
      if (firstPlayed === -1) firstPlayed = idx;
      lastPlayed = idx;
    }
  }
  if (firstPlayed === -1) return false;
  
  let mutedGapCount = 0;
  for (let i = firstPlayed; i <= lastPlayed; i++) {
    if (frets[i] === null) {
      mutedGapCount++;
    }
  }
  return mutedGapCount <= 2; // Máximo 2 cordas mutadas no meio do acorde
}
