export interface CalibrationScenario {
  id: string;
  name: string;
  group: 'A' | 'B' | 'C' | 'D';
  progression: string[];
  targetChordIndex: number;
  expectedTonalCenters: { root: string; mode: 'MAJOR' | 'MINOR'; expectedProb: number }[];
}

const PITCH_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11
};

const SEMITONE_TO_PITCH_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SEMITONE_TO_PITCH_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function transposePitch(pitch: string, semitones: number, preferFlat: boolean): string {
  const current = PITCH_TO_SEMITONE[pitch];
  if (current === undefined) return pitch;
  const target = (current + semitones + 12) % 12;
  return preferFlat ? SEMITONE_TO_PITCH_FLAT[target] : SEMITONE_TO_PITCH_SHARP[target];
}

function transposeChordSymbol(symbol: string, semitones: number, preferFlat: boolean): string {
  const match = symbol.match(/^([A-G][#b]|[A-G])/);
  if (!match) return symbol;
  const root = match[1];
  const rest = symbol.slice(root.length);
  const transposedRoot = transposePitch(root, semitones, preferFlat);
  return transposedRoot + rest;
}

const BASE_CORPUS: CalibrationScenario[] = [
  // ─── GRUPO A: POLITONALIDADE CONTROLADA ───
  {
    id: 'a-petrushka-loop',
    name: 'Petrushka Chord Polytonal Loop',
    group: 'A',
    progression: ['C', 'Gb', 'C', 'Gb'],
    targetChordIndex: 1,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'Gb', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'a-milhaud-saudades',
    name: 'Milhaud Saudades Polytonal Cadence',
    group: 'A',
    progression: ['G', 'Eb', 'G', 'Eb'],
    targetChordIndex: 3,
    expectedTonalCenters: [
      { root: 'G', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'Eb', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'a-bartok-clash',
    name: 'Bartok Minor-Major Clash',
    group: 'A',
    progression: ['Am', 'C#', 'Am', 'C#'],
    targetChordIndex: 1,
    expectedTonalCenters: [
      { root: 'A', mode: 'MINOR', expectedProb: 0.50 },
      { root: 'C#', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'a-polytonal-cadence',
    name: 'Polytonal Chromatic Cadence',
    group: 'A',
    progression: ['C', 'Db', 'G7', 'Ab7', 'C'],
    targetChordIndex: 3,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.60 },
      { root: 'Db', mode: 'MAJOR', expectedProb: 0.40 }
    ]
  },

  // ─── GRUPO B: AMBIGUIDADE SIMÉTRICA ───
  {
    id: 'b-diminished-symmetry',
    name: 'Symmetric Diminished Cycle',
    group: 'B',
    progression: ['C', 'C#dim7', 'Edim7', 'Gdim7', 'Bb7'],
    targetChordIndex: 3,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'Eb', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'Gb', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'A', mode: 'MAJOR', expectedProb: 0.25 }
    ]
  },
  {
    id: 'b-augmented-symmetry',
    name: 'Augmented Symmetrical Expansion',
    group: 'B',
    progression: ['C', 'Caug', 'Eaug', 'Abaug', 'F'],
    targetChordIndex: 3,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.34 },
      { root: 'E', mode: 'MAJOR', expectedProb: 0.33 },
      { root: 'Ab', mode: 'MAJOR', expectedProb: 0.33 }
    ]
  },
  {
    id: 'b-octatonic-walk',
    name: 'Octatonic Root Walk',
    group: 'B',
    progression: ['C', 'Eb', 'F#', 'A', 'C'],
    targetChordIndex: 2,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'Eb', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'Gb', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'A', mode: 'MAJOR', expectedProb: 0.25 }
    ]
  },
  {
    id: 'b-whole-tone-sequence',
    name: 'Whole-Tone Augmented Sequence',
    group: 'B',
    progression: ['Caug', 'Daug', 'Eaug', 'Gbaug'],
    targetChordIndex: 2,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.34 },
      { root: 'D', mode: 'MAJOR', expectedProb: 0.33 },
      { root: 'E', mode: 'MAJOR', expectedProb: 0.33 }
    ]
  },

  // ─── GRUPO C: AMBIGUIDADE ARTIFICIAL ───
  {
    id: 'c-sustained-oscillation',
    name: 'Sustained Two-Key Oscillation',
    group: 'C',
    progression: ['C', 'F', 'Db', 'Gb', 'C', 'F', 'Db', 'Gb'],
    targetChordIndex: 6,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'Db', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'c-pivot-equal-weight',
    name: 'Pivot Equal-Weight Transition',
    group: 'C',
    progression: ['C', 'G7', 'C', 'Eb', 'Bb7', 'Eb', 'C', 'Eb'],
    targetChordIndex: 5,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'Eb', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'c-neutral-ii-v-chain',
    name: 'Neutral ii-V key-switching chain',
    group: 'C',
    progression: ['Dm7', 'G7', 'Abm7', 'Db7', 'F#m7', 'B7', 'Cm7', 'F7'],
    targetChordIndex: 5,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'Gb', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'E', mode: 'MAJOR', expectedProb: 0.25 },
      { root: 'Bb', mode: 'MAJOR', expectedProb: 0.25 }
    ]
  },
  {
    id: 'c-tritone-alternation',
    name: 'Tritone Symmetrical alternation',
    group: 'C',
    progression: ['Cmaj7', 'F#maj7', 'Cmaj7', 'F#maj7', 'Cmaj7', 'F#maj7'],
    targetChordIndex: 3,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'F#', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },

  // ─── GRUPO D: CASOS MUSICOLÓGICOS CONTROVERSOS ───
  {
    id: 'd-tristan-chord',
    name: 'Tristan Chord Resolution',
    group: 'D',
    progression: ['Fm7b5', 'E7', 'Am'],
    targetChordIndex: 0,
    expectedTonalCenters: [
      { root: 'A', mode: 'MINOR', expectedProb: 0.50 },
      { root: 'C', mode: 'MAJOR', expectedProb: 0.30 },
      { root: 'Eb', mode: 'MAJOR', expectedProb: 0.20 }
    ]
  },
  {
    id: 'd-scriabin-mystic',
    name: 'Scriabin Promethean Mystic Chord',
    group: 'D',
    progression: ['C7#11', 'F#7#11', 'C7#11'],
    targetChordIndex: 1,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'Gb', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'd-debussy-voiles',
    name: 'Debussy Voiles Whole-Tone Symmetrical Cluster',
    group: 'D',
    progression: ['Caug', 'Daug', 'Eaug', 'F#aug', 'Abaug', 'Bbaug'],
    targetChordIndex: 3,
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR', expectedProb: 0.50 },
      { root: 'Gb', mode: 'MAJOR', expectedProb: 0.50 }
    ]
  },
  {
    id: 'd-giant-steps-cycle',
    name: 'Coltrane Giant Steps Maj3rd Cycle',
    group: 'D',
    progression: ['B', 'D7', 'G', 'Bb7', 'Eb', 'F#7', 'B'],
    targetChordIndex: 4,
    expectedTonalCenters: [
      { root: 'B', mode: 'MAJOR', expectedProb: 0.34 },
      { root: 'G', mode: 'MAJOR', expectedProb: 0.33 },
      { root: 'Eb', mode: 'MAJOR', expectedProb: 0.33 }
    ]
  }
];

function generateExpandedCorpus(): CalibrationScenario[] {
  const expanded: CalibrationScenario[] = [];
  const transpositions = [0, 1, 3, 5, 7, 8, 10]; // Transpose to 7 keys for 112 scenarios (16 * 7)

  for (const scenario of BASE_CORPUS) {
    for (const offset of transpositions) {
      if (offset === 0) {
        expanded.push(scenario);
        continue;
      }

      const originalRoot = scenario.expectedTonalCenters[0]?.root || 'C';
      const preferFlat = originalRoot.endsWith('b') || ['F', 'Bb', 'Eb', 'Ab'].includes(originalRoot);

      const transposedProgression = scenario.progression.map(ch => transposeChordSymbol(ch, offset, preferFlat));
      const transposedTonalCenters = scenario.expectedTonalCenters.map(tc => ({
        root: transposePitch(tc.root, offset, preferFlat),
        mode: tc.mode,
        expectedProb: tc.expectedProb
      }));

      expanded.push({
        id: `${scenario.id}-t${offset}`,
        name: `${scenario.name} (transposed +${offset})`,
        group: scenario.group,
        progression: transposedProgression,
        targetChordIndex: scenario.targetChordIndex,
        expectedTonalCenters: transposedTonalCenters
      });
    }
  }

  return expanded;
}

export const CALIBRATION_CORPUS = generateExpandedCorpus();
