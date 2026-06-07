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
    .filter(({ cad }) => 
      cad.type === 'PERFECT' ||
      cad.type === 'PLAGAL' ||
      cad.type === 'DECEPTIVE' ||
      cad.type === 'BACKDOOR' ||
      cad.type === 'TURNAROUND'
    );

  const rawBoundaries = Array.from(
    new Set(structuralCadences.map(({ cad }) => cad.endIndex))
  ).sort((a, b) => a - b);

  const boundaryIndices: number[] = [];
  rawBoundaries.forEach(b => {
    const isTurnaroundEnd = structuralCadences.some(({ cad }) => cad.endIndex === b && cad.type === 'TURNAROUND');
    if (isTurnaroundEnd) {
      const hasResolvingLater = structuralCadences.some(({ cad }) =>
        (cad.type === 'PERFECT' || cad.type === 'PLAGAL' || cad.type === 'DECEPTIVE') &&
        (cad.endIndex === b + 1 || cad.endIndex === b + 2)
      );
      if (hasResolvingLater) {
        return;
      }
    }
    boundaryIndices.push(b);
  });

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
