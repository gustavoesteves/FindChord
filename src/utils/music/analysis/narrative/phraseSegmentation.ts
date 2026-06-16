import type { Phrase, HarmonicRegion, CadenceInfo } from '../models/FunctionalAnalysis';
import type { ScoreSection } from '../models/ScoreSnapshot';

export function segmentPhrases(
  progressionLength: number,
  regions: HarmonicRegion[],
  cadences: CadenceInfo[],
  sections?: ScoreSection[]
): Phrase[] {
  const phrases: Phrase[] = [];
  if (progressionLength === 0) return phrases;

  const structuralCadences = cadences
    .map((cad, originalIdx) => ({ cad, originalIdx }))
    .filter(({ cad }) => !cad.suppressed);

  let boundaryIndices = Array.from(
    new Set(structuralCadences.map(({ cad }) => cad.endIndex))
  );

  // Add section boundaries
  if (sections && sections.length > 0) {
    for (const sec of sections) {
      if (sec.endChordIndex !== undefined && sec.endChordIndex >= 0 && sec.endChordIndex < progressionLength) {
        boundaryIndices.push(sec.endChordIndex);
      }
    }
  }

  boundaryIndices = Array.from(new Set(boundaryIndices)).sort((a, b) => a - b);

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

    let sectionLabel: string | undefined;
    if (sections && sections.length > 0) {
      const parentSection = sections.find(s => 
        s.startChordIndex !== undefined && s.endChordIndex !== undefined &&
        start >= s.startChordIndex && end <= s.endChordIndex
      );
      if (parentSection) {
        sectionLabel = parentSection.label;
      }
    }

    phrases.push({
      index: phraseIndex++,
      startIndex: start,
      endIndex: end,
      terminatingCadence,
      regions: phraseRegions,
      sectionLabel
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
