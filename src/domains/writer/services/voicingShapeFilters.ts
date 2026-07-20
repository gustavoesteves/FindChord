import type { VoicingShape } from "../../../utils/music/models/VoicingShape";

export function hasInternalMutedGap(frets: (number | null)[]): boolean {
  const playedIndexes = frets
    .map((fret, index) => (fret !== null ? index : null))
    .filter((index): index is number => index !== null);

  if (playedIndexes.length < 2) return false;

  for (let index = playedIndexes[0] + 1; index < playedIndexes[playedIndexes.length - 1]; index++) {
    if (frets[index] === null) return true;
  }

  return false;
}

export function isOpenVoicingShape(voicing: VoicingShape): boolean {
  return voicing.frets.some(fret => fret === 0)
    || hasInternalMutedGap(voicing.frets)
    || voicing.shapeFamily === "Drop 3";
}

export function isClosedVoicingShape(voicing: VoicingShape): boolean {
  return !voicing.frets.some(fret => fret === 0)
    && !hasInternalMutedGap(voicing.frets);
}
