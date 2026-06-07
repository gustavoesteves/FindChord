import type { HarmonicFunction, ModalMode } from '../analysis/models/FunctionalAnalysis';

export interface DiatonicEntry {
  offset: number;
  isMinorChord: boolean;
  isDominantOk?: boolean;
  scaleDegree: string;
  romanBase: string;
  function: HarmonicFunction;
  confidence: number;
}

export interface ModalModeDefinition {
  mode: ModalMode;
  characteristicIntervals: string[];
  characteristicDegrees: string[];
  field: DiatonicEntry[];
}

export const MODAL_THEORY: Record<ModalMode, ModalModeDefinition> = {
  IONIAN: {
    mode: 'IONIAN',
    characteristicIntervals: ['P4'], // Avoid note in traditional tonal sense
    characteristicDegrees: ['IV', 'V'],
    field: [
      { offset: 0,  isMinorChord: false, scaleDegree: 'I',    romanBase: 'I',    function: 'TONIC',       confidence: 1.0 },
      { offset: 2,  isMinorChord: true,  scaleDegree: 'ii',   romanBase: 'ii',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 4,  isMinorChord: true,  scaleDegree: 'iii',  romanBase: 'iii',  function: 'TONIC',       confidence: 1.0 },
      { offset: 5,  isMinorChord: false, scaleDegree: 'IV',   romanBase: 'IV',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 7,  isMinorChord: false, scaleDegree: 'V',    romanBase: 'V',    function: 'DOMINANT',    confidence: 1.0, isDominantOk: true },
      { offset: 9,  isMinorChord: true,  scaleDegree: 'vi',   romanBase: 'vi',   function: 'TONIC',       confidence: 1.0 },
      { offset: 11, isMinorChord: true,  scaleDegree: 'vii°', romanBase: 'vii°', function: 'DOMINANT',    confidence: 1.0 },
    ]
  },
  DORIAN: {
    mode: 'DORIAN',
    characteristicIntervals: ['M6'],
    characteristicDegrees: ['IV', 'ii', 'vi°'],
    field: [
      { offset: 0,  isMinorChord: true,  scaleDegree: 'i',    romanBase: 'i',    function: 'TONIC',       confidence: 1.0 },
      { offset: 2,  isMinorChord: true,  scaleDegree: 'ii',   romanBase: 'ii',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 3,  isMinorChord: false, scaleDegree: 'bIII', romanBase: 'bIII', function: 'TONIC',       confidence: 1.0 },
      { offset: 5,  isMinorChord: false, scaleDegree: 'IV',   romanBase: 'IV',   function: 'SUBDOMINANT', confidence: 1.0, isDominantOk: true },
      { offset: 7,  isMinorChord: true,  scaleDegree: 'v',    romanBase: 'v',    function: 'DOMINANT',    confidence: 0.8 },
      { offset: 9,  isMinorChord: true,  scaleDegree: 'vi°',  romanBase: 'vi°',  function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 10, isMinorChord: false, scaleDegree: 'bVII', romanBase: 'bVII', function: 'SUBDOMINANT', confidence: 1.0 },
    ]
  },
  PHRYGIAN: {
    mode: 'PHRYGIAN',
    characteristicIntervals: ['m2'],
    characteristicDegrees: ['bII', 'vii', 'v°'],
    field: [
      { offset: 0,  isMinorChord: true,  scaleDegree: 'i',    romanBase: 'i',    function: 'TONIC',       confidence: 1.0 },
      { offset: 1,  isMinorChord: false, scaleDegree: 'bII',  romanBase: 'bII',  function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 3,  isMinorChord: false, scaleDegree: 'bIII', romanBase: 'bIII', function: 'TONIC',       confidence: 1.0, isDominantOk: true },
      { offset: 5,  isMinorChord: true,  scaleDegree: 'iv',   romanBase: 'iv',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 7,  isMinorChord: true,  scaleDegree: 'v°',   romanBase: 'v°',   function: 'DOMINANT',    confidence: 1.0 },
      { offset: 8,  isMinorChord: false, scaleDegree: 'bVI',  romanBase: 'bVI',  function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 10, isMinorChord: true,  scaleDegree: 'bVII', romanBase: 'bVII', function: 'TONIC',       confidence: 0.9 },
    ]
  },
  LYDIAN: {
    mode: 'LYDIAN',
    characteristicIntervals: ['A4'],
    characteristicDegrees: ['II', 'vii', '#iv°'],
    field: [
      { offset: 0,  isMinorChord: false, scaleDegree: 'I',    romanBase: 'I',    function: 'TONIC',       confidence: 1.0 },
      { offset: 2,  isMinorChord: false, scaleDegree: 'II',   romanBase: 'II',   function: 'DOMINANT',    confidence: 1.0, isDominantOk: true },
      { offset: 4,  isMinorChord: true,  scaleDegree: 'iii',  romanBase: 'iii',  function: 'TONIC',       confidence: 1.0 },
      { offset: 6,  isMinorChord: true,  scaleDegree: '#iv°', romanBase: '#iv°', function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 7,  isMinorChord: false, scaleDegree: 'V',    romanBase: 'V',    function: 'TONIC',       confidence: 0.9 },
      { offset: 9,  isMinorChord: true,  scaleDegree: 'vi',   romanBase: 'vi',   function: 'TONIC',       confidence: 1.0 },
      { offset: 11, isMinorChord: true,  scaleDegree: 'vii',  romanBase: 'vii',  function: 'TONIC',       confidence: 0.8 },
    ]
  },
  MIXOLYDIAN: {
    mode: 'MIXOLYDIAN',
    characteristicIntervals: ['m7'],
    characteristicDegrees: ['bVII', 'v', 'v7'],
    field: [
      { offset: 0,  isMinorChord: false, scaleDegree: 'I',    romanBase: 'I',    function: 'TONIC',       confidence: 1.0, isDominantOk: true },
      { offset: 2,  isMinorChord: true,  scaleDegree: 'ii',   romanBase: 'ii',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 4,  isMinorChord: true,  scaleDegree: 'iii°', romanBase: 'iii°', function: 'TONIC',       confidence: 1.0 },
      { offset: 5,  isMinorChord: false, scaleDegree: 'IV',   romanBase: 'IV',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 7,  isMinorChord: true,  scaleDegree: 'v',    romanBase: 'v',    function: 'DOMINANT',    confidence: 0.8 },
      { offset: 9,  isMinorChord: true,  scaleDegree: 'vi',   romanBase: 'vi',   function: 'TONIC',       confidence: 1.0 },
      { offset: 10, isMinorChord: false, scaleDegree: 'bVII', romanBase: 'bVII', function: 'SUBDOMINANT', confidence: 1.0 },
    ]
  },
  AEOLIAN: {
    mode: 'AEOLIAN',
    characteristicIntervals: ['m6'],
    characteristicDegrees: ['bVI', 'ii°', 'iv'],
    field: [
      { offset: 0,  isMinorChord: true,  scaleDegree: 'i',    romanBase: 'i',    function: 'TONIC',       confidence: 1.0 },
      { offset: 2,  isMinorChord: true,  scaleDegree: 'ii°',  romanBase: 'ii°',  function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 3,  isMinorChord: false, scaleDegree: 'bIII', romanBase: 'bIII', function: 'TONIC',       confidence: 1.0 },
      { offset: 5,  isMinorChord: true,  scaleDegree: 'iv',   romanBase: 'iv',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 7,  isMinorChord: true,  scaleDegree: 'v',    romanBase: 'v',    function: 'DOMINANT',    confidence: 0.8 },
      { offset: 8,  isMinorChord: false, scaleDegree: 'bVI',  romanBase: 'bVI',  function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 10, isMinorChord: false, scaleDegree: 'bVII', romanBase: 'bVII', function: 'SUBDOMINANT', confidence: 1.0, isDominantOk: true },
    ]
  },
  LOCRIAN: {
    mode: 'LOCRIAN',
    characteristicIntervals: ['d5', 'm2'],
    characteristicDegrees: ['bV', 'bII', 'iv'],
    field: [
      { offset: 0,  isMinorChord: true,  scaleDegree: 'i°',   romanBase: 'i°',   function: 'TONIC',       confidence: 1.0 },
      { offset: 1,  isMinorChord: false, scaleDegree: 'bII',  romanBase: 'bII',  function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 3,  isMinorChord: true,  scaleDegree: 'biii', romanBase: 'biii', function: 'TONIC',       confidence: 0.8 },
      { offset: 5,  isMinorChord: true,  scaleDegree: 'iv',   romanBase: 'iv',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 6,  isMinorChord: false, scaleDegree: 'bV',   romanBase: 'bV',   function: 'SUBDOMINANT', confidence: 1.0 },
      { offset: 8,  isMinorChord: false, scaleDegree: 'bVI',  romanBase: 'bVI',  function: 'TONIC',       confidence: 0.9 },
      { offset: 10, isMinorChord: true,  scaleDegree: 'bVII', romanBase: 'bVII', function: 'TONIC',       confidence: 0.8 },
    ]
  }
};
