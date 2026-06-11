import type { CorpusItem } from '../models/Discovery';

export interface RealSong extends CorpusItem {
  artist?: string;
  composer?: string;
  genre: 'POPULAR' | 'WORSHIP' | 'FILM' | 'JAZZ' | 'CLASSICAL';
  keyRoot: string;
  keyMode: 'MAJOR' | 'MINOR';
}

export const REAL_REPERTOIRE_CORPUS: RealSong[] = [
  // ─── POPULAR (In-Distribution) ───────────────────────────
  {
    id: 'let-it-be',
    name: 'Let It Be',
    artist: 'The Beatles',
    genre: 'POPULAR',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C', 'Am', 'G', 'F', 'C']
  },
  {
    id: 'yesterday',
    name: 'Yesterday',
    artist: 'The Beatles',
    genre: 'POPULAR',
    keyRoot: 'F',
    keyMode: 'MAJOR',
    progression: ['F', 'Em7', 'A7', 'Dm', 'Dm7', 'Bb', 'C7', 'F']
  },
  {
    id: 'hotel-california',
    name: 'Hotel California',
    artist: 'Eagles',
    genre: 'POPULAR',
    keyRoot: 'B',
    keyMode: 'MINOR',
    progression: ['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em', 'F#']
  },
  {
    id: 'imagine',
    name: 'Imagine',
    artist: 'John Lennon',
    genre: 'POPULAR',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['C', 'Cmaj7', 'F', 'C', 'Cmaj7', 'F', 'Am', 'Dm7', 'G', 'G7']
  },
  {
    id: 'creep',
    name: 'Creep',
    artist: 'Radiohead',
    genre: 'POPULAR',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['G', 'B', 'C', 'Cm']
  },
  {
    id: 'sweet-home-alabama',
    name: 'Sweet Home Alabama',
    artist: 'Lynyrd Skynyrd',
    genre: 'POPULAR',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['D', 'C', 'G', 'D', 'C', 'G']
  },
  {
    id: 'wonderwall',
    name: 'Wonderwall',
    artist: 'Oasis',
    genre: 'POPULAR',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['Em', 'G', 'D', 'A', 'C', 'D', 'A']
  },
  {
    id: 'billie-jean',
    name: 'Billie Jean',
    artist: 'Michael Jackson',
    genre: 'POPULAR',
    keyRoot: 'F#',
    keyMode: 'MINOR',
    progression: ['F#m', 'G#m', 'A', 'G#m', 'F#m', 'G#m', 'A', 'G#m']
  },
  {
    id: 'clocks',
    name: 'Clocks',
    artist: 'Coldplay',
    genre: 'POPULAR',
    keyRoot: 'Eb',
    keyMode: 'MINOR',
    progression: ['D#m', 'Bbm', 'Bbm', 'Ab', 'Ab', 'D#m', 'Bbm', 'Bbm', 'Ab', 'Ab']
  },
  {
    id: 'shallow',
    name: 'Shallow',
    artist: 'Lady Gaga & Bradley Cooper',
    genre: 'POPULAR',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['Em', 'D', 'G', 'C', 'G', 'D', 'Em', 'D', 'G']
  },

  // ─── WORSHIP (In-Distribution) ───────────────────────────
  {
    id: 'how-great-is-our-god',
    name: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D']
  },
  {
    id: 'what-a-beautiful-name',
    name: 'What a Beautiful Name',
    artist: 'Hillsong Worship',
    genre: 'WORSHIP',
    keyRoot: 'D',
    keyMode: 'MAJOR',
    progression: ['D', 'G', 'A', 'Bm', 'A', 'G', 'Bm', 'A']
  },
  {
    id: 'way-maker',
    name: 'Way Maker',
    artist: 'Sinach',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['C', 'G', 'D', 'Em', 'C', 'G', 'D', 'Em']
  },
  {
    id: 'oceans',
    name: 'Oceans (Where Feet May Fail)',
    artist: 'Hillsong United',
    genre: 'WORSHIP',
    keyRoot: 'D',
    keyMode: 'MAJOR',
    progression: ['Bm', 'A', 'D', 'A', 'G', 'Bm', 'A', 'D', 'A', 'G']
  },
  {
    id: '10000-reasons',
    name: '10,000 Reasons',
    artist: 'Matt Redman',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['C', 'G', 'D', 'Em', 'C', 'G', 'D', 'G']
  },
  {
    id: 'amazing-grace-my-chains-are-gone',
    name: 'Amazing Grace (My Chains Are Gone)',
    artist: 'Chris Tomlin',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['G', 'C', 'G', 'D', 'G', 'C', 'G', 'D', 'G']
  },
  {
    id: 'reckless-love',
    name: 'Reckless Love',
    artist: 'Cory Asbury',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['Em', 'D', 'C', 'G', 'Em', 'D', 'C', 'G']
  },
  {
    id: 'great-are-you-lord',
    name: 'Great Are You Lord',
    artist: 'All Sons & Daughters',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['C', 'Em', 'D', 'C', 'Em', 'D']
  },
  {
    id: 'good-good-father',
    name: 'Good Good Father',
    artist: 'Chris Tomlin',
    genre: 'WORSHIP',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['G', 'C', 'G', 'Am', 'D', 'G', 'C', 'G', 'Am', 'D']
  },
  {
    id: 'cornerstone',
    name: 'Cornerstone',
    artist: 'Hillsong Worship',
    genre: 'WORSHIP',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['C', 'F', 'Am', 'G', 'C', 'F', 'Am', 'G']
  },

  // ─── FILM (Moderately OOD) ───────────────────────────────
  {
    id: 'star-wars-main-theme',
    name: 'Star Wars Main Theme',
    composer: 'John Williams',
    genre: 'FILM',
    keyRoot: 'Bb',
    keyMode: 'MAJOR',
    progression: ['Bb', 'F', 'Eb', 'Dm', 'Cm', 'Bb', 'F']
  },
  {
    id: 'time-inception',
    name: 'Time (Inception)',
    composer: 'Hans Zimmer',
    genre: 'FILM',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['Am', 'Em', 'G', 'D', 'Am', 'Em', 'C', 'G']
  },
  {
    id: 'he-is-a-pirate',
    name: 'He\'s a Pirate (Pirates of the Caribbean)',
    composer: 'Klaus Badelt & Hans Zimmer',
    genre: 'FILM',
    keyRoot: 'D',
    keyMode: 'MINOR',
    progression: ['Dm', 'Bb', 'Am', 'Dm', 'Bb', 'C', 'Dm']
  },
  {
    id: 'merry-go-round-of-life',
    name: 'Merry-Go-Round of Life (Howl\'s Moving Castle)',
    composer: 'Joe Hisaishi',
    genre: 'FILM',
    keyRoot: 'G',
    keyMode: 'MINOR',
    progression: ['Gm', 'Adim', 'D7', 'Gm', 'Eb', 'Cm', 'D7', 'Gm']
  },
  {
    id: 'jurassic-park-theme',
    name: 'Jurassic Park Theme',
    composer: 'John Williams',
    genre: 'FILM',
    keyRoot: 'Bb',
    keyMode: 'MAJOR',
    progression: ['Bb', 'Eb', 'Bb', 'Eb', 'Bb', 'F', 'Bb', 'Eb', 'Bb', 'F']
  },
  {
    id: 'nuvole-bianche',
    name: 'Nuvole Bianche',
    composer: 'Ludovico Einaudi',
    genre: 'FILM',
    keyRoot: 'Ab',
    keyMode: 'MAJOR',
    progression: ['Fm', 'Db', 'Ab', 'Eb', 'Fm', 'Db', 'Ab', 'Eb']
  },
  {
    id: 'always-with-me',
    name: 'Always With Me (Spirited Away)',
    composer: 'Yumi Kimura',
    genre: 'FILM',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['C', 'G', 'Am', 'Em', 'F', 'C', 'Dm', 'G']
  },
  {
    id: 'comptine-d-un-autre-ete',
    name: 'Comptine d\'un autre été (Amélie)',
    composer: 'Yann Tiersen',
    genre: 'FILM',
    keyRoot: 'Em',
    keyMode: 'MINOR',
    progression: ['Em', 'G', 'Bm', 'D', 'Em', 'G', 'Bm', 'D']
  },
  {
    id: 'first-step-interstellar',
    name: 'First Step (Interstellar)',
    composer: 'Hans Zimmer',
    genre: 'FILM',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G']
  },
  {
    id: 'superman-theme',
    name: 'Superman Main Theme',
    composer: 'John Williams',
    genre: 'FILM',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['C', 'F', 'G', 'C', 'F', 'G', 'Ab', 'Bb', 'C']
  },

  // ─── JAZZ (Fortemente OOD) ───────────────────────────────
  {
    id: 'all-the-things-you-are',
    name: 'All The Things You Are',
    composer: 'Jerome Kern',
    genre: 'JAZZ',
    keyRoot: 'Ab',
    keyMode: 'MAJOR',
    progression: ['Fm7', 'Bbm7', 'Eb7', 'Abmaj7', 'Dbmaj7', 'G7', 'Cmaj7']
  },
  {
    id: 'autumn-leaves-jazz',
    name: 'Autumn Leaves',
    composer: 'Joseph Kosma',
    genre: 'JAZZ',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7b5', 'B7', 'Em']
  },
  {
    id: 'take-five',
    name: 'Take Five',
    composer: 'Paul Desmond',
    genre: 'JAZZ',
    keyRoot: 'Eb',
    keyMode: 'MINOR',
    progression: ['Ebm7', 'Bbm7', 'Ebm7', 'Bbm7', 'Abm7', 'Bbm7', 'Ebm7']
  },
  {
    id: 'fly-me-to-the-moon',
    name: 'Fly Me to the Moon',
    composer: 'Bart Howard',
    genre: 'JAZZ',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7']
  },
  {
    id: 'so-what',
    name: 'So What',
    composer: 'Miles Davis',
    genre: 'JAZZ',
    keyRoot: 'D',
    keyMode: 'MINOR',
    progression: ['Dm7', 'Em7', 'Dm7', 'Em7', 'Ebm7', 'Fm7', 'Ebm7', 'Fm7']
  },
  {
    id: 'blue-bossa',
    name: 'Blue Bossa',
    composer: 'Kenny Dorham',
    genre: 'JAZZ',
    keyRoot: 'C',
    keyMode: 'MINOR',
    progression: ['Cm7', 'Fm7', 'Dm7b5', 'G7', 'Cm7', 'Ebm7', 'Ab7', 'Dbmaj7']
  },
  {
    id: 'tune-up',
    name: 'Tune Up',
    composer: 'Miles Davis',
    genre: 'JAZZ',
    keyRoot: 'D',
    keyMode: 'MAJOR',
    progression: ['Em7', 'A7', 'Dmaj7', 'Dm7', 'G7', 'Cmaj7', 'Cm7', 'F7', 'Bbmaj7']
  },
  {
    id: 'girl-from-ipanema',
    name: 'The Girl from Ipanema',
    composer: 'Antonio Carlos Jobim',
    genre: 'JAZZ',
    keyRoot: 'F',
    keyMode: 'MAJOR',
    progression: ['Fmaj7', 'G7', 'Gm7', 'Gb7', 'Fmaj7', 'Gb7']
  },
  {
    id: 'misty',
    name: 'Misty',
    composer: 'Erroll Garner',
    genre: 'JAZZ',
    keyRoot: 'Eb',
    keyMode: 'MAJOR',
    progression: ['Ebmaj7', 'Bbm7', 'Eb7', 'Abmaj7', 'Abm7', 'Db7', 'Ebmaj7', 'Cm7', 'Fm7', 'Bb7']
  },
  {
    id: 'all-of-me',
    name: 'All of Me',
    composer: 'Gerald Marks',
    genre: 'JAZZ',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['Cmaj7', 'E7', 'A7', 'Dm7', 'E7', 'Am7', 'D7', 'Dm7', 'G7']
  },

  // ─── CLASSICAL (Fortemente OOD) ──────────────────────────
  {
    id: 'canon-in-d',
    name: 'Canon in D',
    composer: 'Johann Pachelbel',
    genre: 'CLASSICAL',
    keyRoot: 'D',
    keyMode: 'MAJOR',
    progression: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A']
  },
  {
    id: 'prelude-in-c',
    name: 'Prelude in C (BWV 846)',
    composer: 'Johann Sebastian Bach',
    genre: 'CLASSICAL',
    keyRoot: 'C',
    keyMode: 'MAJOR',
    progression: ['C', 'Dm7', 'G7', 'C', 'Am', 'D7', 'G', 'C']
  },
  {
    id: 'nocturne-op9-no2',
    name: 'Nocturne Op. 9 No. 2',
    composer: 'Frédéric Chopin',
    genre: 'CLASSICAL',
    keyRoot: 'Eb',
    keyMode: 'MAJOR',
    progression: ['Eb', 'Fm', 'Bb7', 'Eb', 'Ab', 'Eb', 'Bb7', 'Eb']
  },
  {
    id: 'ode-to-joy',
    name: 'Ode to Joy',
    composer: 'Ludwig van Beethoven',
    genre: 'CLASSICAL',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['G', 'G', 'D', 'G', 'D', 'G', 'D', 'G']
  },
  {
    id: 'minuet-in-g',
    name: 'Minuet in G (BWV Anh. 114)',
    composer: 'Christian Petzold',
    genre: 'CLASSICAL',
    keyRoot: 'G',
    keyMode: 'MAJOR',
    progression: ['G', 'C', 'D', 'G', 'Em', 'Am', 'D', 'G']
  },
  {
    id: 'prelude-in-e-minor',
    name: 'Prelude in E Minor (Op. 28 No. 4)',
    composer: 'Frédéric Chopin',
    genre: 'CLASSICAL',
    keyRoot: 'E',
    keyMode: 'MINOR',
    progression: ['Em', 'F#m7b5', 'B7', 'Em', 'Am', 'B7', 'Em']
  },
  {
    id: 'gymnopedie-no1',
    name: 'Gymnopédie No. 1',
    composer: 'Erik Satie',
    genre: 'CLASSICAL',
    keyRoot: 'D',
    keyMode: 'MAJOR',
    progression: ['Gmaj7', 'Dmaj7', 'Gmaj7', 'Dmaj7', 'Em7', 'Bm7', 'Cmaj7', 'D7']
  },
  {
    id: 'moonlight-sonata',
    name: 'Moonlight Sonata (1st movement)',
    composer: 'Ludwig van Beethoven',
    genre: 'CLASSICAL',
    keyRoot: 'C#',
    keyMode: 'MINOR',
    progression: ['C#m', 'C#m', 'A', 'F#m', 'G#7', 'C#m']
  },
  {
    id: 'lacrimosa',
    name: 'Lacrimosa (Requiem)',
    composer: 'Wolfgang Amadeus Mozart',
    genre: 'CLASSICAL',
    keyRoot: 'D',
    keyMode: 'MINOR',
    progression: ['Dm', 'Bb', 'E7', 'Am', 'Dm', 'A7', 'Dm']
  },
  {
    id: 'spring-four-seasons',
    name: 'Spring (The Four Seasons)',
    composer: 'Antonio Vivaldi',
    genre: 'CLASSICAL',
    keyRoot: 'E',
    keyMode: 'MAJOR',
    progression: ['E', 'E', 'B', 'E', 'B', 'E', 'B', 'E']
  }
];
