export type DisagreementLevel = 'BAIXO' | 'MODERADO' | 'ALTO' | 'HISTORICO_PERSISTENTE';

export interface ADCEntry {
  id: string;
  name: string;
  progression: string[];
  targetChordIndex: number;
  disagreementLevel: DisagreementLevel;
  expectedADI: number; // reference Analyst Disagreement Index
  expectedCFS: number; // reference Consensus Fragility Score
  expectedOntologyConflict: boolean;
  schoolPerspectives: {
    school: string;
    interpretation: string;
    description: string;
  }[];
}

export const ANALYTICAL_DISAGREEMENT_CORPUS: ADCEntry[] = [
  {
    id: 'adc-tristan',
    name: 'Tristan Chord Resolution',
    progression: ['Fm7b5', 'E7', 'Am'],
    targetChordIndex: 0,
    disagreementLevel: 'HISTORICO_PERSISTENTE',
    expectedADI: 1.2,
    expectedCFS: 0.8,
    expectedOntologyConflict: true,
    schoolPerspectives: [
      { school: 'functionalism', interpretation: 'iv6 alterado em Lá menor', description: 'Acorde com sexta francesa ou lâmica alterada.' },
      { school: 'schenkerian', interpretation: 'Prolongamento da tônica Lá menor', description: 'Acorde de passagem linear conectando a tônica à dominante.' },
      { school: 'neo-riemannian', interpretation: 'L-Transform cromático', description: 'Movimento linear de condução de vozes cromáticas.' },
      { school: 'set-theory', interpretation: 'Forte 4-27', description: 'Coleção intervalar simétrica sem centro tonal.' }
    ]
  },
  {
    id: 'adc-mystic',
    name: 'Scriabin Mystic Chord',
    progression: ['C7#11', 'F#7#11'],
    targetChordIndex: 0,
    disagreementLevel: 'HISTORICO_PERSISTENTE',
    expectedADI: 1.0,
    expectedCFS: 0.8,
    expectedOntologyConflict: true,
    schoolPerspectives: [
      { school: 'jazz-cst', interpretation: 'C Lídio Dominante', description: 'Acorde dominante com quarta aumentada e sétima menor.' },
      { school: 'set-theory', interpretation: 'Forte 6-34', description: 'Conjunto místico hexafônico não-diatônico.' }
    ]
  },
  {
    id: 'adc-voiles',
    name: 'Debussy Whole-Tone sequence (Voiles)',
    progression: ['Caug', 'Daug', 'Eaug', 'Gbaug'],
    targetChordIndex: 1,
    disagreementLevel: 'ALTO',
    expectedADI: 0.8,
    expectedCFS: 0.75,
    expectedOntologyConflict: true,
    schoolPerspectives: [
      { school: 'set-theory', interpretation: 'Forte 6-35', description: 'Coleção inteiramente hexatônica/tons inteiros.' },
      { school: 'neo-riemannian', interpretation: 'Simetria de Tons Inteiros', description: 'Ausência de centro diatônico, puramente geométrico.' }
    ]
  },
  {
    id: 'adc-petrushka',
    name: 'Petrushka Chord Polychord',
    progression: ['C', 'Gb', 'C', 'Gb'],
    targetChordIndex: 1,
    disagreementLevel: 'ALTO',
    expectedADI: 0.9,
    expectedCFS: 0.8,
    expectedOntologyConflict: true,
    schoolPerspectives: [
      { school: 'jazz-cst', interpretation: 'Bitonalidade C/Gb', description: 'Superposição de duas tríades maiores a uma distância de trítono.' },
      { school: 'set-theory', interpretation: 'Forte 8-28 (Octatônica)', description: 'Subconjunto da escala octatônica simétrica.' }
    ]
  },
  {
    id: 'adc-giant-steps',
    name: 'Coltrane Giant Steps',
    progression: ['B', 'D7', 'G', 'Bb7', 'Eb'],
    targetChordIndex: 2,
    disagreementLevel: 'MODERADO',
    expectedADI: 0.45,
    expectedCFS: 0.4,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'jazz-cst', interpretation: 'Tonalidade de Sol Maior', description: 'Resolução clássica V-I em Sol Maior dentro de ciclo.' },
      { school: 'neo-riemannian', interpretation: 'Ciclos Hexatônicos de Terça Maior', description: 'Transição simétrica dividindo a oitava em 3 partes.' }
    ]
  },
  {
    id: 'adc-bartok-axis',
    name: 'Bartok Axis Clash',
    progression: ['Am', 'C#', 'Am', 'C#'],
    targetChordIndex: 1,
    disagreementLevel: 'MODERADO',
    expectedADI: 0.5,
    expectedCFS: 0.5,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'axis-theory', interpretation: 'Eixo da Tônica (A-C#)', description: 'Ambas as notas funcionam como tônica no sistema de eixos.' },
      { school: 'functionalism', interpretation: 'Tonalidade paralela menor/maior', description: 'Flutuação entre a homônima maior e menor.' }
    ]
  },
  {
    id: 'adc-milhaud',
    name: 'Milhaud Saudades do Brasil',
    progression: ['G', 'Eb', 'G', 'Eb'],
    targetChordIndex: 1,
    disagreementLevel: 'ALTO',
    expectedADI: 0.7,
    expectedCFS: 0.6,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'functionalism', interpretation: 'Modulação abrupta I - bVI', description: 'Movimento cromático de terceira maior descendente.' },
      { school: 'axis-theory', interpretation: 'Eixo de Tônica/Subdominante', description: 'Eixos polares concorrentes em Milhaud.' }
    ]
  },
  {
    id: 'adc-jazz-turnaround',
    name: 'Standard Jazz Turnaround',
    progression: ['Cmaj7', 'A7', 'Dm7', 'G7'],
    targetChordIndex: 2,
    disagreementLevel: 'BAIXO',
    expectedADI: 0.1,
    expectedCFS: 0.1,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'functionalism', interpretation: 'ii em Dó Maior', description: 'Acorde supertônica preparando a dominante.' },
      { school: 'jazz-cst', interpretation: 'D Dórico / Dm7', description: 'Acorde de segundo grau na escala de Dó maior.' }
    ]
  },
  {
    id: 'adc-bach-cadence',
    name: 'Classic Bach Cadence',
    progression: ['C', 'F', 'G7', 'C'],
    targetChordIndex: 2,
    disagreementLevel: 'BAIXO',
    expectedADI: 0.05,
    expectedCFS: 0.05,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'functionalism', interpretation: 'Dominante V7', description: 'Cadência autêntica perfeita sob a tônica C.' }
    ]
  },
  {
    id: 'adc-diminished-symmetry',
    name: 'Symmetric Diminished Cycle',
    progression: ['C', 'C#dim7', 'Edim7', 'Gdim7', 'Bb7'],
    targetChordIndex: 2,
    disagreementLevel: 'MODERADO',
    expectedADI: 0.4,
    expectedCFS: 0.35,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'functionalism', interpretation: 'V9/V com raiz omitida', description: 'Função dominante secundária diatônica.' },
      { school: 'axis-theory', interpretation: 'Eixo Dominante Octatônico', description: 'Simetria de eixos dominantes separados por terça menor.' }
    ]
  },
  {
    id: 'adc-whole-tone',
    name: 'Whole-Tone Augmented Sequence',
    progression: ['Caug', 'Daug', 'Eaug', 'Gbaug'],
    targetChordIndex: 3,
    disagreementLevel: 'ALTO',
    expectedADI: 0.85,
    expectedCFS: 0.7,
    expectedOntologyConflict: true,
    schoolPerspectives: [
      { school: 'set-theory', interpretation: 'Coleção 6-35', description: 'Coleção de tons inteiros.' }
    ]
  },
  {
    id: 'adc-polytonal-chromatic',
    name: 'Polytonal Chromatic Cadence',
    progression: ['C', 'Db', 'G7', 'Ab7', 'C'],
    targetChordIndex: 1,
    disagreementLevel: 'ALTO',
    expectedADI: 0.75,
    expectedCFS: 0.65,
    expectedOntologyConflict: false,
    schoolPerspectives: [
      { school: 'functionalism', interpretation: 'Neapolitana / Subdominante alterada', description: 'Acorde de segunda menor napolitana.' },
      { school: 'jazz-cst', interpretation: 'Bitonalidade paralela C/Db', description: 'Cadência por substituto de trítono e modulação paralela.' }
    ]
  }
];
