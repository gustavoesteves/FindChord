export function isDominantType(quality: string): boolean {
  return quality.startsWith('dominant');
}

export function isMinorType(quality: string): boolean {
  return (
    quality.includes('minor') ||
    quality === 'halfDiminished' ||
    quality === 'diminished' ||
    quality === 'diminished7th'
  );
}

export function isMajorType(quality: string): boolean {
  return (
    quality === 'major' ||
    quality === 'major7th' ||
    quality === 'major9th' ||
    quality === 'major13th' ||
    quality === 'major6th' ||
    quality === 'add9' ||
    quality === '69'
  );
}

export function isDiminishedType(quality: string): boolean {
  return (
    quality === 'diminished' ||
    quality === 'diminished7th' ||
    quality === 'halfDiminished'
  );
}

export function getQualitySuffix(quality: string): string {
  const map: Record<string, string> = {
    'major': '',
    'minor': '',
    'major7th': 'maj7',
    'minor7th': 'm7',
    'dominant7th': '7',
    'halfDiminished': 'm7(b5)',
    'diminished': '°',
    'diminished7th': '°7',
    'augmented': '+',
    'major9th': 'maj9',
    'minor9th': 'm9',
    'dominant9th': '9',
    'minor11th': 'm11',
    'dominant11th': '11',
    'major13th': 'maj13',
    'minor13th': 'm13',
    'dominant13th': '13',
    'dominant7b9': '7(b9)',
    'dominant7#9': '7(#9)',
    'dominant7#11': '7(#11)',
    'dominant7b13': '7(b13)',
    'dominant7sus4': '7sus4',
    'major7#11': 'maj7(#11)',
    'major6th': '6',
    'minor6th': 'm6',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'add9': 'add9',
    'minorMajor7th': 'm(maj7)',
    '69': '69'
  };
  return map[quality] ?? '';
}
