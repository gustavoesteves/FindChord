export function computeComplexityScore(
  chordSymbol: string,
  hds: number,
  hdc: number
): number {
  if (!chordSymbol) return 0;
  let score = 0;
  const symbol = String(chordSymbol).toUpperCase();

  // Diminished or augmented symmetry
  if (symbol.includes('DIM') || symbol.includes('°')) {
    score += 0.25;
  }
  if (symbol.includes('AUG') || symbol.includes('+')) {
    score += 0.25;
  }

  // Mystic or Promethean chords
  if (symbol.includes('7#11') || symbol.includes('#11')) {
    score += 0.30;
  }

  // High hypothesis diversity score (HDS)
  if (hds > 1.0) {
    score += Math.min((hds - 1.0) / 3.0, 0.30);
  }

  // High functional distance between alternatives (HDC)
  if (hdc > 0) {
    score += Math.min(hdc * 0.20, 0.20);
  }

  return Math.min(score, 1.0);
}

export function getMaximumProbability(complexityScore: number): number {
  return 0.95 - 0.20 * complexityScore;
}
