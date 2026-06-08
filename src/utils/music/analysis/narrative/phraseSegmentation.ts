import type { Phrase, HarmonicRegion, CadenceInfo } from '../models/FunctionalAnalysis';

export function segmentPhrases(
  progressionLength: number,
  regions: HarmonicRegion[],
  cadences: CadenceInfo[]
): Phrase[] {
  const phrases: Phrase[] = [];
  if (progressionLength === 0) return phrases;

  const structuralCadences = cadences
    .map((cad, originalIdx) => ({ cad, originalIdx }))
    .filter(({ cad }) => !cad.suppressed);

  const boundaryIndices = Array.from(
    new Set(structuralCadences.map(({ cad }) => cad.endIndex))
  ).sort((a, b) => a - b);

  let phraseStart = 0;
  let phraseIndex = 0;

  const createPhrase = (start: number, end: number) => {
    const match = structuralCadences.find(({ cad }) => cad.endIndex === end);
    const terminatingCadence = match ? match.cad : undefined;

    const phraseRegions = regions.filter(r => 
      (r.startIndex >= start && r.startIndex <= end) ||
      (r.endIndex >= start && r.endIndex <= end) ||
      (r.startIndex <= start && r.endIndex >= end)
    );

    phrases.push({
      index: phraseIndex++,
      startIndex: start,
      endIndex: end,
      terminatingCadence,
      regions: phraseRegions
    });
  };

  for (const boundary of boundaryIndices) {
    if (boundary >= phraseStart && boundary < progressionLength) {
      createPhrase(phraseStart, boundary);
      phraseStart = boundary + 1;
    }
  }

  if (phraseStart < progressionLength) {
    createPhrase(phraseStart, progressionLength - 1);
  }

  return phrases;
}
