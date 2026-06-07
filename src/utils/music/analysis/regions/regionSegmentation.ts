import type {
  FunctionalChord,
  CadenceInfo,
  TonalCenter,
  HarmonicRegion,
  HarmonicRegionType,
  HarmonicState
} from '../models/FunctionalAnalysis';

function getChordState(c: FunctionalChord): HarmonicState {
  if (c.state) return c.state;
  const root = c.tonal?.tonalCenter?.root || 'C';
  const mode = c.tonal?.tonalCenter?.mode === 'MINOR' ? 'AEOLIAN' : 'IONIAN';
  return { root, mode };
}

export function segmentHarmonicRegions(
  chords: FunctionalChord[],
  cadences: CadenceInfo[],
  homeKey: TonalCenter
): HarmonicRegion[] {
  const regions: HarmonicRegion[] = [];
  if (chords.length === 0) return regions;

  let currentState = getChordState(chords[0]);
  let startIndex = 0;

  for (let i = 1; i <= chords.length; i++) {
    const isEnd = i === chords.length;
    const nextState = !isEnd ? getChordState(chords[i]) : null;

    if (isEnd || !nextState || nextState.root !== currentState.root || nextState.mode !== currentState.mode) {
      const endIndex = i - 1;
      const duration = endIndex - startIndex + 1;

      const cadenceIndexes: number[] = [];
      let hasCadence = false;

      cadences.forEach((cad, cadIdx) => {
        if (cad.endIndex >= startIndex && cad.endIndex <= endIndex) {
          const targetChord = chords[cad.endIndex];
          const targetState = getChordState(targetChord);
          if (targetState.root === currentState.root && targetState.mode === currentState.mode) {
            cadenceIndexes.push(cadIdx);
            hasCadence = true;
          }
        }
      });

      let type: HarmonicRegionType;
      if (currentState.mode !== 'IONIAN' && currentState.mode !== 'AEOLIAN') {
        type = 'MODAL_AXIS';
      } else if (duration <= 2) {
        type = 'TONICIZATION';
      } else if (hasCadence) {
        type = 'ESTABLISHED_MODULATION';
      } else {
        type = 'REGIONAL_SHIFT';
      }

      const isMajor = currentState.mode === 'IONIAN' || currentState.mode === 'LYDIAN' || currentState.mode === 'MIXOLYDIAN';
      const baseCenter: TonalCenter = {
        root: currentState.root,
        mode: isMajor ? 'MAJOR' : 'MINOR',
        confidence: 0.90
      };

      const isHomeKey = currentState.root === homeKey.root && baseCenter.mode === homeKey.mode;

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
        state: currentState,
        baseCenter,
        startIndex,
        endIndex,
        type,
        isHomeKey,
        confidence: Math.round(sConf * 100) / 100,
        stabilityScore: Math.round(stabilityScore * 100) / 100,
        cadenceIndexes
      });

      if (!isEnd) {
        currentState = nextState!;
        startIndex = i;
      }
    }
  }

  return regions;
}
