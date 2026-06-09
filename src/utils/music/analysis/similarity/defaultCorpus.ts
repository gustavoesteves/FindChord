import type { CorpusItem } from '../models/Discovery';

export const DEFAULT_CORPUS: CorpusItem[] = [
  {
    id: 'axis_progression',
    name: 'Axis Progression (I–V–vi–IV)',
    progression: ['C', 'G', 'Am', 'F'],
    harmonicCategory: 'DIATONIC_AXIS',
    functionalCategory: 'TONIC_EXPANSION',
    sourceReference: 'Inspired by Let It Be / Pop standard',
    description: 'Diadonic axis progression commonly used for tonic prolongation and loops.'
  },
  {
    id: 'descending_modal_tetrachord',
    name: 'Descending Modal Tetrachord (i–bVII–bVI–V)',
    progression: ['Am', 'G', 'F', 'E'],
    harmonicCategory: 'PLAGAL_MOVEMENT',
    functionalCategory: 'CADENTIAL_PROGRESSION',
    sourceReference: 'Inspired by Andalusian Cadence / Hit the Road Jack',
    description: 'Phrygian tetrachord progression descending step-wise to the dominant major triad.'
  },
  {
    id: 'major_ii_v_i',
    name: 'Major ii–V–I Cadence',
    progression: ['Cmaj7', 'Dm7', 'G7', 'Cmaj7'],
    harmonicCategory: 'DIATONIC_AXIS',
    functionalCategory: 'PREDOMINANT_DOMINANT_TONIC',
    sourceReference: 'Jazz standard resolution',
    description: 'Classical and jazz primary cadence resolving predominant to dominant, then to tonic.'
  },
  {
    id: 'minor_ii_v_i',
    name: 'Minor iiø–V–i Cadence',
    progression: ['Dm7b5', 'G7', 'Cm'],
    harmonicCategory: 'DIATONIC_AXIS',
    functionalCategory: 'PREDOMINANT_DOMINANT_TONIC',
    sourceReference: 'Minor key jazz standard cadence',
    description: 'Predominant half-diminished ii resolving to dominant G7, resolving to minor i.'
  },
  {
    id: 'circle_of_fifths_chain',
    name: 'Diatonic Circle of Fifths Chain',
    progression: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7b5', 'B7', 'Em'],
    harmonicCategory: 'CIRCLE_OF_FIFTHS',
    functionalCategory: 'REGIONAL_MOTION',
    sourceReference: 'Inspired by Autumn Leaves',
    description: 'Complete cycle of fifths traversing diatonic chords in a minor key.'
  },
  {
    id: 'pachelbel_sequence',
    name: 'Pachelbel Romanesca Sequence',
    progression: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'],
    harmonicCategory: 'DIATONIC_AXIS',
    functionalCategory: 'TONIC_EXPANSION',
    sourceReference: "Inspired by Pachelbel's Canon in D",
    description: 'Classical sequence descending by fourths and rising by steps.'
  },
  {
    id: 'dominant_cycle',
    name: 'Dominant Cycle Turnaround',
    progression: ['C7', 'F7', 'G7', 'C7'],
    harmonicCategory: 'SECONDARY_DOMINANT',
    functionalCategory: 'CADENTIAL_PROGRESSION',
    sourceReference: 'Standard blues turnaround',
    description: 'Static blues or folk loop featuring dominant seventh chords.'
  },
  {
    id: 'secondary_dominant_chain',
    name: 'Secondary Dominant Chain (I–VI7–ii–V7)',
    progression: ['C', 'A7', 'Dm', 'G7'],
    harmonicCategory: 'SECONDARY_DOMINANT',
    functionalCategory: 'CADENTIAL_PROGRESSION',
    sourceReference: 'Rhythm Changes turnaround / I got rhythm',
    description: 'Tonic moving to secondary dominant A7 (V/ii), preparing Dm, resolving through G7.'
  },
  {
    id: 'deceptive_cadence',
    name: 'Deceptive Cadence (V7–vi)',
    progression: ['C', 'G7', 'Am'],
    harmonicCategory: 'DECEPTIVE_RESOLUTION',
    functionalCategory: 'INTERRUPTED_RESOLUTION',
    sourceReference: 'Classical deceptive resolution archetype',
    description: 'Dominant G7 resolving unexpectedly to submediant Am instead of tonic C.'
  },
  {
    id: 'plagal_cadence',
    name: 'Plagal Cadence (I–IV–I)',
    progression: ['C', 'F', 'C'],
    harmonicCategory: 'PLAGAL_MOVEMENT',
    functionalCategory: 'TONIC_EXPANSION',
    sourceReference: 'Amen cadence archetype',
    description: 'Tonic expanded by subdominant IV resolving directly back to tonic.'
  },
  {
    id: 'circle_of_fifths_regional',
    name: 'Regional Circle of Fifths (ii–V–I)',
    progression: ['Am', 'Dm', 'G', 'C'],
    harmonicCategory: 'CIRCLE_OF_FIFTHS',
    functionalCategory: 'CADENTIAL_PROGRESSION',
    sourceReference: 'Classical regional progression',
    description: 'Diatonic root movement by fifths resolving to tonic C major.'
  },
  {
    id: 'backdoor_dominant',
    name: 'Backdoor Dominant Resolution (iv–bVII7–I)',
    progression: ['Fm', 'Bb7', 'C'],
    harmonicCategory: 'MODAL_BORROWING',
    functionalCategory: 'PREDOMINANT_DOMINANT_TONIC',
    sourceReference: 'Jazz backdoor resolution archetype',
    description: 'Modal borrowing minor iv resolving to flat-VII dominant Bb7, resolving to tonic C.'
  },
  {
    id: 'tritone_substitution_chain',
    name: 'ii–subV7–I Chromatic Cadence',
    progression: ['Cmaj7', 'Dm7', 'Db7', 'Cmaj7'],
    harmonicCategory: 'CHROMATIC_SUBSTITUTION',
    functionalCategory: 'PREDOMINANT_DOMINANT_TONIC',
    sourceReference: 'Chromatic ii-V-I substitute standard',
    description: 'Tritone substitution of dominant G7 with Db7, resolving by half step to Cmaj7.'
  },
  {
    id: 'tritone_substitution_cadence',
    name: 'Tritone Dominant Cadence (I–subV7–I)',
    progression: ['C', 'Db7', 'C'],
    harmonicCategory: 'CHROMATIC_SUBSTITUTION',
    functionalCategory: 'CADENTIAL_PROGRESSION',
    sourceReference: 'Chromatic neighbor turnaround',
    description: 'Dominant substitute Db7 resolving chromatically downwards to tonic C.'
  },
  {
    id: 'modal_interchange_expansion',
    name: 'Modal Interchange Expansion (I–bIII–IV–I)',
    progression: ['C', 'Eb', 'F', 'C'],
    harmonicCategory: 'MODAL_BORROWING',
    functionalCategory: 'TONIC_EXPANSION',
    sourceReference: 'Classic rock chord sequence',
    description: 'Borrowing bIII (Eb) from minor parallel key, resolving via IV (F) to C.'
  }
];
