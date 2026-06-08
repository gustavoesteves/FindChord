import type {
  FunctionalChord,
  FunctionalHypothesis,
  GlobalAnalysisPath,
  TonalCenter,
  ModulationEvent,
  CadenceInfo,
  HarmonicGrammarProfile,
  HarmonicState,
  ModalMode
} from '../models/FunctionalAnalysis';
import { parseChord } from '../../theory/chordParser';
import { isMinorType } from '../helpers/qualityHelpers';
import { ALL_24_KEYS, getChroma } from '../../theory/pitchClass';
import { getScaleDegreeOffset } from '../../theory/scaleDegree';
import { getKeyTransitionMultiplier, isCloselyRelated } from '../../theory/tonalRelations';
import { StaticTransitionModel, HybridTransitionModel, getFunctionalMultiplier } from './transitionModels';
import type { TransitionModel } from './transitionModels';

export interface ViterbiState {
  stateIndex: number;
  state: HarmonicState;
  hypIndex: number;
  hypothesis: FunctionalHypothesis;
  originalChord: FunctionalChord;
}

export function getStateString(state: HarmonicState): string {
  return `${state.root} ${state.mode}`;
}

export function mapStateToTonalCenter(state: HarmonicState): TonalCenter {
  const isMajor = state.mode === 'IONIAN' || state.mode === 'LYDIAN' || state.mode === 'MIXOLYDIAN';
  return {
    root: state.root,
    mode: isMajor ? 'MAJOR' : 'MINOR',
    confidence: 1.0
  };
}

export function getParentMajorChroma(state: HarmonicState): number {
  const rootChroma = getChroma(state.root);
  let offset = 0;
  switch (state.mode) {
    case 'IONIAN': offset = 0; break;
    case 'DORIAN': offset = 10; break; // -2 = +10
    case 'PHRYGIAN': offset = 8; break; // -4 = +8
    case 'LYDIAN': offset = 7; break; // -5 = +7
    case 'MIXOLYDIAN': offset = 5; break; // -7 = +5
    case 'AEOLIAN': offset = 3; break; // -9 = +3
    case 'LOCRIAN': offset = 1; break; // -11 = +1
  }
  return (rootChroma + offset) % 12;
}

export function resolveGlobalPath(
  cache: Record<string, FunctionalChord[]>,
  cadencesByKey: Record<string, CadenceInfo[]>,
  model: TransitionModel = new StaticTransitionModel(),
  initialTonalCenter?: TonalCenter,
  profile: HarmonicGrammarProfile = 'GENERAL',
  candidates: HarmonicState[] = []
): GlobalAnalysisPath {
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

  // 1. Generate active candidate list (24 tonal keys + top-N modal candidates)
  let activeCandidates = candidates;
  if (activeCandidates.length === 0) {
    activeCandidates = ALL_24_KEYS.map(k => ({
      root: k.root,
      mode: k.mode === 'MAJOR' ? 'IONIAN' : 'AEOLIAN' as ModalMode
    }));
  }

  // 2. Build columns of valid candidate states (HarmonicState, Hypothesis)
  const columns: ViterbiState[][] = [];

  for (let i = 0; i < N; i++) {
    const columnStates: ViterbiState[] = [];

    for (let k = 0; k < activeCandidates.length; k++) {
      const state = activeCandidates[k];
      const stateStr = getStateString(state);
      const chordUnderState = cache[stateStr]?.[i];
      if (!chordUnderState) continue;

      const hypotheses = chordUnderState.debug?.functionalHypotheses || [];

      // Filter local hypotheses with confidence >= 0.15 under this center
      let filtered = hypotheses
        .map((h, hypIndex) => ({
          stateIndex: k,
          state,
          hypIndex,
          hypothesis: h,
          originalChord: chordUnderState
        }))
        .filter(st => st.hypothesis.confidence >= 0.15);

      // Safety net fallback for this key state
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
            stateIndex: k,
            state,
            hypIndex: bestIdx,
            hypothesis: hypotheses[bestIdx],
            originalChord: chordUnderState
          }
        ];
      }

      columnStates.push(...filtered);
    }

    // Safety fallback for the entire column if absolutely no state produced hypotheses
    if (columnStates.length === 0) {
      const fallbackState = activeCandidates[0]; // first candidate
      const fallbackChord = cache[getStateString(fallbackState)][i];
      columnStates.push({
        stateIndex: 0,
        state: fallbackState,
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

  // 3. Initialize Viterbi structures
  const dp: number[][] = columns.map(col => col.map(() => -Infinity));
  const parent: number[][] = columns.map(col => col.map(() => -1));
  const consecutiveCount: number[][] = columns.map(col => col.map(() => 1));

  const firstChordSymbol = cache[getStateString(activeCandidates[0])][0]?.chordSymbol;
  const firstParsed = firstChordSymbol ? parseChord(firstChordSymbol) : null;
  const firstChordRoot = firstParsed && !firstParsed.empty ? firstParsed.root : null;
  const firstChordMode = firstParsed && !firstParsed.empty 
    ? (isMinorType(firstParsed.quality) ? 'AEOLIAN' : 'IONIAN')
    : null;

  // Initialize chord 0
  for (let j = 0; j < columns[0].length; j++) {
    const st = columns[0][j];
    let startMultiplier = 1.0;
    const isModal = st.state.mode !== 'IONIAN' && st.state.mode !== 'AEOLIAN';
    const stModeType = (st.state.mode === 'IONIAN' || st.state.mode === 'LYDIAN' || st.state.mode === 'MIXOLYDIAN') ? 'MAJOR' : 'MINOR';
    const firstChordModeType = firstChordMode === 'IONIAN' ? 'MAJOR' : 'MINOR';
    const isFirstChordKey = firstChordRoot !== null && st.state.root === firstChordRoot && stModeType === firstChordModeType;

    if (profile === 'MODAL_FUNCTIONAL') {
      if (isFirstChordKey) {
        startMultiplier = isModal ? 5.0 : 3.0;
      } else {
        startMultiplier = 0.05;
      }
    } else if (initialTonalCenter) {
      const initialTonal = mapStateToTonalCenter(st.state);
      const isInitialKey = initialTonal.root === initialTonalCenter.root && initialTonal.mode === initialTonalCenter.mode;

      if (isInitialKey || isFirstChordKey) {
        startMultiplier = isModal ? 0.20 : 1.0; // Prefer tonal keys over modal keys at path start in standard profiles
      } else if (isCloselyRelated(initialTonal, initialTonalCenter)) {
        startMultiplier = 0.15;
      } else {
        startMultiplier = 0.02;
      }
    }
    dp[0][j] = Math.log(Math.max(0.01, st.hypothesis.confidence)) + Math.log(startMultiplier);
    consecutiveCount[0][j] = 1;
  }

  // 4. Run Viterbi Dynamic Programming
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
        const isSameState = prevState.state.root === curState.state.root && prevState.state.mode === curState.state.mode;
        const prevTonal = mapStateToTonalCenter(prevState.state);
        const curTonal = mapStateToTonalCenter(curState.state);
        let keyMultiplier = getKeyTransitionMultiplier(prevTonal, curTonal, profile);

        // Relative mode optimization: if they share the exact same diatonic pitch collection (relative modes),
        // they share the same key signature, so do not penalize the transition. Only under modal profile.
        if (profile === 'MODAL_FUNCTIONAL' && !isSameState && getParentMajorChroma(prevState.state) === getParentMajorChroma(curState.state)) {
          keyMultiplier = 1.0;
        }

        // Under standard tonal profiles, penalize transitioning into a modal state
        if (profile !== 'MODAL_FUNCTIONAL' && !isSameState && curState.state.mode !== 'IONIAN' && curState.state.mode !== 'AEOLIAN') {
          keyMultiplier *= 0.50;
        }

        // C. Tonal Persistence rule: penalize rapid key signature hopping
        let persistenceMultiplier = 1.0;
        if (!isSameState) {
          const prevKeyDuration = consecutiveCount[i - 1][k];
          if (prevKeyDuration === 1) {
            persistenceMultiplier = 0.15;
          } else if (prevKeyDuration === 2) {
            persistenceMultiplier = 0.50;
          }
          if (i >= N - 2) {
            persistenceMultiplier *= 0.15;
          }
          // Ease penalty if transitioning to a modal state confirmed by a cadence
          const curIsModal = curState.state.mode !== 'IONIAN' && curState.state.mode !== 'AEOLIAN';
          const curStateStr = getStateString(curState.state);
          const curKeyCadences = cadencesByKey[curStateStr] || [];
          const hasCadence = curKeyCadences.some(cad => cad.endIndex === i && !cad.suppressed && cad.resolution?.status !== 'INTERRUPTED' && cad.resolution?.status !== 'EVADED');
          if (curIsModal && hasCadence) {
            persistenceMultiplier = Math.min(1.0, persistenceMultiplier * 1.5);
          }
        }

        // D. Cadence confirmation bonus
        let cadenceBonus = 1.0;
        const curStateStr = getStateString(curState.state);
        const curKeyCadences = cadencesByKey[curStateStr] || [];
        const matchingCadence = curKeyCadences.find(cad => cad.endIndex === i && !cad.suppressed && cad.resolution?.status !== 'INTERRUPTED' && cad.resolution?.status !== 'EVADED');
        if (matchingCadence) {
          const isModalCadence = matchingCadence.name.startsWith('Aproximação');
          const mult = isModalCadence ? 0.80 : 0.40;
          cadenceBonus = 1.0 + matchingCadence.confidence * mult;
        }

        // E. Resolution target matching
        let targetMultiplier = 1.0;
        const targetDegree = prevState.hypothesis.secondaryTarget || prevState.hypothesis.chromaticAnalysis?.targetDegree;
        
        if (targetDegree) {
          const targetOffset = getScaleDegreeOffset(targetDegree);
          const prevKeyChroma = getChroma(prevState.state.root);
          const absoluteTargetChroma = (prevKeyChroma + targetOffset) % 12;

          const dist = prevState.hypothesis.contextualAnalysis?.resolutionDistance || prevState.hypothesis.chromaticAnalysis?.resolutionDistance || 1;
          const targetIdx = (i - 1 + dist) % N;
          const targetChordSymbol = cache[getStateString(activeCandidates[0])][targetIdx].chordSymbol;
          const targetParsed = parseChord(targetChordSymbol);
          const targetRootChroma = getChroma(targetParsed.root);

          if (targetRootChroma === absoluteTargetChroma) {
            targetMultiplier = 1.15;
          } else {
            targetMultiplier = 0.15;
          }
        }

        // F. Functional syntax matching
        let functionalMult = getFunctionalMultiplier(
          prevState.hypothesis.harmonicFunction,
          curState.hypothesis.harmonicFunction,
          profile
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
          bestConsecutiveCount = isSameState ? (consecutiveCount[i - 1][k] + 1) : 1;
        }
      }

      dp[i][j] = maxScore;
      parent[i][j] = bestParentIdx;
      consecutiveCount[i][j] = bestConsecutiveCount;
    }
  }

  // 5. Find optimal path end index
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

  // 6. Backtrack to reconstruct path
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

  // Fill in keys for compatibility
  for (let i = 0; i < N; i++) {
    const tonal = mapStateToTonalCenter(optimalStates[i].state);
    keys.push({
      root: tonal.root,
      mode: tonal.mode,
      confidence: optimalStates[i].originalChord.confidence
    });
  }

  // 7. Track modulation events
  const modulations: ModulationEvent[] = [];
  for (let i = 1; i < N; i++) {
    const prevTonal = keys[i - 1];
    const curTonal = keys[i];
    const prevState = optimalStates[i - 1];
    const curState = optimalStates[i];

    const isSameState = prevState.state.root === curState.state.root && prevState.state.mode === curState.state.mode;

    if (!isSameState) {
      const curStateStr = getStateString(curState.state);
      const curKeyCadences = cadencesByKey[curStateStr] || [];
      const cadence = curKeyCadences.find(cad => i >= cad.startIndex && i <= cad.endIndex && !cad.suppressed && cad.resolution?.status !== 'INTERRUPTED' && cad.resolution?.status !== 'EVADED');
      
      const isClose = isCloselyRelated(prevTonal, curTonal);
      let confidence = isClose ? 0.70 : 0.50;
      let reason = isClose 
        ? `Regional state transition (${getStateString(prevState.state)} -> ${getStateString(curState.state)})`
        : `Distant state transition (${getStateString(prevState.state)} -> ${getStateString(curState.state)})`;

      if (cadence) {
        confidence = Math.min(0.99, confidence + cadence.confidence * 0.25);
        reason += ` confirmed by ${cadence.name}`;
      }
      
      modulations.push({
        chordIndex: i,
        from: { ...prevTonal },
        to: { ...curTonal },
        confidence: Number(confidence.toFixed(2)),
        reason
      });
    }
  }

  // 8. Calculate separate scores and descriptions for the DTO
  let localScore = 0;
  let transitionScore = 0;
  const explanations: string[] = [];

  // Chord 0 explanation
  const firstState = optimalStates[0];
  const firstHyp = firstState.hypothesis;
  localScore += Math.log(Math.max(0.01, firstHyp.confidence));
  explanations.push(
    `Chord 0 (${firstState.originalChord.chordSymbol}): State: ${getStateString(firstState.state)}, ` +
    `Chosen ${firstHyp.contextualFunction} (${firstHyp.romanNumeral}) with local confidence ${firstHyp.confidence.toFixed(2)}`
  );

  for (let i = 1; i < N; i++) {
    const prevState = optimalStates[i - 1];
    const curState = optimalStates[i];
    const prevHyp = prevState.hypothesis;
    const curHyp = curState.hypothesis;

    localScore += Math.log(Math.max(0.01, curHyp.confidence));

    let baseProb: number;
    let transitionDetailStr: string;

    if (model instanceof HybridTransitionModel) {
      const details = model.getExplanations(prevHyp.contextualFunction, curHyp.contextualFunction);
      baseProb = details.finalProb;
      transitionDetailStr = `[Base: ${details.baseProb.toFixed(2)} (α: ${details.alpha.toFixed(2)}), Corpus: ${details.corpusProb.toFixed(2)} (β: ${details.beta.toFixed(2)}), Final Base: ${details.finalProb.toFixed(2)}]`;
    } else {
      baseProb = model.getProbability(prevHyp.contextualFunction, curHyp.contextualFunction);
      transitionDetailStr = `[Base: ${baseProb.toFixed(2)}]`;
    }

    const isSameState = prevState.state.root === curState.state.root && prevState.state.mode === curState.state.mode;
    const prevTonal = mapStateToTonalCenter(prevState.state);
    const curTonal = mapStateToTonalCenter(curState.state);
    let keyMult = getKeyTransitionMultiplier(prevTonal, curTonal, profile);
    if (profile === 'MODAL_FUNCTIONAL' && !isSameState && getParentMajorChroma(prevState.state) === getParentMajorChroma(curState.state)) {
      keyMult = 1.0;
    }
    if (profile !== 'MODAL_FUNCTIONAL' && !isSameState && curState.state.mode !== 'IONIAN' && curState.state.mode !== 'AEOLIAN') {
      keyMult *= 0.50;
    }
    const keyExpl = isSameState ? 'same state' : `state modulation to ${getStateString(curState.state)} (mult: ${keyMult.toFixed(2)})`;

    // Calculate exact consecutive duration for explanation
    const prevSt = optimalStates[i - 1].state;
    let duration = 0;
    for (let idx = i - 1; idx >= 0; idx--) {
      if (optimalStates[idx].state.root === prevSt.root && optimalStates[idx].state.mode === prevSt.mode) {
        duration++;
      } else {
        break;
      }
    }
    
    const curStateStr = getStateString(curState.state);
    const curKeyCadences = cadencesByKey[curStateStr] || [];
    const cadence = curKeyCadences.find(cad => cad.endIndex === i && !cad.suppressed);
    const cadenceExpl = cadence ? `cadence: ${cadence.name}` : 'no cadence';

    let durationLogFactor = 1.0;
    if (!isSameState) {
      if (duration === 1) durationLogFactor = 0.15;
      else if (duration === 2) durationLogFactor = 0.50;
      
      if (i >= N - 2) {
        durationLogFactor *= 0.15;
      }
      
      const curIsModal = curState.state.mode !== 'IONIAN' && curState.state.mode !== 'AEOLIAN';
      if (curIsModal && cadence) {
        durationLogFactor = Math.min(1.0, durationLogFactor * 1.5);
      }
    }

    let cadenceBonus = 1.0;
    if (cadence && cadence.resolution?.status !== 'INTERRUPTED' && cadence.resolution?.status !== 'EVADED') {
      const isModalCadence = cadence.name.startsWith('Aproximação');
      const mult = isModalCadence ? 0.80 : 0.40;
      cadenceBonus = 1.0 + cadence.confidence * mult;
    }

    let targetMultiplier = 1.0;
    let resolutionExpl = 'no target';
    const targetDegree = prevHyp.secondaryTarget || prevHyp.chromaticAnalysis?.targetDegree;
    if (targetDegree) {
      const targetOffset = getScaleDegreeOffset(targetDegree);
      const prevKeyChroma = getChroma(prevState.state.root);
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

    let functionalMult = getFunctionalMultiplier(prevHyp.harmonicFunction, curHyp.harmonicFunction, profile);
    if (targetMultiplier > 1.0) {
      functionalMult = 1.30;
    }
    const transProbability = baseProb * keyMult * durationLogFactor * cadenceBonus * targetMultiplier * functionalMult;
    transitionScore += Math.log(Math.max(1e-10, transProbability));

    explanations.push(
      `Transition ${i - 1} -> ${i} (${prevState.originalChord.chordSymbol} -> ${curState.originalChord.chordSymbol}): ` +
      `State ${getStateString(prevState.state)} -> ${getStateString(curState.state)} [${keyExpl}] ` +
      `${prevHyp.contextualFunction} (${prevHyp.romanNumeral}) -> ${curHyp.contextualFunction} (${curHyp.romanNumeral}) ` +
      `${transitionDetailStr} ` +
      `[Multiplier Target: ${targetMultiplier.toFixed(2)} (${resolutionExpl}), Functional: ${functionalMult.toFixed(2)}, Cadence: ${cadenceExpl}, Persistence: ${durationLogFactor.toFixed(2)}]`
    );
  }

  const totalScore = localScore + transitionScore;

  // 9. Attach the chosen active states list to the returned path for final mapping
  return {
    chordIndexes,
    hypothesisIndexes,
    totalScore,
    localScore,
    transitionScore,
    keys,
    modulations,
    explanations,
    // Add internal states backtracked
    states: optimalStates.map(st => st.state)
  };
}
