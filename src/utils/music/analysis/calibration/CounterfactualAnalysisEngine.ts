const PITCH_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11
};

const SEMITONE_TO_PITCH = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getRootAndSuffix(chordSymbol: string): { root: string; suffix: string } {
  const match = chordSymbol.match(/^([A-G][#b]|[A-G])/);
  if (!match) return { root: 'C', suffix: '' };
  const root = match[1];
  const suffix = chordSymbol.slice(root.length);
  return { root, suffix };
}

function transposeRoot(root: string, semitones: number): string {
  const current = PITCH_TO_SEMITONE[root] ?? 0;
  const target = (current + semitones + 12) % 12;
  return SEMITONE_TO_PITCH[target];
}

export function removeChord(progression: string[], index: number): string[] {
  if (progression.length <= 1) return [...progression];
  return progression.filter((_, i) => i !== index);
}

export function substituteFunctional(progression: string[], index: number): string[] {
  const newProg = [...progression];
  const chord = progression[index];
  if (!chord) return newProg;

  const { root, suffix } = getRootAndSuffix(chord);
  
  let newChord = chord;
  // Rule-based functional substitutions
  if (suffix === '7') {
    // V7 -> vii°7 (Dominant function swap)
    newChord = transposeRoot(root, 4) + 'dim7';
  } else if (suffix === 'm7' || suffix === 'm') {
    // ii or vi -> IV or I (Subdominant/Tonic swap: minor to relative major)
    newChord = transposeRoot(root, 3) + suffix.replace('m', '');
  } else if (suffix === '' || suffix === 'maj7') {
    // I or IV -> vi or ii (Tonic/Subdominant swap: major to relative minor)
    newChord = transposeRoot(root, 9) + 'm' + suffix.replace('maj', '');
  } else {
    // Fallback: shift root by a minor third
    newChord = transposeRoot(root, 3) + suffix;
  }

  newProg[index] = newChord;
  return newProg;
}

export function substituteModal(progression: string[], index: number): string[] {
  const newProg = [...progression];
  const chord = progression[index];
  if (!chord) return newProg;

  const { root, suffix } = getRootAndSuffix(chord);
  
  let newChord = chord;
  // Diatonic minor to homonymous major, major to homonymous minor
  if (suffix.startsWith('m')) {
    newChord = root + suffix.slice(1); // remove 'm'
  } else {
    newChord = root + 'm' + suffix; // add 'm'
  }

  newProg[index] = newChord;
  return newProg;
}

export function substituteTritone(progression: string[], index: number): string[] {
  const newProg = [...progression];
  const chord = progression[index];
  if (!chord) return newProg;

  const { root, suffix } = getRootAndSuffix(chord);
  // Tritone shift is 6 semitones
  const newRoot = transposeRoot(root, 6);
  // Dominant quality tritone sub (ensure it has dominant suffix)
  const newChord = newRoot + (suffix.includes('7') ? suffix : '7');

  newProg[index] = newChord;
  return newProg;
}

export interface PerturbationResult {
  type: 'remove' | 'substitute' | 'modal' | 'tritone';
  progression: string[];
  perturbedIndex: number;
}

export function generateAllPerturbations(progression: string[], index: number): PerturbationResult[] {
  const results: PerturbationResult[] = [];
  
  if (progression.length > 1) {
    results.push({
      type: 'remove',
      progression: removeChord(progression, index),
      perturbedIndex: index
    });
  }

  results.push({
    type: 'substitute',
    progression: substituteFunctional(progression, index),
    perturbedIndex: index
  });

  results.push({
    type: 'modal',
    progression: substituteModal(progression, index),
    perturbedIndex: index
  });

  results.push({
    type: 'tritone',
    progression: substituteTritone(progression, index),
    perturbedIndex: index
  });

  return results;
}
