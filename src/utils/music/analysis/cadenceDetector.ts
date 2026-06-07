import type { FunctionalChord, TonalCenter, CadenceInfo, ModalMode } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';
import { isDominantType, isMinorType } from './helpers/qualityHelpers';

export function detectCadences(
  chords: FunctionalChord[],
  tonalCenter: TonalCenter,
  modalMode?: ModalMode
): CadenceInfo[] {
  const N = chords.length;
  const cadences: CadenceInfo[] = [];
  if (N < 2) return cadences;

  const isMajorKey = tonalCenter.mode === 'MAJOR';
  const isModalActive = modalMode && modalMode !== 'IONIAN' && modalMode !== 'AEOLIAN';

  // Helper to parse quality of a chord
  const getQuality = (c: FunctionalChord) => {
    const parsed = parseChord(c.chordSymbol);
    return parsed.empty ? '' : parsed.quality;
  };

  // Helper to get root pitch class of a chord
  const getRootChroma = (c: FunctionalChord) => {
    const parsed = parseChord(c.chordSymbol);
    return parsed.empty ? -1 : getPitchClass(parsed.root);
  };

  const hasSecondaryDomTarget = (c: FunctionalChord, target: string | string[]): boolean => {
    const targets = Array.isArray(target) ? target : [target];
    if (c.secondary?.contextualFunction === 'SECONDARY_DOMINANT') {
      return c.secondary.secondaryTarget ? targets.includes(c.secondary.secondaryTarget) : false;
    }
    return c.debug?.functionalHypotheses?.some(h => 
      h.contextualFunction === 'SECONDARY_DOMINANT' && h.secondaryTarget && targets.includes(h.secondaryTarget)
    ) ?? false;
  };

  const addCadence = (cad: CadenceInfo, isTonalCadence = true) => {
    if (isTonalCadence && isModalActive) {
      cadences.push({
        ...cad,
        suppressed: true,
        suppressionReason: 'MODAL_REGION'
      });
    } else {
      cadences.push(cad);
    }
  };

  // 1. Turnaround checks (length 4)
  if (N >= 4) {
    for (let i = 0; i < N; i++) {
      const idxs = [i, (i + 1) % N, (i + 2) % N, (i + 3) % N];
      const c = idxs.map(idx => chords[idx]);
      const q3 = getQuality(c[3]);

      // 1.1 Turnaround de Jazz: I - VI7 - ii - V7 (or i - VI7 - ii° - V7 in minor)
      const isC0Tonic = isMajorKey ? c[0].scaleDegree === 'I' : c[0].scaleDegree === 'i';
      const isC1SecondaryDom = hasSecondaryDomTarget(c[1], ['ii', 'ii°']);
      const isC2Supertonic = isMajorKey ? c[2].scaleDegree === 'ii' : c[2].scaleDegree === 'ii°';
      const isC3Dominant = c[3].scaleDegree === 'V' || c[3].romanNumeral.includes('V') || isDominantType(q3);

      if (isC0Tonic && isC1SecondaryDom && isC2Supertonic && isC3Dominant) {
        addCadence({
          name: `Turnaround de Jazz (${tonalCenter.root} ${isMajorKey ? 'Maior' : 'Menor'})`,
          type: 'TURNAROUND',
          startIndex: idxs[0],
          endIndex: idxs[3],
          chordIndexes: idxs,
          confidence: 0.95
        });
        continue;
      }

      // 1.2 Turnaround Pop: I - vi - ii - V (or i - bVI - ii° - V)
      const isC1Vi = isMajorKey ? c[1].scaleDegree === 'vi' : c[1].scaleDegree === 'bVI';
      if (isC0Tonic && isC1Vi && isC2Supertonic && isC3Dominant) {
        addCadence({
          name: `Turnaround (${tonalCenter.root} ${isMajorKey ? 'Maior' : 'Menor'})`,
          type: 'TURNAROUND',
          startIndex: idxs[0],
          endIndex: idxs[3],
          chordIndexes: idxs,
          confidence: 0.95
        });
      }
    }
  }

  // 2. ii - V - I checks (length 3)
  if (N >= 3) {
    for (let i = 0; i < N; i++) {
      const idxs = [i, (i + 1) % N, (i + 2) % N];
      const c = idxs.map(idx => chords[idx]);
      const q0 = getQuality(c[0]);
      const q1 = getQuality(c[1]);

      // 2.1 Diatonic Perfect Cadence (ii - V - I or ii° - V - i)
      const isC0ii = isMajorKey ? c[0].scaleDegree === 'ii' : c[0].scaleDegree === 'ii°';
      const isC1V = c[1].scaleDegree === 'V' || (c[1].scaleDegree === 'v' && isDominantType(q1));
      const isC2I = isMajorKey ? c[2].scaleDegree === 'I' : c[2].scaleDegree === 'i';

      if (isC0ii && isC1V && isC2I) {
        addCadence({
          name: `ii - V - I (${tonalCenter.root} ${isMajorKey ? 'Maior' : 'Menor'})`,
          type: 'PERFECT',
          startIndex: idxs[0],
          endIndex: idxs[2],
          chordIndexes: idxs,
          confidence: 0.98
        });
        continue;
      }

      // 2.2 Secondary Perfect Cadence (ii/target - V/target - target)
      if (hasSecondaryDomTarget(c[1], c[2].scaleDegree)) {
        const root0 = getRootChroma(c[0]);
        const root1 = getRootChroma(c[1]);
        if (root0 !== -1 && root1 !== -1) {
          const distance = (root1 - root0 + 12) % 12;
          if (distance === 5 && isMinorType(q0)) {
            addCadence({
              name: `ii - V - I Secundário de ${c[2].scaleDegree}`,
              type: 'SECONDARY_PERFECT',
              startIndex: idxs[0],
              endIndex: idxs[2],
              chordIndexes: idxs,
              confidence: 0.85
            });
          }
        }
      }
    }
  }

  // 3. Length 2 checks: Plagal, Deceptive, Backdoor, and Modal Approach Cadences
  for (let i = 0; i < N; i++) {
    const idxs = [i, (i + 1) % N];
    const c = idxs.map(idx => chords[idx]);
    const q0 = getQuality(c[0]);

    // 3.1 Modal Approach Cadences
    if (isModalActive && modalMode) {
      const isC1Tonic = c[1].scaleDegree === 'I' || c[1].scaleDegree === 'i' || c[1].scaleDegree === 'i°';

      if (isC1Tonic) {
        let modalCadenceName = '';
        let cadenceType: CadenceInfo['type'] = 'PLAGAL';

        if (modalMode === 'MIXOLYDIAN' && c[0].scaleDegree === 'bVII') {
          modalCadenceName = `Aproximação Mixolídia (bVII - I)`;
        } else if (modalMode === 'DORIAN' && (c[0].scaleDegree === 'IV' || c[0].scaleDegree === 'bVII')) {
          modalCadenceName = `Aproximação Dórica (${c[0].scaleDegree} - i)`;
        } else if (modalMode === 'PHRYGIAN' && (c[0].scaleDegree === 'bII' || c[0].scaleDegree === 'bvii')) {
          modalCadenceName = `Aproximação Frígia (${c[0].scaleDegree} - i)`;
        } else if (modalMode === 'LYDIAN' && c[0].scaleDegree === 'II') {
          modalCadenceName = `Aproximação Lídia (II - I)`;
          cadenceType = 'PERFECT';
        } else if (modalMode === 'LOCRIAN' && (c[0].scaleDegree === 'bII' || c[0].scaleDegree === 'bV')) {
          modalCadenceName = `Aproximação Lócria (${c[0].scaleDegree} - i°)`;
        }

        if (modalCadenceName) {
          addCadence({
            name: modalCadenceName,
            type: cadenceType,
            startIndex: idxs[0],
            endIndex: idxs[1],
            chordIndexes: idxs,
            confidence: 0.85
          }, false); // false = not a tonal cadence, do not suppress!
          continue;
        }
      }
    }

    // 3.2 Backdoor Cadence (bVII7 - I)
    const isC1I = isMajorKey ? c[1].scaleDegree === 'I' : c[1].scaleDegree === 'i';
    if (isDominantType(q0) && isC1I && (!c[0].isDiatonic || c[0].harmonicFunction === 'SUBDOMINANT')) {
      const root0 = getRootChroma(c[0]);
      const root1 = getRootChroma(c[1]);
      if (root0 !== -1 && root1 !== -1 && (root1 - root0 + 12) % 12 === 2) {
        addCadence({
          name: `Backdoor Cadence (bVII7 - ${c[1].scaleDegree})`,
          type: 'BACKDOOR',
          startIndex: idxs[0],
          endIndex: idxs[1],
          chordIndexes: idxs,
          confidence: 0.80
        });
        continue;
      }
    }

    // 3.3 Deceptive Cadence (V7 - vi or V7 - bVI)
    const isC0V = c[0].scaleDegree === 'V' && (isDominantType(q0) || c[0].romanNumeral.startsWith('V'));
    const isC1DeceptiveTarget = isMajorKey ? c[1].scaleDegree === 'vi' : c[1].scaleDegree === 'bVI';
    if (isC0V && isC1DeceptiveTarget) {
      addCadence({
        name: `Resolução Deceptiva (V7 - ${c[1].scaleDegree})`,
        type: 'DECEPTIVE',
        startIndex: idxs[0],
        endIndex: idxs[1],
        chordIndexes: idxs,
        confidence: 0.80
      });
      continue;
    }

    // 3.4 Plagal Cadence (IV - I or iv - i)
    const isC0IV = isMajorKey ? c[0].scaleDegree === 'IV' : c[0].scaleDegree === 'iv';
    if (isC0IV && isC1I) {
      addCadence({
        name: `Cadência Plagal (IV - ${c[1].scaleDegree})`,
        type: 'PLAGAL',
        startIndex: idxs[0],
        endIndex: idxs[1],
        chordIndexes: idxs,
        confidence: 0.70
      });
    }
  }

  return cadences;
}
