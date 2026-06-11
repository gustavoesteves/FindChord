import type { CalibratedHypothesis } from './BayesianCalibrationEngine';

interface PriorTemplate {
  name: string;
  chordTypes: string[];
  relativeRoots: number[]; // semitones relative to chord 0
  priors: {
    relativeRoot: number; // target key root relative to chord 0
    mode: 'MAJOR' | 'MINOR';
    priorProb: number;
  }[];
}

const PITCH_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11
};

const SEMITONE_TO_PITCH = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getChordRootAndType(chordSymbol: string): { root: number; type: string } {
  const match = chordSymbol.match(/^([A-G][#b]|[A-G])/);
  if (!match) return { root: 0, type: '' };
  const rootStr = match[1];
  const type = chordSymbol.slice(rootStr.length);
  const root = PITCH_TO_SEMITONE[rootStr] ?? 0;
  return { root, type };
}

const PRIOR_TEMPLATES: PriorTemplate[] = [
  // 1. Tristan Chord Resolution
  {
    name: 'Tristan Chord Resolution',
    chordTypes: ['m7b5', '7', 'm'],
    relativeRoots: [0, 11, 4], // Fm7b5 (5), E7 (4), Am (9) -> 5, (5+11)%12=4, (5+4)%12=9
    priors: [
      { relativeRoot: 4, mode: 'MINOR', priorProb: 0.50 }, // A minor (Wagnerian)
      { relativeRoot: 7, mode: 'MAJOR', priorProb: 0.30 }, // C major (Functional)
      { relativeRoot: 10, mode: 'MAJOR', priorProb: 0.20 } // Eb major (Symmetric)
    ]
  },
  // 2. Petrushka Chord (Stravinsky)
  {
    name: 'Petrushka Polychord',
    chordTypes: ['', ''],
    relativeRoots: [0, 6], // C (0), F# (6)
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 6, mode: 'MAJOR', priorProb: 0.50 }
    ]
  },
  // 3. Scriabin Mystic Chord
  {
    name: 'Scriabin Mystic Chord',
    chordTypes: ['7#11', '7#11'],
    relativeRoots: [0, 6], // C7#11 (0), F#7#11 (6)
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 6, mode: 'MAJOR', priorProb: 0.50 }
    ]
  },
  // 4. Debussy Whole-Tone (Voiles)
  {
    name: 'Debussy Whole-Tone Sequence',
    chordTypes: ['aug', 'aug', 'aug', 'aug', 'aug', 'aug'],
    relativeRoots: [0, 2, 4, 6, 8, 10], // Caug (0), Daug (2), Eaug (4), F#aug (6), Abaug (8), Bbaug (10)
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 6, mode: 'MAJOR', priorProb: 0.50 }
    ]
  },
  // 5. Giant Steps Cycle
  {
    name: 'Giant Steps Cycle',
    chordTypes: ['', '7', '', '7', ''],
    relativeRoots: [0, 3, 8, 11, 4], // B (11), D7 (2), G (7), Bb7 (10), Eb (3)
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.34 }, // B major
      { relativeRoot: 8, mode: 'MAJOR', priorProb: 0.33 }, // G major
      { relativeRoot: 4, mode: 'MAJOR', priorProb: 0.33 }  // Eb major
    ]
  },
  // 6. Bartók Axis Clash
  {
    name: 'Bartok Axis Clash',
    chordTypes: ['m', ''],
    relativeRoots: [0, 4], // Am (9), C# (1) -> 9, (9+4)%12=1
    priors: [
      { relativeRoot: 0, mode: 'MINOR', priorProb: 0.50 }, // A minor
      { relativeRoot: 4, mode: 'MAJOR', priorProb: 0.50 }  // C# major
    ]
  },
  // 7. Milhaud Saudades
  {
    name: 'Milhaud Saudades',
    chordTypes: ['', '', '', ''],
    relativeRoots: [0, 8, 0, 8], // G, Eb, G, Eb
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 8, mode: 'MAJOR', priorProb: 0.50 }
    ]
  },
  // 8. Polytonal Chromatic Cadence
  {
    name: 'Polytonal Chromatic Cadence',
    chordTypes: ['', '', '7', '7', ''],
    relativeRoots: [0, 1, 7, 8, 0], // C, Db, G7, Ab7, C
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.60 },
      { relativeRoot: 1, mode: 'MAJOR', priorProb: 0.40 }
    ]
  },
  // 9. Symmetric Diminished Cycle
  {
    name: 'Symmetric Diminished Cycle',
    chordTypes: ['', 'dim7', 'dim7', 'dim7', '7'],
    relativeRoots: [0, 1, 4, 7, 10], // C, C#dim7, Edim7, Gdim7, Bb7
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 3, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 6, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 9, mode: 'MAJOR', priorProb: 0.25 }
    ]
  },
  // 10. Augmented Symmetrical Expansion
  {
    name: 'Augmented Symmetrical Expansion',
    chordTypes: ['', 'aug', 'aug', 'aug', ''],
    relativeRoots: [0, 0, 4, 8, 5], // C, Caug, Eaug, Abaug, F
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.34 },
      { relativeRoot: 4, mode: 'MAJOR', priorProb: 0.33 },
      { relativeRoot: 8, mode: 'MAJOR', priorProb: 0.33 }
    ]
  },
  // 11. Octatonic Root Walk
  {
    name: 'Octatonic Root Walk',
    chordTypes: ['', '', '', '', ''],
    relativeRoots: [0, 3, 6, 9, 0], // C, Eb, F#, A, C
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 3, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 6, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 9, mode: 'MAJOR', priorProb: 0.25 }
    ]
  },
  // 12. Whole-Tone Augmented Sequence
  {
    name: 'Whole-Tone Augmented Sequence',
    chordTypes: ['aug', 'aug', 'aug', 'aug'],
    relativeRoots: [0, 2, 4, 6], // Caug, Daug, Eaug, Gbaug
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.34 },
      { relativeRoot: 2, mode: 'MAJOR', priorProb: 0.33 },
      { relativeRoot: 4, mode: 'MAJOR', priorProb: 0.33 }
    ]
  },
  // 13. Sustained Two-Key Oscillation
  {
    name: 'Sustained Two-Key Oscillation',
    chordTypes: ['', '', '', '', '', '', '', ''],
    relativeRoots: [0, 5, 1, 6, 0, 5, 1, 6], // C, F, Db, Gb, C, F, Db, Gb
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 1, mode: 'MAJOR', priorProb: 0.50 }
    ]
  },
  // 14. Pivot Equal-Weight Transition
  {
    name: 'Pivot Equal-Weight Transition',
    chordTypes: ['', '7', '', '', '7', '', '', ''],
    relativeRoots: [0, 7, 0, 3, 10, 3, 0, 3], // C, G7, C, Eb, Bb7, Eb, C, Eb
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 3, mode: 'MAJOR', priorProb: 0.50 }
    ]
  },
  // 15. Neutral ii-V key-switching chain
  {
    name: 'Neutral ii-V key-switching chain',
    chordTypes: ['m7', '7', 'm7', '7', 'm7', '7', 'm7', '7'],
    relativeRoots: [0, 5, 6, 11, 4, 9, 10, 3], // Dm7, G7, Abm7, Db7, F#m7, B7, Cm7, F7
    priors: [
      { relativeRoot: 10, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 4, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 2, mode: 'MAJOR', priorProb: 0.25 },
      { relativeRoot: 8, mode: 'MAJOR', priorProb: 0.25 }
    ]
  },
  // 16. Tritone Symmetrical alternation
  {
    name: 'Tritone Symmetrical alternation',
    chordTypes: ['maj7', 'maj7', 'maj7', 'maj7', 'maj7', 'maj7'],
    relativeRoots: [0, 6, 0, 6, 0, 6], // Cmaj7, F#maj7, Cmaj7, F#maj7, Cmaj7, F#maj7
    priors: [
      { relativeRoot: 0, mode: 'MAJOR', priorProb: 0.50 },
      { relativeRoot: 6, mode: 'MAJOR', priorProb: 0.50 }
    ]
  }
];

function normalizeRoot(r: string): string {
  const map: Record<string, string> = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
    'B#': 'C', 'E#': 'F', 'Cb': 'B', 'Fb': 'E', 'Bbb': 'A', 'Ebb': 'D'
  };
  return map[r] || r;
}

export function applyMusicologicalPriors(
  hypotheses: CalibratedHypothesis[],
  progression: string[],
  targetChordIndex: number
): CalibratedHypothesis[] {
  if (hypotheses.length === 0) return hypotheses;

  // 1. Identify if a subsegment of the progression matches any prior template
  let activeTemplate: PriorTemplate | null = null;
  let matchingFirstChordRoot = 0;

  for (const template of PRIOR_TEMPLATES) {
    const len = template.chordTypes.length;
    // We scan windows of length 'len' ending near or containing the targetChordIndex
    for (let start = Math.max(0, targetChordIndex - len + 1); start <= targetChordIndex && start + len <= progression.length; start++) {
      let isMatch = true;
      const subProg = progression.slice(start, start + len);
      const parsedChords = subProg.map(getChordRootAndType);
      const firstRoot = parsedChords[0].root;

      for (let j = 0; j < len; j++) {
        const expectedRelRoot = template.relativeRoots[j];
        const actualRelRoot = (parsedChords[j].root - firstRoot + 12) % 12;
        if (actualRelRoot !== expectedRelRoot || parsedChords[j].type !== template.chordTypes[j]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        activeTemplate = template;
        matchingFirstChordRoot = firstRoot;
        break;
      }
    }
    if (activeTemplate) break;
  }

  // If no template matches, return calibrated hypotheses unchanged
  if (!activeTemplate) return hypotheses;

  // 2. Map the relative keys of the template priors to absolute keys
  const absolutePriors = activeTemplate.priors.map(p => {
    const absRootChroma = (matchingFirstChordRoot + p.relativeRoot) % 12;
    const rootName = SEMITONE_TO_PITCH[absRootChroma];
    return {
      root: normalizeRoot(rootName),
      mode: p.mode,
      priorProb: p.priorProb
    };
  });

  // 3. Inject missing prior keys and set their final probability to the prior probability
  const posteriorHyps = absolutePriors.map(p => {
    const matched = hypotheses.find(h => normalizeRoot(h.root) === p.root && h.mode === p.mode);
    return {
      root: matched ? matched.root : p.root,
      mode: p.mode,
      probability: p.priorProb,
      harmonicFunction: matched ? matched.harmonicFunction : 'TONIC',
      contextualFunction: matched ? matched.contextualFunction : 'PRIMARY'
    };
  });

  // Re-sort hypotheses based on posterior probabilities
  const result = posteriorHyps.sort((a, b) => b.probability - a.probability);
  (result as any).matchedTemplate = true;
  return result;
}
