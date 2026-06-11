export interface DiscoveryScenario {
  id: string;
  name: string;
  group: 'G' | 'H' | 'I'; // G = Tonal Control, H = Post-Tonal Frontier, I = Hybrid Emergent
  progression: string[];
  targetChordIndex: number;
}

export const EMERGENT_THEORY_CORPUS: DiscoveryScenario[] = [
  // ─── GRUPO G: CONTROLE TONAL CLÁSSICO (Alta Adequabilidade TAS, Baixo TFI) ───
  {
    id: 'dt-g1',
    name: 'Bach Cadence I',
    group: 'G',
    progression: ['C', 'F', 'G7', 'C'],
    targetChordIndex: 2 // G7
  },
  {
    id: 'dt-g2',
    name: 'Mozart Turnaround I',
    group: 'G',
    progression: ['C', 'Am', 'Dm', 'G7', 'C'],
    targetChordIndex: 3 // G7
  },
  {
    id: 'dt-g3',
    name: 'Pachelbel Sequence',
    group: 'G',
    progression: ['C', 'G/B', 'Am', 'Em/G', 'F', 'C/E', 'Dm', 'G7', 'C'],
    targetChordIndex: 7 // G7
  },
  {
    id: 'dt-g4',
    name: 'Tonal V7-I in G',
    group: 'G',
    progression: ['G', 'C', 'D7', 'G'],
    targetChordIndex: 2 // D7
  },
  {
    id: 'dt-g5',
    name: 'Tonal V7-I in A',
    group: 'G',
    progression: ['A', 'D', 'E7', 'A'],
    targetChordIndex: 2 // E7
  },
  {
    id: 'dt-g6',
    name: 'Deceptive Resolution Control',
    group: 'G',
    progression: ['C', 'F', 'G', 'Am'],
    targetChordIndex: 2 // G
  },
  {
    id: 'dt-g7',
    name: 'Jazz ii-V-I in C',
    group: 'G',
    progression: ['Dm', 'G7', 'Cmaj7'],
    targetChordIndex: 1 // G7
  },
  {
    id: 'dt-g8',
    name: 'Jazz ii-V-I in D',
    group: 'G',
    progression: ['Em', 'A7', 'Dmaj7'],
    targetChordIndex: 1 // A7
  },
  {
    id: 'dt-g9',
    name: 'Minor Cadence Control',
    group: 'G',
    progression: ['Am', 'Dm', 'E7', 'Am'],
    targetChordIndex: 2 // E7
  },
  {
    id: 'dt-g10',
    name: 'Pop Turnaround Control',
    group: 'G',
    progression: ['C', 'Am', 'F', 'G'],
    targetChordIndex: 3 // G
  },

  // ─── GRUPO H: FRONTEIRA PÓS-TONAL (Baixa Adequabilidade TAS, Alto TFI) ───
  {
    id: 'dt-h1',
    name: 'Tristan Chord Original',
    group: 'H',
    progression: ['Fm7b5', 'E7', 'Am'],
    targetChordIndex: 0 // Fm7b5
  },
  {
    id: 'dt-h2',
    name: 'Tristan Transposition',
    group: 'H',
    progression: ['Bbm7b5', 'A7', 'Dm'],
    targetChordIndex: 0 // Bbm7b5
  },
  {
    id: 'dt-h3',
    name: 'Scriabin Mystic Chord Root',
    group: 'H',
    progression: ['C7#11', 'F#7#11'],
    targetChordIndex: 0 // C7#11
  },
  {
    id: 'dt-h4',
    name: 'Scriabin Mystic Chord Transposed',
    group: 'H',
    progression: ['G7#11', 'Db7#11'],
    targetChordIndex: 0 // G7#11
  },
  {
    id: 'dt-h5',
    name: 'Debussy Whole-Tone (Voiles) I',
    group: 'H',
    progression: ['Caug', 'Daug', 'Eaug', 'Gbaug'],
    targetChordIndex: 1 // Daug
  },
  {
    id: 'dt-h6',
    name: 'Debussy Whole-Tone (Voiles) II',
    group: 'H',
    progression: ['Faug', 'Gaug', 'Aaug', 'Baug'],
    targetChordIndex: 1 // Gaug
  },
  {
    id: 'dt-h7',
    name: 'Stravinsky Petrushka Polychord I',
    group: 'H',
    progression: ['C', 'Gb', 'C', 'Gb'],
    targetChordIndex: 1 // Gb
  },
  {
    id: 'dt-h8',
    name: 'Stravinsky Petrushka Polychord II',
    group: 'H',
    progression: ['F', 'B', 'F', 'B'],
    targetChordIndex: 1 // B
  },
  {
    id: 'dt-h9',
    name: 'Post-Tonal Atonal Cluster',
    group: 'H',
    progression: ['Caug', 'F#7#11', 'Bbm7b5'],
    targetChordIndex: 1 // F#7#11
  },
  {
    id: 'dt-h10',
    name: 'Whole-Tone Symmetry Cluster',
    group: 'H',
    progression: ['Caug', 'Eaug', 'Abaug'],
    targetChordIndex: 1 // Eaug
  },

  // ─── GRUPO I: PADRÕES HÍBRIDOS (Alto Desacordo Escolar, Alta Coesão, Alto ETS/EFI) ───
  {
    id: 'dt-i1',
    name: 'Coltrane Changes I',
    group: 'I',
    progression: ['B', 'D7', 'G', 'Bb7', 'Eb'],
    targetChordIndex: 2 // G
  },
  {
    id: 'dt-i2',
    name: 'Coltrane Changes II',
    group: 'I',
    progression: ['Eb', 'F#7', 'B', 'D7', 'G'],
    targetChordIndex: 2 // B
  },
  {
    id: 'dt-i3',
    name: 'Coltrane Changes III',
    group: 'I',
    progression: ['G', 'Bb7', 'Eb', 'F#7', 'B'],
    targetChordIndex: 2 // Eb
  },
  {
    id: 'dt-i4',
    name: 'Modal Mixture Minor Subdominant',
    group: 'I',
    progression: ['C', 'Fm', 'C'],
    targetChordIndex: 1 // Fm
  },
  {
    id: 'dt-i5',
    name: 'Modal Mixture Flat-Submediant',
    group: 'I',
    progression: ['C', 'Ab', 'Bb', 'C'],
    targetChordIndex: 1 // Ab
  },
  {
    id: 'dt-i6',
    name: 'Tritone Substitution Resolution',
    group: 'I',
    progression: ['C', 'Db7', 'C'],
    targetChordIndex: 1 // Db7
  },
  {
    id: 'dt-i7',
    name: 'Secondary Dominant Chain',
    group: 'I',
    progression: ['C', 'A7', 'D7', 'G7', 'C'],
    targetChordIndex: 2 // D7
  },
  {
    id: 'dt-i8',
    name: 'Neapolitan Chord Resolution',
    group: 'I',
    progression: ['C', 'Db', 'G7', 'C'],
    targetChordIndex: 1 // Db
  },
  {
    id: 'dt-i9',
    name: 'Minor Plagal Deceptive Turn',
    group: 'I',
    progression: ['C', 'Am', 'F', 'Fm', 'C'],
    targetChordIndex: 3 // Fm
  },
  {
    id: 'dt-i10',
    name: 'Lendvai Axis turnaround',
    group: 'I',
    progression: ['C', 'Eb', 'F#', 'A', 'C'],
    targetChordIndex: 2 // F#
  }
];
