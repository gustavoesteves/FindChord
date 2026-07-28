export interface WriterMaterialFretWindow {
  startFret: number;
  endFret: number;
  hasShape: boolean;
}

export function fretWindowForWriterMaterialShape(
  selectedFrets: (number | null)[] | undefined,
  fretCount = 24
): WriterMaterialFretWindow {
  const selected = (selectedFrets || [])
    .filter((fret): fret is number => typeof fret === "number" && fret >= 0 && fret <= fretCount);
  if (selected.length === 0) return { startFret: 0, endFret: fretCount, hasShape: false };

  const fretted = selected
    .filter((fret): fret is number => typeof fret === "number" && fret > 0 && fret <= fretCount);
  if (fretted.length === 0) {
    return { startFret: 0, endFret: Math.min(5, fretCount), hasShape: true };
  }

  const minFret = Math.min(...fretted);
  const maxFret = Math.max(...fretted);
  let startFret = Math.max(0, minFret - 1);
  let endFret = Math.min(fretCount, maxFret + 2);

  while (endFret - startFret < 5 && endFret < fretCount) endFret += 1;
  while (endFret - startFret < 5 && startFret > 0) startFret -= 1;

  return { startFret, endFret, hasShape: true };
}
