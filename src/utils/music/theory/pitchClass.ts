export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const MODES: ('MAJOR' | 'MINOR')[] = ['MAJOR', 'MINOR'];

export const ALL_24_KEYS: { root: string; mode: 'MAJOR' | 'MINOR' }[] = [];
for (const root of PITCH_CLASSES) {
  for (const mode of MODES) {
    ALL_24_KEYS.push({ root, mode });
  }
}

export function getKeyString(center: { root: string; mode: 'MAJOR' | 'MINOR' }): string {
  return `${center.root} ${center.mode}`;
}

export const ROOT_CHROMAS: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

export function getChroma(root: string): number {
  const normalized = root.trim();
  if (ROOT_CHROMAS[normalized] !== undefined) {
    return ROOT_CHROMAS[normalized];
  }
  return 0;
}
