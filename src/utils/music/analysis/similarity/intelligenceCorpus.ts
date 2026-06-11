export interface IntelligenceSong {
  id: string;
  name: string;
  genre: 'JAZZ' | 'CLASSICAL' | 'FILM' | 'WORSHIP';
  progression: string[];
  expectedTonalCenters: { root: string; mode: 'MAJOR' | 'MINOR' }[];
  expectedFunctions: ('TONIC' | 'SUBDOMINANT' | 'DOMINANT')[];
  expectedContextualFunctions: string[];
  isChain?: boolean;
}

export const INTELLIGENCE_CORPUS: IntelligenceSong[] = [
  // ─── JAZZ STANDARDS ───────────────────────────────────────
  {
    id: 'autumn-leaves-intel',
    name: 'Autumn Leaves (Section)',
    genre: 'JAZZ',
    progression: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7b5', 'B7', 'Em'],
    expectedTonalCenters: [
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY']
  },
  {
    id: 'all-the-things-intel',
    name: 'All The Things You Are (Intro/A)',
    genre: 'JAZZ',
    progression: ['Fm7', 'Bbm7', 'Eb7', 'Abmaj7', 'Dbmaj7', 'G7', 'Cmaj7'],
    expectedTonalCenters: [
      { root: 'Ab', mode: 'MAJOR' },
      { root: 'Ab', mode: 'MAJOR' },
      { root: 'Ab', mode: 'MAJOR' },
      { root: 'Ab', mode: 'MAJOR' },
      { root: 'F', mode: 'MINOR' },
      { root: 'F', mode: 'MINOR' },
      { root: 'F', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'SECONDARY_DOMINANT']
  },
  {
    id: 'blue-bossa-intel',
    name: 'Blue Bossa (Main)',
    genre: 'JAZZ',
    progression: ['Cm7', 'Fm7', 'Dm7b5', 'G7', 'Cm7', 'Ebm7', 'Ab7', 'Dbmaj7', 'Dm7b5', 'G7', 'Cm7'],
    expectedTonalCenters: [
      { root: 'C', mode: 'MINOR' },
      { root: 'C', mode: 'MINOR' },
      { root: 'C', mode: 'MINOR' },
      { root: 'C', mode: 'MINOR' },
      { root: 'C', mode: 'MINOR' },
      { root: 'Eb', mode: 'MINOR' },
      { root: 'Eb', mode: 'MINOR' },
      { root: 'Eb', mode: 'MINOR' },
      { root: 'Eb', mode: 'MAJOR' },
      { root: 'Eb', mode: 'MAJOR' },
      { root: 'Eb', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'SUBDOMINANT', 'SUBDOMINANT', 'DOMINANT', 'TONIC', 'TONIC', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY']
  },
  {
    id: 'girl-from-ipanema-intel',
    name: 'The Girl from Ipanema (A Section)',
    genre: 'JAZZ',
    progression: ['Fmaj7', 'G7', 'Gm7', 'Gb7', 'Fmaj7', 'Gb7'],
    expectedTonalCenters: [
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'MODAL_BORROWING', 'PRIMARY', 'TRITONE_SUBSTITUTION', 'PRIMARY', 'CHROMATIC_APPROACH']
  },
  {
    id: 'chain-dominants-intel',
    name: 'Chain Dominants Loop',
    genre: 'JAZZ',
    progression: ['C', 'E7', 'A7', 'D7', 'G7', 'C'],
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'DOMINANT', 'DOMINANT', 'DOMINANT', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'SECONDARY_DOMINANT', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY'],
    isChain: true
  },

  // ─── BACH CHORALES ────────────────────────────────────────
  {
    id: 'bach-chorale-1-intel',
    name: 'Bach Chorale 1 (Diatonic)',
    genre: 'CLASSICAL',
    progression: ['G', 'D7', 'Em', 'Bm', 'C', 'G', 'Am', 'D7', 'G'],
    expectedTonalCenters: [
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'TONIC', 'TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY']
  },
  {
    id: 'bach-chorale-2-intel',
    name: 'Bach Chorale 2 (Linear Bass)',
    genre: 'CLASSICAL',
    progression: ['C', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G7', 'C'],
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'TONIC', 'TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY']
  },
  {
    id: 'bach-chorale-3-intel',
    name: 'Bach Chorale 3 (Minor Key)',
    genre: 'CLASSICAL',
    progression: ['Am', 'E7', 'Am', 'Dm', 'G7', 'C', 'F', 'Bdim', 'E7', 'Am'],
    expectedTonalCenters: [
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'DOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY']
  },
  {
    id: 'bach-chorale-secondary-intel',
    name: 'Bach Chorale (Secondary Dominants)',
    genre: 'CLASSICAL',
    progression: ['C', 'A7', 'Dm', 'B7', 'Em', 'C7', 'F', 'G7', 'C'],
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT', 'TONIC', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'PRIMARY']
  },
  {
    id: 'bach-secondary-leading-intel',
    name: 'Bach Chorale (Secondary Leading Tones)',
    genre: 'CLASSICAL',
    progression: ['Am', 'G#dim', 'Am', 'F#dim', 'G', 'D#dim', 'Em'],
    expectedTonalCenters: [
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'D', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' }
    ],
    expectedFunctions: ['SUBDOMINANT', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_LEADING_TONE', 'PRIMARY', 'SECONDARY_LEADING_TONE', 'PRIMARY', 'SECONDARY_LEADING_TONE', 'PRIMARY']
  },

  // ─── FILM MUSIC ───────────────────────────────────────────
  {
    id: 'time-zimmer-intel',
    name: 'Time (Hans Zimmer)',
    genre: 'FILM',
    progression: ['Am', 'Em', 'G', 'D', 'Am', 'Em', 'C', 'G'],
    expectedTonalCenters: [
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' },
      { root: 'E', mode: 'MINOR' }
    ],
    expectedFunctions: ['SUBDOMINANT', 'TONIC', 'TONIC', 'SUBDOMINANT', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY']
  },
  {
    id: 'merry-go-round-intel',
    name: 'Merry-Go-Round of Life',
    genre: 'FILM',
    progression: ['Gm', 'A7', 'D7', 'Gm', 'Eb', 'Cm', 'D7', 'Gm'],
    expectedTonalCenters: [
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'DOMINANT', 'TONIC', 'SUBDOMINANT', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'SECONDARY_DOMINANT', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY']
  },
  {
    id: 'star-wars-theme-intel',
    name: 'Star Wars Theme',
    genre: 'FILM',
    progression: ['Bb', 'F', 'Eb', 'Dm', 'Cm', 'Bb', 'F'],
    expectedTonalCenters: [
      { root: 'Bb', mode: 'MAJOR' },
      { root: 'Bb', mode: 'MAJOR' },
      { root: 'Bb', mode: 'MAJOR' },
      { root: 'Bb', mode: 'MAJOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' },
      { root: 'G', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY']
  },
  {
    id: 'inception-dream-intel',
    name: 'Inception Dream Modulation',
    genre: 'FILM',
    progression: ['Am', 'F', 'C', 'G', 'Dm', 'Bb', 'F', 'C'],
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'D', mode: 'MINOR' },
      { root: 'D', mode: 'MINOR' },
      { root: 'D', mode: 'MINOR' },
      { root: 'D', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'SUBDOMINANT', 'TONIC', 'DOMINANT', 'TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY']
  },

  // ─── WORSHIP MODULATIONS ──────────────────────────────────
  {
    id: 'truck-driver-modulation-intel',
    name: 'Worship Modulation (Step Up)',
    genre: 'WORSHIP',
    progression: ['G', 'C', 'D', 'G', 'A', 'D', 'E', 'A'],
    expectedTonalCenters: [
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' },
      { root: 'D', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC', 'DOMINANT', 'TONIC', 'DOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY']
  },
  {
    id: 'relative-modulation-worship-intel',
    name: 'Relative Modulation Loop',
    genre: 'WORSHIP',
    progression: ['G', 'D', 'Em', 'C', 'G', 'D', 'Am', 'C', 'Em', 'D', 'C', 'G'],
    expectedTonalCenters: [
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'G', mode: 'MAJOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' }
    ],
    expectedFunctions: ['TONIC', 'DOMINANT', 'TONIC', 'SUBDOMINANT', 'TONIC', 'DOMINANT', 'TONIC', 'TONIC', 'DOMINANT', 'DOMINANT', 'TONIC', 'SUBDOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY', 'PRIMARY']
  },
  {
    id: 'modal-borrowing-worship-intel',
    name: 'Modal Borrowing (Worship Style)',
    genre: 'WORSHIP',
    progression: ['C', 'Fm', 'C', 'Bb', 'F', 'Fm', 'C'],
    expectedTonalCenters: [
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'C', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT'],
    expectedContextualFunctions: ['PRIMARY', 'MODAL_BORROWING', 'PRIMARY', 'PRIMARY', 'PRIMARY', 'MODAL_BORROWING', 'PRIMARY']
  },
  {
    id: 'neapolitan-borrowing-worship-intel',
    name: 'Neapolitan Chord Loop',
    genre: 'WORSHIP',
    progression: ['Am', 'Dm', 'Bb', 'E7', 'Am'],
    expectedTonalCenters: [
      { root: 'A', mode: 'MINOR' },
      { root: 'A', mode: 'MINOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' },
      { root: 'F', mode: 'MAJOR' }
    ],
    expectedFunctions: ['TONIC', 'SUBDOMINANT', 'SUBDOMINANT', 'DOMINANT', 'TONIC'],
    expectedContextualFunctions: ['PRIMARY', 'PRIMARY', 'PRIMARY', 'SECONDARY_DOMINANT', 'PRIMARY']
  }
];
