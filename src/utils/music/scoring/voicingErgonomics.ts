export interface VoicingErgonomics {
  score: number;
  label: "confortável" | "tocável" | "exige abertura";
  stretch: number;
  hasBarre: boolean;
  frettedCount: number;
}

export function evaluateVoicingErgonomics(frets: (number | null)[]): VoicingErgonomics {
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0);
  if (fretted.length === 0) {
    return {
      score: 100,
      label: "confortável",
      stretch: 0,
      hasBarre: false,
      frettedCount: 0
    };
  }

  const minFret = Math.min(...fretted);
  const maxFret = Math.max(...fretted);
  const stretch = maxFret - minFret;
  const fretFrequencies = fretted.reduce<Record<number, number>>((acc, fret) => {
    acc[fret] = (acc[fret] || 0) + 1;
    return acc;
  }, {});
  const hasBarre = Object.values(fretFrequencies).some(count => count >= 3);

  const stretchPenalty = stretch > 3 ? (stretch - 3) * 18 : 0;
  const fingerLoadPenalty = Math.max(0, fretted.length - 4) * 8;
  const lowFretPenalty = minFret <= 2 && !hasBarre ? 6 : 0;
  const barreAdjustment = hasBarre && stretch <= 1 ? 8 : 0;
  const score = Math.max(0, Math.min(100, 92 - stretchPenalty - fingerLoadPenalty - lowFretPenalty + barreAdjustment));

  let label: VoicingErgonomics["label"] = "exige abertura";
  if (score >= 78) label = "confortável";
  else if (score >= 55) label = "tocável";

  return {
    score,
    label,
    stretch,
    hasBarre,
    frettedCount: fretted.length
  };
}
