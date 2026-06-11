export interface CounterfactualScenario {
  id: string;
  name: string;
  group: 'E' | 'F'; // E = Robust Consensus, F = Minimal Change / High Sensitivity
  progression: string[];
  targetChordIndex: number;
  expectedISS: number; // expected Global ISS
  expectedSIS: number; // expected Semantic Stability Score
  expectedPIS: number; // expected Probabilistic Stability Score
  expectedICR: number; // expected Interpretive Causal Robustness Score
  causalChords: string[]; // names of expected causal chords
}

export const COUNTERFACTUAL_HARMONY_CORPUS: CounterfactualScenario[] = [
  // ─── GRUPO E: CONSENSO EXTREMAMENTE ROBUSTO (Música Tonal Tradicional) ───
  {
    id: 'cf-bach-cadence',
    name: 'Classic Bach Cadence',
    group: 'E',
    progression: ['C', 'F', 'G7', 'C'],
    targetChordIndex: 2, // G7
    expectedISS: 0.96,
    expectedSIS: 1.0,
    expectedPIS: 0.92,
    expectedICR: 0.95,
    causalChords: ['G7', 'C']
  },
  {
    id: 'cf-mozart-turnaround',
    name: 'Classical Mozart Turnaround',
    group: 'E',
    progression: ['C', 'Am', 'Dm', 'G7', 'C'],
    targetChordIndex: 3, // G7
    expectedISS: 0.95,
    expectedSIS: 1.0,
    expectedPIS: 0.90,
    expectedICR: 0.94,
    causalChords: ['G7', 'C']
  },

  // ─── GRUPO F: MUDANÇA MÍNIMA COM EFEITO MÁXIMO (Sensíveis / Ambíguos) ───
  {
    id: 'cf-tristan',
    name: 'Tristan Chord Resolution',
    group: 'F',
    progression: ['Fm7b5', 'E7', 'Am'],
    targetChordIndex: 0, // Fm7b5
    expectedISS: 0.45,
    expectedSIS: 0.35,
    expectedPIS: 0.55,
    expectedICR: 0.25,
    causalChords: ['Fm7b5', 'E7']
  },
  {
    id: 'cf-giant-steps',
    name: 'Coltrane Giant Steps',
    group: 'F',
    progression: ['B', 'D7', 'G', 'Bb7', 'Eb'],
    targetChordIndex: 2, // G
    expectedISS: 0.52,
    expectedSIS: 0.45,
    expectedPIS: 0.59,
    expectedICR: 0.35,
    causalChords: ['D7', 'G', 'Bb7']
  },
  {
    id: 'cf-mystic',
    name: 'Scriabin Mystic Chord',
    group: 'F',
    progression: ['C7#11', 'F#7#11'],
    targetChordIndex: 0, // C7#11
    expectedISS: 0.55,
    expectedSIS: 0.50,
    expectedPIS: 0.60,
    expectedICR: 0.35,
    causalChords: ['C7#11', 'F#7#11']
  },
  {
    id: 'cf-voiles',
    name: 'Debussy Whole-Tone (Voiles)',
    group: 'F',
    progression: ['Caug', 'Daug', 'Eaug', 'Gbaug'],
    targetChordIndex: 1, // Daug
    expectedISS: 0.50,
    expectedSIS: 0.40,
    expectedPIS: 0.60,
    expectedICR: 0.30,
    causalChords: ['Caug', 'Gbaug']
  },
  {
    id: 'cf-petrushka',
    name: 'Petrushka Chord Polychord',
    group: 'F',
    progression: ['C', 'Gb', 'C', 'Gb'],
    targetChordIndex: 1, // Gb
    expectedISS: 0.48,
    expectedSIS: 0.40,
    expectedPIS: 0.56,
    expectedICR: 0.28,
    causalChords: ['C', 'Gb']
  }
];
