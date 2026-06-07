import type {
  FunctionalChord,
  FunctionalHypothesis,
  GlobalAnalysisPath,
  ContextualFunction,
  HarmonicFunction,
  TonalCenter,
  ModulationEvent,
  CadenceInfo,
  HarmonicGrammarProfile,
  KeyRelation
} from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';

const BASE_TRANSITIONS: Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>> = {
  'PRIMARY': {
    'PRIMARY': 1.00,
    'SECONDARY_DOMINANT': 1.10,
    'TRITONE_SUBSTITUTION': 0.90,
    'SECONDARY_LEADING_TONE': 1.10,
    'MODAL_BORROWING': 1.00,
    'PASSING_DIMINISHED': 0.90,
    'COMMON_TONE_DIMINISHED': 0.90,
    'NEIGHBOR_DIMINISHED': 0.90,
    'CHROMATIC_APPROACH': 0.80,
  },
  'SECONDARY_DOMINANT': {
    'PRIMARY': 1.25,
  },
  'TRITONE_SUBSTITUTION': {
    'PRIMARY': 1.25,
  },
  'SECONDARY_LEADING_TONE': {
    'PRIMARY': 1.25,
  },
  'MODAL_BORROWING': {
    'PRIMARY': 1.15,
  },
  'PASSING_DIMINISHED': {
    'PRIMARY': 1.10,
  },
  'COMMON_TONE_DIMINISHED': {
    'PRIMARY': 1.15,
  },
  'NEIGHBOR_DIMINISHED': {
    'PRIMARY': 1.10,
  },
  'CHROMATIC_APPROACH': {
    'PRIMARY': 0.80,
  },
};

function getBaseTransition(from: ContextualFunction, to: ContextualFunction): number {
  const fromMap = BASE_TRANSITIONS[from];
  if (fromMap && fromMap[to] !== undefined) {
    return fromMap[to]!;
  }
  return 0.90; // Default transition weight
}

function getFunctionalMultiplier(fromFn: HarmonicFunction, toFn: HarmonicFunction): number {
  if (fromFn === 'SUBDOMINANT' && toFn === 'DOMINANT') return 1.20;
  if (fromFn === 'DOMINANT' && toFn === 'TONIC') return 1.30;
  if (fromFn === 'TONIC' && toFn === 'SUBDOMINANT') return 1.10;
  if (fromFn === 'DOMINANT' && toFn === 'SUBDOMINANT') return 0.70;
  if (fromFn === 'TONIC' && toFn === 'DOMINANT') return 0.85;
  return 1.00; // Default functional multiplier
}

export interface TransitionModel {
  getProbability(from: ContextualFunction, to: ContextualFunction): number;
}

export class StaticTransitionModel implements TransitionModel {
  getProbability(from: ContextualFunction, to: ContextualFunction): number {
    return getBaseTransition(from, to);
  }
}

export class CorpusTransitionModel implements TransitionModel {
  private transitions: Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>>;

  constructor(
    transitions: Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>>
  ) {
    this.transitions = transitions;
  }

  getProbability(from: ContextualFunction, to: ContextualFunction): number {
    const fromMap = this.transitions[from];
    if (fromMap && fromMap[to] !== undefined) {
      return fromMap[to]!;
    }
    return 0.10; // Suavização/fallback para transições não observadas
  }
}

export class HybridTransitionModel implements TransitionModel {
  private theoryModel: TransitionModel;
  private corpusModel: TransitionModel;
  private alpha: number;
  private beta: number;

  constructor(
    theoryModel: TransitionModel,
    corpusModel: TransitionModel,
    alpha: number, // theory weight
    beta: number   // corpus weight
  ) {
    this.theoryModel = theoryModel;
    this.corpusModel = corpusModel;
    this.alpha = alpha;
    this.beta = beta;
  }

  getProbability(from: ContextualFunction, to: ContextualFunction): number {
    const theoryProb = this.theoryModel.getProbability(from, to);
    const corpusProb = this.corpusModel.getProbability(from, to);
    
    // Média geométrica ponderada: P = theoryProb^alpha * corpusProb^beta
    return Math.pow(theoryProb, this.alpha) * Math.pow(corpusProb, this.beta);
  }

  getExplanations(from: ContextualFunction, to: ContextualFunction): {
    baseProb: number;
    corpusProb: number;
    finalProb: number;
    alpha: number;
    beta: number;
  } {
    const theoryProb = this.theoryModel.getProbability(from, to);
    const corpusProb = this.corpusModel.getProbability(from, to);
    const finalProb = this.getProbability(from, to);
    return {
      baseProb: theoryProb,
      corpusProb,
      finalProb,
      alpha: this.alpha,
      beta: this.beta
    };
  }
}

// ──────────────────────────────────────────────────────────────
// Sprint 9A: Space of 24 candidate keys (12 Pitch Classes x 2 Modes)
// ──────────────────────────────────────────────────────────────

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES: ('MAJOR' | 'MINOR')[] = ['MAJOR', 'MINOR'];

export const ALL_24_KEYS: { root: string; mode: 'MAJOR' | 'MINOR' }[] = [];
for (const root of PITCH_CLASSES) {
  for (const mode of MODES) {
    ALL_24_KEYS.push({ root, mode });
  }
}

export function getKeyString(center: { root: string; mode: 'MAJOR' | 'MINOR' }): string {
  return `${center.root} ${center.mode}`;
}

const ROOT_CHROMAS: Record<string, number> = {
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

export function isCloselyRelated(
  k1: { root: string; mode: 'MAJOR' | 'MINOR' },
  k2: { root: string; mode: 'MAJOR' | 'MINOR' }
): boolean {
  const c1 = getChroma(k1.root);
  const c2 = getChroma(k2.root);
  const diff = (c2 - c1 + 12) % 12;

  if (k1.mode === 'MAJOR') {
    if (k2.mode === 'MINOR') {
      // relative minor (9), parallel minor (0), relative of dominant (4), relative of subdominant (2)
      return diff === 9 || diff === 0 || diff === 4 || diff === 2;
    } else {
      // dominant major (7), subdominant major (5)
      return diff === 7 || diff === 5;
    }
  } else {
    if (k2.mode === 'MAJOR') {
      // relative major (3), parallel major (0), relative of dominant (10), relative of subdominant (8)
      return diff === 3 || diff === 0 || diff === 10 || diff === 8;
    } else {
      // dominant minor (7), subdominant minor (5)
      return diff === 7 || diff === 5;
    }
  }
}

export const REGIONAL_TRANSITION_PROFILES: Record<
  HarmonicGrammarProfile,
  { close: number; distant: number }
> = {
  COMMON_PRACTICE: { close: 0.80, distant: 0.15 },
  EXTENDED_FUNCTIONAL: { close: 0.80, distant: 0.35 },
  CHROMATIC_FUNCTIONAL: { close: 0.85, distant: 0.60 },
  MODAL_FUNCTIONAL: { close: 0.75, distant: 0.40 },
  GENERAL: { close: 0.80, distant: 0.35 }
};

export function getKeyRelation(
  k1: { root: string; mode: 'MAJOR' | 'MINOR' },
  k2: { root: string; mode: 'MAJOR' | 'MINOR' }
): KeyRelation {
  const c1 = getChroma(k1.root);
  const c2 = getChroma(k2.root);
  const diff = (c2 - c1 + 12) % 12;

  // Mesma tonalidade (não deve ocorrer para transição regional real, mas mantido por segurança)
  if (k1.root === k2.root && k1.mode === k2.mode) {
    return 'RELATIVE';
  }

  // 1. Relação Homônima (Paralela)
  if (c1 === c2 && k1.mode !== k2.mode) {
    return 'PARALLEL';
  }

  // 2. Relação Relativa
  if (k1.mode === 'MAJOR' && k2.mode === 'MINOR' && diff === 9) {
    return 'RELATIVE';
  }
  if (k1.mode === 'MINOR' && k2.mode === 'MAJOR' && diff === 3) {
    return 'RELATIVE';
  }

  // 3. Relações de Dominante / Subdominante
  if (diff === 7 && k1.mode === k2.mode) {
    return 'DOMINANT';
  }
  if (diff === 5 && k1.mode === k2.mode) {
    return 'SUBDOMINANT';
  }

  // 4. Mediante Diatônica (Terça de distância na armadura que não seja a relativa direta)
  if (k1.mode === 'MAJOR' && k2.mode === 'MINOR' && diff === 4) {
    return 'MEDIANT'; // C Major -> E Minor (iii)
  }
  if (k1.mode === 'MINOR' && k2.mode === 'MAJOR' && diff === 8) {
    return 'MEDIANT'; // A Minor -> F Major (bVI)
  }

  // 5. Mediante Cromática (Terças com alteração de armadura ou mesma qualidade modal)
  if (diff === 3 || diff === 4 || diff === 8 || diff === 9) {
    return 'CHROMATIC_MEDIANT';
  }

  // 6. Relação de Trítono
  if (diff === 6) {
    return 'TRITONE';
  }

  return 'DISTANT';
}

export function getKeyTransitionMultiplier(
  k1: { root: string; mode: 'MAJOR' | 'MINOR' },
  k2: { root: string; mode: 'MAJOR' | 'MINOR' },
  profile: HarmonicGrammarProfile = 'GENERAL'
): number {
  if (k1.root === k2.root && k1.mode === k2.mode) {
    return 1.0;
  }
  const isClose = isCloselyRelated(k1, k2);
  const weights = REGIONAL_TRANSITION_PROFILES[profile] || REGIONAL_TRANSITION_PROFILES.GENERAL;
  return isClose ? weights.close : weights.distant;
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

interface ViterbiState {
  keyIndex: number;
  key: { root: string; mode: 'MAJOR' | 'MINOR' };
  hypIndex: number;
  hypothesis: FunctionalHypothesis;
  originalChord: FunctionalChord;
}
function isMinorType(quality: string): boolean {
  return (
    quality.includes('minor') ||
    quality === 'halfDiminished' ||
    quality === 'diminished' ||
    quality === 'diminished7th'
  );
}

export function resolveGlobalPath(
  cache: Record<string, FunctionalChord[]>,
  cadencesByKey: Record<string, CadenceInfo[]>,
  model: TransitionModel = new StaticTransitionModel(),
  initialTonalCenter?: TonalCenter,
  profile: HarmonicGrammarProfile = 'GENERAL'
): GlobalAnalysisPath {
  // Extract number of chords N from one of the cache channels
  const keysInCache = Object.keys(cache);
  if (keysInCache.length === 0 || cache[keysInCache[0]].length === 0) {
    return {
      chordIndexes: [],
      hypothesisIndexes: [],
      totalScore: 0,
      localScore: 0,
      transitionScore: 0,
      keys: [],
      modulations: [],
      explanations: []
    };
  }
  const N = cache[keysInCache[0]].length;

  // 1. Build columns of valid candidate states (Key, Hypothesis)
  const columns: ViterbiState[][] = [];

  for (let i = 0; i < N; i++) {
    const columnStates: ViterbiState[] = [];

    for (let k = 0; k < ALL_24_KEYS.length; k++) {
      const key = ALL_24_KEYS[k];
      const keyStr = getKeyString(key);
      const chordUnderKey = cache[keyStr]?.[i];
      if (!chordUnderKey) continue;

      const hypotheses = chordUnderKey.functionalHypotheses || [];

      // Filter local hypotheses with confidence >= 0.15 under this center tonal
      let filtered = hypotheses
        .map((h, hypIndex) => ({
          keyIndex: k,
          key,
          hypIndex,
          hypothesis: h,
          originalChord: chordUnderKey
        }))
        .filter(state => state.hypothesis.confidence >= 0.15);

      // Safety net fallback for this key
      if (filtered.length === 0 && hypotheses.length > 0) {
        let bestIdx = 0;
        let maxConf = -1;
        for (let j = 0; j < hypotheses.length; j++) {
          if (hypotheses[j].confidence > maxConf) {
            maxConf = hypotheses[j].confidence;
            bestIdx = j;
          }
        }
        filtered = [
          {
            keyIndex: k,
            key,
            hypIndex: bestIdx,
            hypothesis: hypotheses[bestIdx],
            originalChord: chordUnderKey
          }
        ];
      }

      columnStates.push(...filtered);
    }

    // Safety fallback for the entire column if absolutely no key produced hypotheses
    if (columnStates.length === 0) {
      const fallbackKey = ALL_24_KEYS[0]; // C MAJOR
      const fallbackChord = cache[getKeyString(fallbackKey)][i];
      columnStates.push({
        keyIndex: 0,
        key: fallbackKey,
        hypIndex: 0,
        hypothesis: {
          contextualFunction: 'PRIMARY',
          romanNumeral: 'I',
          harmonicFunction: 'TONIC',
          confidence: 0.15,
          explanation: ['Viterbi column fallback']
        },
        originalChord: fallbackChord
      });
    }

    columns.push(columnStates);
  }

  // 2. Initialize Viterbi structures
  const dp: number[][] = columns.map(col => col.map(() => -Infinity));
  const parent: number[][] = columns.map(col => col.map(() => -1));
  const consecutiveCount: number[][] = columns.map(col => col.map(() => 1));

  const firstChordSymbol = cache[keysInCache[0]][0]?.chordSymbol;
  const firstParsed = firstChordSymbol ? parseChord(firstChordSymbol) : null;
  const firstChordRoot = firstParsed && !firstParsed.empty ? firstParsed.root : null;
  const firstChordMode = firstParsed && !firstParsed.empty 
    ? (isMinorType(firstParsed.quality) ? 'MINOR' : 'MAJOR')
    : null;

  // Initialize chord 0
  for (let j = 0; j < columns[0].length; j++) {
    const state = columns[0][j];
    let startMultiplier = 1.0;
    if (initialTonalCenter) {
      const isInitialKey = state.key.root === initialTonalCenter.root && state.key.mode === initialTonalCenter.mode;
      const isFirstChordKey = firstChordRoot !== null && state.key.root === firstChordRoot && state.key.mode === firstChordMode;

      if (isInitialKey || isFirstChordKey) {
        startMultiplier = 1.0;
      } else if (isCloselyRelated(state.key, initialTonalCenter)) {
        startMultiplier = 0.15;
      } else {
        startMultiplier = 0.02;
      }
    }
    dp[0][j] = Math.log(Math.max(0.01, state.hypothesis.confidence)) + Math.log(startMultiplier);
    consecutiveCount[0][j] = 1;
  }

  // 3. Run Viterbi Dynamic Programming
  for (let i = 1; i < N; i++) {
    const prevCol = columns[i - 1];
    const curCol = columns[i];

    for (let j = 0; j < curCol.length; j++) {
      const curState = curCol[j];
      let maxScore = -Infinity;
      let bestParentIdx = -1;
      let bestConsecutiveCount = 1;

      for (let k = 0; k < prevCol.length; k++) {
        const prevState = prevCol[k];

        // A. Contextual transition probability from style model
        const baseProb = model.getProbability(
          prevState.hypothesis.contextualFunction,
          curState.hypothesis.contextualFunction
        );

        // B. Key signature transition multiplier (Modulation)
        const isSameKey = prevState.key.root === curState.key.root && prevState.key.mode === curState.key.mode;
        const keyMultiplier = getKeyTransitionMultiplier(prevState.key, curState.key, profile);

        // C. Tonal Persistence rule: penalize rapid key signature hopping
        let persistenceMultiplier = 1.0;
        if (!isSameKey) {
          const prevKeyDuration = consecutiveCount[i - 1][k];
          if (prevKeyDuration === 1) {
            persistenceMultiplier = 0.15; // heavy penalty for 1-chord duration key
          } else if (prevKeyDuration === 2) {
            persistenceMultiplier = 0.50; // moderate penalty for 2-chord duration key
          }
          // If we change key on the very last chord of the progression, apply a heavy penalty
          // because a new key signature cannot be established in a single final chord.
          if (i === N - 1) {
            persistenceMultiplier *= 0.15;
          }
        }

        // D. Cadence confirmation bonus
        let cadenceBonus = 1.0;
        const curKeyStr = getKeyString(curState.key);
        const curKeyCadences = cadencesByKey[curKeyStr] || [];
        const matchingCadence = curKeyCadences.find(cad => cad.endIndex === i);
        if (matchingCadence) {
          cadenceBonus = 1.0 + matchingCadence.confidence * 0.40;
        }

        // E. Resolution target matching (Level 2, cross-key absolute pitch classes)
        let targetMultiplier = 1.0;
        const targetDegree = prevState.hypothesis.secondaryTarget || prevState.hypothesis.chromaticAnalysis?.targetDegree;
        
        if (targetDegree) {
          const targetOffset = getScaleDegreeOffset(targetDegree);
          const prevKeyChroma = getChroma(prevState.key.root);
          const absoluteTargetChroma = (prevKeyChroma + targetOffset) % 12;

          const dist = prevState.hypothesis.contextualAnalysis?.resolutionDistance || prevState.hypothesis.chromaticAnalysis?.resolutionDistance || 1;
          const targetIdx = (i - 1 + dist) % N;
          const targetChordSymbol = cache[keysInCache[0]][targetIdx].chordSymbol;
          const targetParsed = parseChord(targetChordSymbol);
          const targetRootChroma = getChroma(targetParsed.root);

          if (targetRootChroma === absoluteTargetChroma) {
            targetMultiplier = 1.15;
          } else {
            targetMultiplier = 0.15;
          }
        }

        // F. Functional syntax matching (Level 3)
        let functionalMult = getFunctionalMultiplier(
          prevState.hypothesis.harmonicFunction,
          curState.hypothesis.harmonicFunction
        );
        if (targetMultiplier > 1.0) {
          functionalMult = 1.30;
        }

        // Total transition probability
        const transProbability = baseProb * keyMultiplier * persistenceMultiplier * cadenceBonus * targetMultiplier * functionalMult;
        const transitionLog = Math.log(Math.max(1e-10, transProbability));
        const localLog = Math.log(Math.max(0.01, curState.hypothesis.confidence));

        const score = dp[i - 1][k] + transitionLog + localLog;

        if (score > maxScore) {
          maxScore = score;
          bestParentIdx = k;
          bestConsecutiveCount = isSameKey ? (consecutiveCount[i - 1][k] + 1) : 1;
        }
      }

      dp[i][j] = maxScore;
      parent[i][j] = bestParentIdx;
      consecutiveCount[i][j] = bestConsecutiveCount;
    }
  }

  // 4. Find optimal path end index
  let maxPathScore = -Infinity;
  let bestEndIdx = -1;
  const lastCol = columns[N - 1];

  for (let j = 0; j < lastCol.length; j++) {
    if (dp[N - 1][j] > maxPathScore) {
      maxPathScore = dp[N - 1][j];
      bestEndIdx = j;
    }
  }

  if (bestEndIdx === -1) {
    bestEndIdx = 0;
  }

  // 5. Backtrack to reconstruct path
  const keys: TonalCenter[] = [];
  const hypothesisIndexes: number[] = new Array(N);
  const chordIndexes = Array.from({ length: N }, (_, idx) => idx);

  let curIdx = bestEndIdx;
  const optimalStates: ViterbiState[] = [];

  for (let i = N - 1; i >= 0; i--) {
    const col = columns[i];
    const chosenState = col[curIdx] || col[0];
    optimalStates.unshift(chosenState);
    hypothesisIndexes[i] = chosenState.hypIndex;
    curIdx = parent[i][curIdx];
  }

  // Fill in keys with calculated confidence
  for (let i = 0; i < N; i++) {
    keys.push({
      root: optimalStates[i].key.root,
      mode: optimalStates[i].key.mode,
      confidence: optimalStates[i].originalChord.confidence
    });
  }

  // 6. Track modulation events
  const modulations: ModulationEvent[] = [];
  for (let i = 1; i < N; i++) {
    const prevKey = keys[i - 1];
    const curKey = keys[i];
    if (prevKey.root !== curKey.root || prevKey.mode !== curKey.mode) {
      const curState = optimalStates[i];
      const curKeyStr = getKeyString(curState.key);
      const curKeyCadences = cadencesByKey[curKeyStr] || [];
      const cadence = curKeyCadences.find(cad => i >= cad.startIndex && i <= cad.endIndex);
      
      const isClose = isCloselyRelated(prevKey, curKey);
      let confidence = isClose ? 0.70 : 0.50;
      let reason = isClose 
        ? `Tonal proximity transition (${prevKey.root} ${prevKey.mode === 'MAJOR' ? 'Maior' : 'Menor'} -> ${curKey.root} ${curKey.mode === 'MAJOR' ? 'Maior' : 'Menor'})`
        : `Distant key modulation (${prevKey.root} ${prevKey.mode === 'MAJOR' ? 'Maior' : 'Menor'} -> ${curKey.root} ${curKey.mode === 'MAJOR' ? 'Maior' : 'Menor'})`;

      if (cadence) {
        confidence = Math.min(0.99, confidence + cadence.confidence * 0.25);
        reason += ` confirmed by ${cadence.name}`;
      }
      
      modulations.push({
        chordIndex: i,
        from: { ...prevKey },
        to: { ...curKey },
        confidence: Number(confidence.toFixed(2)),
        reason
      });
    }
  }

  // 7. Calculate separate scores and descriptions for the DTO
  let localScore = 0;
  let transitionScore = 0;
  const explanations: string[] = [];

  // Chord 0 explanation
  const firstState = optimalStates[0];
  const firstHyp = firstState.hypothesis;
  localScore += Math.log(Math.max(0.01, firstHyp.confidence));
  explanations.push(
    `Chord 0 (${firstState.originalChord.chordSymbol}): Key: ${getKeyString(firstState.key)}, ` +
    `Chosen ${firstHyp.contextualFunction} (${firstHyp.romanNumeral}) with local confidence ${firstHyp.confidence.toFixed(2)}`
  );

  for (let i = 1; i < N; i++) {
    const prevState = optimalStates[i - 1];
    const curState = optimalStates[i];
    const prevHyp = prevState.hypothesis;
    const curHyp = curState.hypothesis;

    localScore += Math.log(Math.max(0.01, curHyp.confidence));

    let baseProb = 1.0;
    let transitionDetailStr = '';

    if (model instanceof HybridTransitionModel) {
      const details = model.getExplanations(prevHyp.contextualFunction, curHyp.contextualFunction);
      baseProb = details.finalProb;
      transitionDetailStr = `[Base: ${details.baseProb.toFixed(2)} (α: ${details.alpha.toFixed(2)}), Corpus: ${details.corpusProb.toFixed(2)} (β: ${details.beta.toFixed(2)}), Final Base: ${details.finalProb.toFixed(2)}]`;
    } else {
      baseProb = model.getProbability(prevHyp.contextualFunction, curHyp.contextualFunction);
      transitionDetailStr = `[Base: ${baseProb.toFixed(2)}]`;
    }

    const isSameKey = prevState.key.root === curState.key.root && prevState.key.mode === curState.key.mode;
    const keyMult = getKeyTransitionMultiplier(prevState.key, curState.key, profile);
    let keyExpl = isSameKey ? 'same key' : `modulation to ${getKeyString(curState.key)} (mult: ${keyMult.toFixed(2)})`;

    // Calculate exact consecutive duration for explanation
    let prevKey = optimalStates[i - 1].key;
    let duration = 0;
    for (let idx = i - 1; idx >= 0; idx--) {
      if (optimalStates[idx].key.root === prevKey.root && optimalStates[idx].key.mode === prevKey.mode) {
        duration++;
      } else {
        break;
      }
    }
    
    let durationLogFactor = 1.0;
    if (!isSameKey) {
      if (duration === 1) durationLogFactor = 0.15;
      else if (duration === 2) durationLogFactor = 0.50;
    }

    const curKeyStr = getKeyString(curState.key);
    const curKeyCadences = cadencesByKey[curKeyStr] || [];
    const cadence = curKeyCadences.find(cad => cad.endIndex === i);
    let cadenceExpl = cadence ? `cadence: ${cadence.name}` : 'no cadence';

    let targetMultiplier = 1.0;
    let resolutionExpl = 'no target';
    const targetDegree = prevHyp.secondaryTarget || prevHyp.chromaticAnalysis?.targetDegree;
    if (targetDegree) {
      const targetOffset = getScaleDegreeOffset(targetDegree);
      const prevKeyChroma = getChroma(prevState.key.root);
      const absoluteTargetChroma = (prevKeyChroma + targetOffset) % 12;

      const curParsed = parseChord(curState.originalChord.chordSymbol);
      const curRootChroma = getChroma(curParsed.root);

      if (curRootChroma === absoluteTargetChroma) {
        targetMultiplier = 1.15;
        resolutionExpl = `matched target PC (${curParsed.root})`;
      } else {
        targetMultiplier = 0.15;
        resolutionExpl = `mismatched target PC (expected chroma ${absoluteTargetChroma}, got ${curRootChroma})`;
      }
    }

    let functionalMult = getFunctionalMultiplier(prevHyp.harmonicFunction, curHyp.harmonicFunction);
    if (targetMultiplier > 1.0) {
      functionalMult = 1.30;
    }
    const transProbability = baseProb * keyMult * durationLogFactor * (cadence ? (1.0 + cadence.confidence * 0.40) : 1.0) * targetMultiplier * functionalMult;
    transitionScore += Math.log(Math.max(1e-10, transProbability));

    explanations.push(
      `Transition ${i - 1} -> ${i} (${prevState.originalChord.chordSymbol} -> ${curState.originalChord.chordSymbol}): ` +
      `Key ${getKeyString(prevState.key)} -> ${getKeyString(curState.key)} [${keyExpl}] ` +
      `${prevHyp.contextualFunction} (${prevHyp.romanNumeral}) -> ${curHyp.contextualFunction} (${curHyp.romanNumeral}) ` +
      `${transitionDetailStr} ` +
      `[Multiplier Target: ${targetMultiplier.toFixed(2)} (${resolutionExpl}), Functional: ${functionalMult.toFixed(2)}, Cadence: ${cadenceExpl}, Persistence: ${durationLogFactor.toFixed(2)}]`
    );
  }

  const totalScore = localScore + transitionScore;

  return {
    chordIndexes,
    hypothesisIndexes,
    totalScore,
    localScore,
    transitionScore,
    keys,
    modulations,
    explanations
  };
}
