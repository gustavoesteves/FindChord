export const DEGREE_MAP: Record<number, number> = {
  0: 1, // I
  1: 2, // bII
  2: 2, // II
  3: 3, // bIII
  4: 3, // III
  5: 4, // IV
  6: 4, // #IV
  7: 5, // V
  8: 6, // bVI
  9: 6, // VI
  10: 7, // bVII
  11: 7  // VII
};

export function getDiatonicDegree(offset: number): number {
  return DEGREE_MAP[offset] ?? 1;
}

export function getScaleDegreeOffset(degree: string): number {
  const clean = degree.replace(/[0-9]/g, '').replace(/maj|min|dim|aug|m/g, '').trim();
  const match = clean.match(/^(b|#)?(VIII|VII|III|II|IV|VI|V|I)/i);
  if (!match) return 0;
  const prefix = match[1];
  const roman = match[2].toUpperCase();
  
  let baseOffset = 0;
  switch (roman) {
    case 'I': baseOffset = 0; break;
    case 'II': baseOffset = 2; break;
    case 'III': baseOffset = 4; break;
    case 'IV': baseOffset = 5; break;
    case 'V': baseOffset = 7; break;
    case 'VI': baseOffset = 9; break;
    case 'VII': baseOffset = 11; break;
  }
  
  if (prefix === 'b') {
    baseOffset = (baseOffset - 1 + 12) % 12;
  } else if (prefix === '#') {
    baseOffset = (baseOffset + 1) % 12;
  }
  
  return baseOffset;
}

export function getDiatonicTargetDegree(offset: number, mode: 'MAJOR' | 'MINOR'): string | null {
  if (mode === 'MAJOR') {
    const map: Record<number, string> = {
      0: 'I',
      2: 'ii',
      4: 'iii',
      5: 'IV',
      7: 'V',
      9: 'vi',
      11: 'vii°'
    };
    return map[offset] ?? null;
  } else {
    const map: Record<number, string> = {
      0: 'i',
      2: 'ii°',
      3: 'bIII',
      5: 'iv',
      7: 'V', // standard secondary resolution to dominant V in minor keys is capital V
      8: 'bVI',
      10: 'bVII',
      11: 'vii°'
    };
    return map[offset] ?? null;
  }
}
