export interface AdversarialScenario {
  id: string;
  name: string;
  level: number;
  progression: string[];
  targetChordIndex: number;
  expectedTonalCenters: { root: string; mode: 'MAJOR' | 'MINOR' }[];
  expectedHarmonicFunctions: ('TONIC' | 'SUBDOMINANT' | 'DOMINANT')[];
  expectedContextualFunctions?: string[];
  expectedNarrativeKeywords?: string[];
  perturbedProgressions: { progression: string[]; targetChordIndex: number }[];
}

export const ADVERSARIAL_HARMONY_CORPUS: AdversarialScenario[] = [
  // ─── LEVEL 1: TONALIDADE EXTREMA (BACH / MODULAÇÕES ENCADEADAS) ───
  {
    id: 'l1-bach-circle',
    name: 'Bach Modulating Circle',
    level: 1,
    progression: ['C', 'F', 'Bdim', 'E7', 'Am', 'D7', 'G', 'C7', 'F'],
    targetChordIndex: 4, // 'Am'
    expectedTonalCenters: [
      { root: 'A', mode: 'MINOR' },
      { root: 'C', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT'],
    expectedNarrativeKeywords: ['tônica', 'diatônica', 'c'],
    perturbedProgressions: [
      { progression: ['Cmaj7', 'Fmaj7', 'Bdim', 'E7', 'Am', 'D7', 'G', 'C7', 'F'], targetChordIndex: 4 }
    ]
  },
  {
    id: 'l1-pivot-modulation',
    name: 'Pivot distant modulation',
    level: 1,
    progression: ['C', 'Am', 'Dm', 'G7', 'C', 'Ab7', 'Db', 'Gb', 'Db'],
    targetChordIndex: 6, // 'Db'
    expectedTonalCenters: [
      { root: 'Db', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'CHROMATIC_APPROACH'],
    expectedNarrativeKeywords: ['centro tonal', 'db', 'maior'],
    perturbedProgressions: [
      { progression: ['C', 'Am7', 'Dm7', 'G7', 'C', 'Ab7', 'Dbmaj7', 'Gbmaj7', 'Dbmaj7'], targetChordIndex: 6 }
    ]
  },

  // ─── LEVEL 2: AMBIGUIDADE FUNCIONAL (DIMINUTOS / AUMENTADOS SIMÉTRICOS) ───
  {
    id: 'l2-diminished-symmetry',
    name: 'Symmetric Diminished 7th Ambiguity',
    level: 2,
    progression: ['C', 'D#dim7', 'Em'],
    targetChordIndex: 1, // 'D#dim7'
    expectedTonalCenters: [
      { root: 'E', mode: 'MINOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['DOMINANT', 'SUBDOMINANT', 'TONIC'],
    expectedContextualFunctions: ['SECONDARY_LEADING_TONE', 'PASSING_DIMINISHED', 'COMMON_TONE_DIMINISHED'],
    expectedNarrativeKeywords: ['diminuto', 'aproximação', 'dominante'],
    perturbedProgressions: [
      { progression: ['C', 'Ebdim7', 'Em'], targetChordIndex: 1 }
    ]
  },
  {
    id: 'l2-augmented-triad',
    name: 'Augmented Triad Resolution Ambiguity',
    level: 2,
    progression: ['C', 'Caug', 'F'],
    targetChordIndex: 1, // 'Caug'
    expectedTonalCenters: [
      { root: 'F', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'MODAL_BORROWING', 'SECONDARY_DOMINANT'],
    expectedNarrativeKeywords: ['aumentado', 'dominante', 'tônica'],
    perturbedProgressions: [
      { progression: ['C', 'Caug', 'Fmaj7'], targetChordIndex: 1 }
    ]
  },

  // ─── LEVEL 3: MODALIDADE HÍBRIDA/EXPANDIDA (DEBUSSY / TONS INTEIROS) ───
  {
    id: 'l3-backdoor-cadence',
    name: 'Backdoor Borrowing Mixolydian/Dorian',
    level: 3,
    progression: ['C', 'Fm', 'Bb7', 'C'],
    targetChordIndex: 2, // 'Bb7'
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MINOR' }
    ],
    expectedHarmonicFunctions: ['SUBDOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['MODAL_BORROWING', 'PRIMARY', 'TRITONE_SUBSTITUTION'],
    expectedNarrativeKeywords: ['emprestado', 'paralelo', 'subdominante', 'dominante'],
    perturbedProgressions: [
      { progression: ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7'], targetChordIndex: 2 }
    ]
  },
  {
    id: 'l3-modal-lydian-axis',
    name: 'Modal Lydian Axis Shift',
    level: 3,
    progression: ['C', 'D', 'Bm', 'C'],
    targetChordIndex: 1, // 'D'
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['DOMINANT', 'SUBDOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'MODAL_BORROWING'],
    expectedNarrativeKeywords: ['diatônica', 'c', 'dominante'],
    perturbedProgressions: [
      { progression: ['Cmaj7', 'D7', 'Bm7', 'Cmaj7'], targetChordIndex: 1 }
    ]
  },

  // ─── LEVEL 4: HARMONIA SIMÉTRICA (SCRIABIN / ACORDE MÍSTICO) ───
  {
    id: 'l4-mystic-tritone',
    name: 'Mystic Chord Tritone Shift',
    level: 4,
    progression: ['C', 'C7#11', 'F#7#11', 'C'],
    targetChordIndex: 2, // 'F#7#11'
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'Gb', mode: 'MAJOR' },
      { root: 'F#', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['DOMINANT', 'TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['TRITONE_SUBSTITUTION', 'CHROMATIC_APPROACH', 'PRIMARY'],
    expectedNarrativeKeywords: ['diatônica', 'c', 'dominante'],
    perturbedProgressions: [
      { progression: ['C', 'C7', 'Gb7', 'C'], targetChordIndex: 2 }
    ]
  },
  {
    id: 'l4-augmented-fourth-symmetry',
    name: 'Augmented Fourth Symmetrical Loop',
    level: 4,
    progression: ['C', 'F#', 'C', 'F#'],
    targetChordIndex: 1, // 'F#'
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'F#', mode: 'MAJOR' },
      { root: 'Gb', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'DOMINANT', 'SUBDOMINANT'],
    expectedContextualFunctions: ['CHROMATIC_APPROACH', 'PRIMARY'],
    expectedNarrativeKeywords: ['diatônica', 'c', 'subdominante'],
    perturbedProgressions: [
      { progression: ['Cmaj7', 'Gbmaj7', 'Cmaj7', 'Gbmaj7'], targetChordIndex: 1 }
    ]
  },

  // ─── LEVEL 5: MODULAÇÃO EXTREMA (COLTRANE CHANGES) ───
  {
    id: 'l5-giant-steps',
    name: 'Giant Steps Maj3rd Cycle',
    level: 5,
    progression: ['B', 'D7', 'G', 'Bb7', 'Eb', 'Am7', 'D7', 'G'],
    targetChordIndex: 4, // 'Eb'
    expectedTonalCenters: [
      { root: 'Eb', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'B', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'MODAL_BORROWING'],
    expectedNarrativeKeywords: ['tônica', 'diatônica', 'eb'],
    perturbedProgressions: [
      { progression: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Am7', 'D7', 'Gmaj7'], targetChordIndex: 4 }
    ]
  },
  {
    id: 'l5-countdown-fifths',
    name: 'Countdown Coltrane Modulations',
    level: 5,
    progression: ['Em7', 'F7', 'Bbmaj7', 'Db7', 'Gbmaj7', 'A7', 'Dmaj7'],
    targetChordIndex: 4, // 'Gbmaj7'
    expectedTonalCenters: [
      { root: 'Gb', mode: 'MAJOR' },
      { root: 'Bb', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT'],
    expectedNarrativeKeywords: ['tônica', 'diatônica', 'gb'],
    perturbedProgressions: [
      { progression: ['Em7', 'F7', 'Bbmaj7', 'Db7', 'Gb7M', 'A7', 'D7M'], targetChordIndex: 4 }
    ]
  },

  // ─── LEVEL 6: POLITONALIDADE E POLICORDES ───
  {
    id: 'l6-petrushka-chord',
    name: 'Petrushka Chord Polytonal Loop',
    level: 6,
    progression: ['C', 'F#', 'C', 'F#', 'Am'],
    targetChordIndex: 1, // 'F#'
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'Gb', mode: 'MAJOR' },
      { root: 'F#', mode: 'MAJOR' },
      { root: 'A', mode: 'MINOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'SUBDOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['CHROMATIC_APPROACH', 'PRIMARY'],
    expectedNarrativeKeywords: ['diatônica', 'c', 'subdominante'],
    perturbedProgressions: [
      { progression: ['Cmaj7', 'Gb', 'Cmaj7', 'Gb', 'Am7'], targetChordIndex: 1 }
    ]
  },
  {
    id: 'l6-polychord-clash',
    name: 'Polychord Clash Superimposition',
    level: 6,
    progression: ['C', 'Db', 'C', 'Db'],
    targetChordIndex: 1, // 'Db'
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'Db', mode: 'MAJOR' }
    ],
    expectedHarmonicFunctions: ['TONIC', 'SUBDOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['CHROMATIC_APPROACH', 'PRIMARY', 'MODAL_BORROWING'],
    expectedNarrativeKeywords: ['bii', 'emprestado', 'c'],
    perturbedProgressions: [
      { progression: ['Cmaj7', 'Dbmaj7', 'Cmaj7', 'Dbmaj7'], targetChordIndex: 1 }
    ]
  }
];
