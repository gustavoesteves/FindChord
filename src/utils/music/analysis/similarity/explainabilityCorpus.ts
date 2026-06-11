export interface ExplainabilityScenario {
  id: string;
  name: string;
  progression: string[];
  targetChordIndex: number;
  expectedTonalCenter: { root: string; mode: 'MAJOR' | 'MINOR' };
  expectedHarmonicFunction: 'TONIC' | 'SUBDOMINANT' | 'DOMINANT';
  expectedContextualFunction?: string;
  expectedNarrativeKeywords: string[];
  expectedDominantFeature: 'scoreGap' | 'goalAlignment' | 'geometry' | 'informationGain';
  expectedRanking: string[];
}

// 10 Dicionários de Tons Maiores
const MAJOR_KEYS: Record<string, Record<string, string>> = {
  'C': { I: 'C', ii: 'Dm', iii: 'Em', IV: 'F', V: 'G', vi: 'Am', vii: 'Bdim', iv: 'Fm', bVI: 'Ab', bVII: 'Bb', bII: 'Db', 'V7/ii': 'A7', 'V7/V': 'D7', 'V7/vi': 'E7' },
  'G': { I: 'G', ii: 'Am', iii: 'Bm', IV: 'C', V: 'D', vi: 'Em', vii: 'F#dim', iv: 'Cm', bVI: 'Eb', bVII: 'F', bII: 'Ab', 'V7/ii': 'E7', 'V7/V': 'A7', 'V7/vi': 'B7' },
  'D': { I: 'D', ii: 'Em', iii: 'F#m', IV: 'G', V: 'A', vi: 'Bm', vii: 'C#dim', iv: 'Gm', bVI: 'Bb', bVII: 'C', bII: 'Eb', 'V7/ii': 'B7', 'V7/V': 'E7', 'V7/vi': 'F#7' },
  'A': { I: 'A', ii: 'Bm', iii: 'C#m', IV: 'D', V: 'E', vi: 'F#m', vii: 'G#dim', iv: 'Dm', bVI: 'F', bVII: 'G', bII: 'Bb', 'V7/ii': 'F#7', 'V7/V': 'B7', 'V7/vi': 'C#7' },
  'E': { I: 'E', ii: 'F#m', iii: 'G#m', IV: 'A', V: 'B', vi: 'C#m', vii: 'D#dim', iv: 'Am', bVI: 'C', bVII: 'D', bII: 'F', 'V7/ii': 'C#7', 'V7/V': 'F#7', 'V7/vi': 'G#7' },
  'F': { I: 'F', ii: 'Gm', iii: 'Am', IV: 'Bb', V: 'C', vi: 'Dm', vii: 'Edim', iv: 'Bbm', bVI: 'Db', bVII: 'Eb', bII: 'Gb', 'V7/ii': 'D7', 'V7/V': 'G7', 'V7/vi': 'A7' },
  'Bb': { I: 'Bb', ii: 'Cm', iii: 'Dm', IV: 'Eb', V: 'F', vi: 'Gm', vii: 'Adim', iv: 'Ebm', bVI: 'Gb', bVII: 'Ab', bII: 'Cb', 'V7/ii': 'G7', 'V7/V': 'C7', 'V7/vi': 'D7' },
  'Eb': { I: 'Eb', ii: 'Fm', iii: 'Gm', IV: 'Ab', V: 'Bb', vi: 'Cm', vii: 'Ddim', iv: 'Abm', bVI: 'Cb', bVII: 'Db', bII: 'Fb', 'V7/ii': 'C7', 'V7/V': 'F7', 'V7/vi': 'G7' },
  'Ab': { I: 'Ab', ii: 'Bbm', iii: 'Cm', IV: 'Db', V: 'Eb', vi: 'Fm', vii: 'Gdim', iv: 'Dbm', bVI: 'Fb', bVII: 'Gb', bII: 'A', 'V7/ii': 'F7', 'V7/V': 'Bb7', 'V7/vi': 'C7' },
  'Db': { I: 'Db', ii: 'Ebm', iii: 'Fm', IV: 'Gb', V: 'Ab', vi: 'Bbm', vii: 'Cdim', iv: 'Gbm', bVI: 'A', bVII: 'Cb', bII: 'D', 'V7/ii': 'Bb7', 'V7/V': 'Eb7', 'V7/vi': 'F7' }
};

// 10 Dicionários de Tons Menores
const MINOR_KEYS: Record<string, Record<string, string>> = {
  'A': { i: 'Am', ii: 'Bdim', bIII: 'C', iv: 'Dm', V: 'E', V7: 'E7', bVI: 'F', bVII: 'G', bII: 'Bb', 'V7/iv': 'A7', 'V7/bVI': 'C7', 'V7/bVII': 'D7' },
  'E': { i: 'Em', ii: 'F#dim', bIII: 'G', iv: 'Am', V: 'B', V7: 'B7', bVI: 'C', bVII: 'D', bII: 'F', 'V7/iv': 'E7', 'V7/bVI': 'G7', 'V7/bVII': 'A7' },
  'B': { i: 'Bm', ii: 'C#dim', bIII: 'D', iv: 'Em', V: 'F#', V7: 'F#7', bVI: 'G', bVII: 'A', bII: 'C', 'V7/iv': 'B7', 'V7/bVI': 'D7', 'V7/bVII': 'E7' },
  'F#': { i: 'F#m', ii: 'G#dim', bIII: 'A', iv: 'Bm', V: 'C#', V7: 'C#7', bVI: 'D', bVII: 'E', bII: 'G', 'V7/iv': 'F#7', 'V7/bVI': 'A7', 'V7/bVII': 'B7' },
  'C#': { i: 'C#m', ii: 'D#dim', bIII: 'E', iv: 'F#m', V: 'G#', V7: 'G#7', bVI: 'A', bVII: 'B', bII: 'D', 'V7/iv': 'C#7', 'V7/bVI': 'E7', 'V7/bVII': 'F#7' },
  'D': { i: 'Dm', ii: 'Edim', bIII: 'F', iv: 'Gm', V: 'A', V7: 'A7', bVI: 'Bb', bVII: 'C', bII: 'Eb', 'V7/iv': 'D7', 'V7/bVI': 'F7', 'V7/bVII': 'G7' },
  'G': { i: 'Gm', ii: 'Adim', bIII: 'Bb', iv: 'Cm', V: 'D', V7: 'D7', bVI: 'Eb', bVII: 'F', bII: 'Ab', 'V7/iv': 'G7', 'V7/bVI': 'Bb7', 'V7/bVII': 'C7' },
  'C': { i: 'Cm', ii: 'Ddim', bIII: 'Eb', iv: 'Fm', V: 'G', V7: 'G7', bVI: 'Ab', bVII: 'Bb', bII: 'Db', 'V7/iv': 'C7', 'V7/bVI': 'Eb7', 'V7/bVII': 'F7' },
  'F': { i: 'Fm', ii: 'Gdim', bIII: 'Ab', iv: 'Bbm', V: 'C', V7: 'C7', bVI: 'Db', bVII: 'Eb', bII: 'Gb', 'V7/iv': 'F7', 'V7/bVI': 'Ab7', 'V7/bVII': 'Bb7' },
  'Bb': { i: 'Bbm', ii: 'Cdim', bIII: 'Db', iv: 'Ebm', V: 'F', V7: 'F7', bVI: 'Gb', bVII: 'Ab', bII: 'Cb', 'V7/iv': 'Bb7', 'V7/bVI': 'Db7', 'V7/bVII': 'Eb7' }
};

export const EXPLAINABILITY_CORPUS: ExplainabilityScenario[] = [];

// 1. Casos Diatônicos Simples (20 cenários)
// 10 Maiores (I -> V -> vi -> IV) - Alvo IV
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `diatonic-maj-${keyRoot.toLowerCase()}`,
    name: `Diatonic Progression ${keyRoot} Major`,
    progression: [dict.I, dict.V, dict.vi, dict.IV],
    targetChordIndex: 3,
    expectedTonalCenter: { root: keyRoot, mode: 'MAJOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'PRIMARY',
    expectedNarrativeKeywords: ['subdominante', 'diatônica', keyRoot],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 Menores (i -> iv -> V -> i) - Alvo V
Object.entries(MINOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `diatonic-min-${keyRoot.toLowerCase()}`,
    name: `Diatonic Progression ${keyRoot} Minor`,
    progression: [dict.i, dict.iv, dict.V, dict.i],
    targetChordIndex: 2,
    expectedTonalCenter: { root: keyRoot, mode: 'MINOR' },
    expectedHarmonicFunction: 'DOMINANT',
    expectedContextualFunction: 'SECONDARY_DOMINANT',
    expectedNarrativeKeywords: ['funciona como dominante secundária', 'resolução', 'esperada'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 2. Dominantes Secundárias (20 cenários)
// 10 V7/ii (I -> V7/ii -> ii) - Alvo V7/ii (o tom muda para o ii grau menor)
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  const resolvedRoot = dict.ii.replace(/m$/, '');
  EXPLAINABILITY_CORPUS.push({
    id: `sec-dom-ii-${keyRoot.toLowerCase()}`,
    name: `Secondary Dominant V7/ii in ${keyRoot} Major`,
    progression: [dict.I, dict['V7/ii'], dict.ii],
    targetChordIndex: 1,
    expectedTonalCenter: { root: resolvedRoot, mode: 'MINOR' },
    expectedHarmonicFunction: 'DOMINANT',
    expectedContextualFunction: 'SECONDARY_DOMINANT',
    expectedNarrativeKeywords: ['funciona como dominante secundária', 'resolução', 'esperada'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 V7/V (I -> V7/V -> V) - Alvo V7/V (o tom muda para o V grau maior)
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `sec-dom-v-${keyRoot.toLowerCase()}`,
    name: `Secondary Dominant V7/V in ${keyRoot} Major`,
    progression: [dict.I, dict['V7/V'], dict.V],
    targetChordIndex: 1,
    expectedTonalCenter: { root: dict.V, mode: 'MAJOR' },
    expectedHarmonicFunction: 'DOMINANT',
    expectedContextualFunction: 'PRIMARY',
    expectedNarrativeKeywords: ['dominante', 'diatônica'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 3. Modal Borrowing Stress Set (50 cenários)
// 10 iv minor em maior (I -> iv -> I) - Alvo iv minor
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-iv-${keyRoot.toLowerCase()}`,
    name: `Modal Borrowing iv minor in ${keyRoot} Major`,
    progression: [dict.I, dict.iv, dict.I],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MAJOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'MODAL_BORROWING',
    expectedNarrativeKeywords: ['iv menor', 'emprestada', 'modo paralelo'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 bVI major em maior (I -> bVI -> I) - Alvo bVI major
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-bvi-${keyRoot.toLowerCase()}`,
    name: `Modal Borrowing bVI in ${keyRoot} Major`,
    progression: [dict.I, dict.bVI, dict.I],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MAJOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'MODAL_BORROWING',
    expectedNarrativeKeywords: ['bVI', 'emprestado', 'modo paralelo'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 bVII major em maior (I -> bVII -> I) - Alvo bVII major
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-bvii-${keyRoot.toLowerCase()}`,
    name: `Modal Borrowing bVII in ${keyRoot} Major`,
    progression: [dict.I, dict.bVII, dict.I],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MAJOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'MODAL_BORROWING',
    expectedNarrativeKeywords: ['bVII', 'emprestado', 'modo paralelo'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 bII major em maior (I -> bII -> I) - Alvo bII major (Neapolitan)
Object.entries(MAJOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-bii-maj-${keyRoot.toLowerCase()}`,
    name: `Modal Borrowing bII in ${keyRoot} Major`,
    progression: [dict.I, dict.bII, dict.I],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MAJOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'MODAL_BORROWING',
    expectedNarrativeKeywords: ['bII', 'emprestado', 'modo paralelo'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 bII major em menor (i -> bII -> i) - Alvo bII major (Neapolitan)
Object.entries(MINOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-bii-min-${keyRoot.toLowerCase()}`,
    name: `Modal Borrowing bII in ${keyRoot} Minor`,
    progression: [dict.i, dict.bII, dict.i],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MINOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'CHROMATIC_APPROACH',
    expectedNarrativeKeywords: ['bII', 'napolitano', 'aproximação cromática'],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 iv minor em menor (i -> iv -> i) - Alvo iv minor
Object.entries(MINOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-iv-min-${keyRoot.toLowerCase()}`,
    name: `Diatonic iv in ${keyRoot} Minor`,
    progression: [dict.i, dict.iv, dict.i],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MINOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'PRIMARY',
    expectedNarrativeKeywords: ['subdominante', 'diatônica', keyRoot],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 bVI major em menor (i -> bVI -> i) - Alvo bVI major
Object.entries(MINOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-bvi-min-${keyRoot.toLowerCase()}`,
    name: `Diatonic bVI in ${keyRoot} Minor`,
    progression: [dict.i, dict.bVI, dict.i],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MINOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'PRIMARY',
    expectedNarrativeKeywords: ['subdominante', 'diatônica', keyRoot],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 10 bVII major em menor (i -> bVII -> i) - Alvo bVII major
Object.entries(MINOR_KEYS).forEach(([keyRoot, dict]) => {
  EXPLAINABILITY_CORPUS.push({
    id: `borrow-bvii-min-${keyRoot.toLowerCase()}`,
    name: `Diatonic bVII in ${keyRoot} Minor`,
    progression: [dict.i, dict.bVII, dict.i],
    targetChordIndex: 1,
    expectedTonalCenter: { root: keyRoot, mode: 'MINOR' },
    expectedHarmonicFunction: 'SUBDOMINANT',
    expectedContextualFunction: 'PRIMARY',
    expectedNarrativeKeywords: ['subdominante', 'diatônica', keyRoot],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});

// 4. Modulações (10 cenários)
const modulationBases = [
  { root: 'C', progression: ['C', 'G', 'D', 'A'], targetRoot: 'E', targetMode: 'MINOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'G', progression: ['G', 'D', 'A', 'E'], targetRoot: 'B', targetMode: 'MINOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'D', progression: ['D', 'A', 'E', 'B'], targetRoot: 'F#', targetMode: 'MINOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'A', progression: ['A', 'E', 'B', 'F#'], targetRoot: 'C#', targetMode: 'MINOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'E', progression: ['E', 'B', 'F#', 'C#'], targetRoot: 'G#', targetMode: 'MINOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'F', progression: ['F', 'C', 'G', 'D'], targetRoot: 'A', targetMode: 'MINOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'Bb', progression: ['Bb', 'F', 'C', 'G'], targetRoot: 'C', targetMode: 'MAJOR' as const, func: 'DOMINANT' as const, ctx: 'PRIMARY' },
  { root: 'Eb', progression: ['Eb', 'Bb', 'F', 'C'], targetRoot: 'F', targetMode: 'MAJOR' as const, func: 'DOMINANT' as const, ctx: 'PRIMARY' },
  { root: 'Ab', progression: ['Ab', 'Eb', 'Bb', 'F'], targetRoot: 'D#', targetMode: 'MAJOR' as const, func: 'SUBDOMINANT' as const, ctx: 'MODAL_BORROWING' },
  { root: 'Db', progression: ['Db', 'Ab', 'Eb', 'Bb'], targetRoot: 'D#', targetMode: 'MAJOR' as const, func: 'DOMINANT' as const, ctx: 'PRIMARY' }
];

modulationBases.forEach((mod, idx) => {
  EXPLAINABILITY_CORPUS.push({
    id: `modulation-${idx}`,
    name: `Gradual Modulation from ${mod.root} to ${mod.targetRoot}`,
    progression: mod.progression,
    targetChordIndex: 3,
    expectedTonalCenter: { root: mod.targetRoot, mode: mod.targetMode },
    expectedHarmonicFunction: mod.func,
    expectedContextualFunction: mod.ctx,
    expectedNarrativeKeywords: ['centro tonal', 'modulação', mod.targetRoot],
    expectedDominantFeature: 'scoreGap',
    expectedRanking: ['scoreGap', 'goalAlignment', 'geometry', 'informationGain']
  });
});
