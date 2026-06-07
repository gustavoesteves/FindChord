import type { FunctionalChord, TonalCenter, ModalBorrowing, FunctionalHypothesis } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';
import { isDominantType, isMajorType, isMinorType } from './helpers/qualityHelpers';

// Quality helpers imported from helpers/qualityHelpers

export function analyzeModalInterchange(
  chords: FunctionalChord[],
  tonalCenter: TonalCenter
): FunctionalHypothesis[][] {
  const N = chords.length;
  if (N === 0) return [];

  const keyChroma = getPitchClass(tonalCenter.root);
  if (keyChroma === -1) return Array.from({ length: N }, () => []);

  const isMajorKey = tonalCenter.mode === 'MAJOR';
  const hypotheses: FunctionalHypothesis[][] = Array.from({ length: N }, () => []);

  for (let i = 0; i < N; i++) {
    const current = chords[i];

    // Só analisamos acordes não-diatônicos (ou o Picardy Third no caso de tom menor)
    const parsed = parseChord(current.chordSymbol);
    if (parsed.empty) continue;

    const chordChroma = getPitchClass(parsed.root);
    if (chordChroma === -1) continue;

    const offset = (chordChroma - keyChroma + 12) % 12;
    const isDom = isDominantType(parsed.quality);
    const isMaj = isMajorType(parsed.quality);
    const isMin = isMinorType(parsed.quality);

    let modalBorrowing: ModalBorrowing | undefined = undefined;
    let confidence = 0.50;

    if (isMajorKey) {
      // ─── Key is Major ───
      if (offset === 1 && isMaj) {
        // bII (Napolitano) -> Phrygian
        modalBorrowing = { sourceMode: 'PHRYGIAN', modeName: 'Frígio' };
        confidence = 0.98;
      } else if (offset === 2 && (isMaj || isDom)) {
        // II (Lydian II)
        modalBorrowing = { sourceMode: 'LYDIAN', modeName: 'Lídio' };
        confidence = 0.85;
      } else if (offset === 3 && isMaj) {
        // bIII -> Aeolian
        modalBorrowing = { sourceMode: 'AEOLIAN', modeName: 'Eólio' };
        confidence = 0.95;
      } else if (offset === 5 && isMin) {
        // iv -> Aeolian
        modalBorrowing = { sourceMode: 'AEOLIAN', modeName: 'Eólio' };
        confidence = 0.95;
      } else if (offset === 5 && isDom) {
        // IV7 -> Dorian
        modalBorrowing = { sourceMode: 'DORIAN', modeName: 'Dórico' };
        confidence = 0.85;
      } else if (offset === 8 && isMaj) {
        // bVI -> Aeolian
        modalBorrowing = { sourceMode: 'AEOLIAN', modeName: 'Eólio' };
        confidence = 0.95;
      } else if (offset === 10 && isMaj) {
        // bVIImaj7 -> Mixolydian
        modalBorrowing = { sourceMode: 'MIXOLYDIAN', modeName: 'Mixolídio' };
        confidence = 0.95;
      } else if (offset === 10 && isDom) {
        // bVII7 -> Aeolian
        modalBorrowing = { sourceMode: 'AEOLIAN', modeName: 'Eólio' };
        confidence = 0.95;
      } else if (offset === 0 && isMin && parsed.quality !== 'diminished' && parsed.quality !== 'diminished7th' && parsed.quality !== 'halfDiminished') {
        // i -> Aeolian
        modalBorrowing = { sourceMode: 'AEOLIAN', modeName: 'Eólio' };
        confidence = 0.90;
      }
    } else {
      // ─── Key is Minor ───
      if (offset === 0 && (isMaj || isDom)) {
        // Tonic Major in Minor Key
        if (i === N - 1) {
          // Picardy Third
          modalBorrowing = { sourceMode: 'IONIAN', modeName: 'Jônio' };
          confidence = 1.00;
        } else {
          // Ionian Borrowing
          modalBorrowing = { sourceMode: 'IONIAN', modeName: 'Jônio' };
          confidence = 0.90;
        }
      } else if (offset === 5 && (isMaj || isDom)) {
        // IV / IV7 -> Dorian
        modalBorrowing = { sourceMode: 'DORIAN', modeName: 'Dórico' };
        confidence = 0.85;
      } else if (offset === 2 && isMin) {
        // ii -> Dorian
        modalBorrowing = { sourceMode: 'DORIAN', modeName: 'Dórico' };
        confidence = 0.85;
      } else if (offset === 9 && (isMin || parsed.quality === 'halfDiminished')) {
        // vi° / vim7(b5) -> Dorian
        modalBorrowing = { sourceMode: 'DORIAN', modeName: 'Dórico' };
        confidence = 0.85;
      }
    }

    if (modalBorrowing) {
      hypotheses[i].push({
        contextualFunction: 'MODAL_BORROWING',
        romanNumeral: current.romanNumeral,
        harmonicFunction: current.harmonicFunction,
        confidence,
        modalBorrowing,
        explanation: [
          `Borrowed from ${modalBorrowing.modeName} mode (${modalBorrowing.sourceMode})`,
          `Root chroma offset from key root: ${offset} semitones`
        ]
      });
    }
  }

  return hypotheses;
}
