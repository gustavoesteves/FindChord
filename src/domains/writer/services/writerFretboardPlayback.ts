import { getNoteAt } from "../../../utils/music/core/notes";

export interface WriterFretboardPlaybackStep {
  stringIndex: number;
  noteName: string;
  delayMs: number;
}

export function buildWriterFretboardPlaybackSteps(
  selectedFrets: (number | null)[],
  tuning: string[],
  stepDelayMs = 50
): WriterFretboardPlaybackStep[] {
  const steps: WriterFretboardPlaybackStep[] = [];
  let delayMs = 0;

  for (let stringIndex = selectedFrets.length - 1; stringIndex >= 0; stringIndex--) {
    const fret = selectedFrets[stringIndex];
    if (fret === null) continue;

    steps.push({
      stringIndex,
      noteName: getNoteAt(tuning[stringIndex], fret),
      delayMs
    });
    delayMs += stepDelayMs;
  }

  return steps;
}
