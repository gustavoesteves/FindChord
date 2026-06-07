import type { FunctionalChord, CadenceInfo, TonalCenter, TonalRegion, TonalRegionType } from '../models/FunctionalAnalysis';

export function segmentTonalRegions(
  chords: FunctionalChord[],
  cadences: CadenceInfo[],
  homeKey: TonalCenter
): TonalRegion[] {
  const regions: TonalRegion[] = [];
  if (chords.length === 0) return regions;

  let currentKey = chords[0].tonal!.tonalCenter!;
  let startIndex = 0;

  for (let i = 1; i <= chords.length; i++) {
    const isEnd = i === chords.length;
    const nextKey = !isEnd ? chords[i].tonal!.tonalCenter! : null;

    if (isEnd || !nextKey || nextKey.root !== currentKey.root || nextKey.mode !== currentKey.mode) {
      const endIndex = i - 1;
      const duration = endIndex - startIndex + 1;

      const cadenceIndexes: number[] = [];
      let hasCadence = false;

      cadences.forEach((cad, cadIdx) => {
        if (
          cad.endIndex >= startIndex &&
          cad.endIndex <= endIndex &&
          chords[cad.endIndex].tonal?.tonalCenter?.root === currentKey.root &&
          chords[cad.endIndex].tonal?.tonalCenter?.mode === currentKey.mode
        ) {
          cadenceIndexes.push(cadIdx);
          hasCadence = true;
        }
      });

      let type: TonalRegionType;
      if (duration <= 2) {
        type = 'TONICIZATION';
      } else if (hasCadence) {
        type = 'ESTABLISHED_MODULATION';
      } else {
        type = 'REGIONAL_SHIFT';
      }

      const isHomeKey = currentKey.root === homeKey.root && currentKey.mode === homeKey.mode;

      const sDur = Math.min(1.0, duration / 6);
      const sCad = hasCadence ? 1.0 : 0.0;

      let diatonicCount = 0;
      for (let idx = startIndex; idx <= endIndex; idx++) {
        if (chords[idx].isDiatonic) {
          diatonicCount++;
        }
      }
      const sDiat = duration > 0 ? diatonicCount / duration : 0.0;

      let confidenceSum = 0;
      for (let idx = startIndex; idx <= endIndex; idx++) {
        confidenceSum += chords[idx].confidence;
      }
      const sConf = duration > 0 ? confidenceSum / duration : 0.0;

      const stabilityScore = 0.3 * sDur + 0.3 * sCad + 0.2 * sDiat + 0.2 * sConf;

      regions.push({
        key: currentKey,
        startIndex,
        endIndex,
        duration,
        type,
        isHomeKey,
        stabilityScore: Math.round(stabilityScore * 100) / 100,
        cadenceIndexes
      });

      if (!isEnd) {
        currentKey = nextKey!;
        startIndex = i;
      }
    }
  }

  return regions;
}
