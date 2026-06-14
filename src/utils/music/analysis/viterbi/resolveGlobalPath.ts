import type {
  FunctionalChord,
  FunctionalHypothesis,
  GlobalAnalysisPath,
  TonalCenter,
  ModulationEvent,
  CadenceInfo,
  HarmonicGrammarProfile,
  HarmonicState,
  ModalMode,
  HarmonicFunction
} from '../models/FunctionalAnalysis';
import type { AdaptiveTonalState } from '../models/AdaptiveTonalState';
import { parseChord } from '../../theory/chordParser';
import { calibrateHypotheses } from '../calibration/BayesianCalibrationEngine';
import { applyMusicologicalPriors } from '../calibration/MusicologicalPriorEngine';
import { computeConsensus } from '../calibration/ConsensusModelingEngine';
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

export interface BeamPath {
  score: number;
  localScore: number;
  transitionScore: number;
  states: HarmonicState[];
  hypotheses: FunctionalHypothesis[];
  hypothesisIndexes: number[];
  consecutiveCount: number;
  explanations: string[];
}

export function getRunLength(states: HarmonicState[], index: number): number {
  const target = states[index];
  if (!target) return 0;
  let len = 1;
  // Go backwards
  for (let idx = index - 1; idx >= 0; idx--) {
    if (states[idx].root === target.root && states[idx].mode === target.mode) {
      len++;
    } else {
      break;
    }
  }
  // Go forwards
  for (let idx = index + 1; idx < states.length; idx++) {
    if (states[idx].root === target.root && states[idx].mode === target.mode) {
      len++;
    } else {
      break;
    }
  }
  return len;
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
  const progression = cache[keysInCache[0]].map(c => c.chordSymbol);

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

  // 3. Initialize Beam Search parameters
  const BEAM_WIDTH = 10;


  // Initial chord 0 first chord heuristics
  const firstChordSymbol = cache[getStateString(activeCandidates[0])][0]?.chordSymbol;
  const firstParsed = firstChordSymbol ? parseChord(firstChordSymbol) : null;
  const firstChordRoot = firstParsed && !firstParsed.empty ? firstParsed.root : null;
  const firstChordMode = firstParsed && !firstParsed.empty 
    ? (isMinorType(firstParsed.quality) ? 'AEOLIAN' : 'IONIAN')
    : null;

  // Initialize Beam paths
  let currentBeam: BeamPath[] = [];

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
        startMultiplier = isModal ? 0.20 : 1.0; // Prefer tonal keys over modal keys at path start
      } else if (isCloselyRelated(initialTonal, initialTonalCenter)) {
        startMultiplier = 0.15;
      } else {
        startMultiplier = 0.02;
      }
    }

    const localLog = Math.log(Math.max(0.01, st.hypothesis.confidence));
    const score = localLog + Math.log(startMultiplier);
    
    currentBeam.push({
      score,
      localScore: localLog,
      transitionScore: 0,
      states: [st.state],
      hypotheses: [st.hypothesis],
      hypothesisIndexes: [st.hypIndex],
      consecutiveCount: 1,
      explanations: [
        `Chord 0 (${st.originalChord.chordSymbol}): State: ${getStateString(st.state)}, ` +
        `Chosen ${st.hypothesis.contextualFunction} (${st.hypothesis.romanNumeral}) with local confidence ${st.hypothesis.confidence.toFixed(2)}`
      ]
    });
  }

  // Sort and keep top BEAM_WIDTH paths
  currentBeam.sort((a, b) => b.score - a.score);
  if (currentBeam.length > 0) {
    currentBeam = currentBeam.slice(0, BEAM_WIDTH);
  }

  // Track beam history at each step i for multi-hypothesis analysis
  const beamHistory: BeamPath[][] = [currentBeam];

  // 4. Run Beam Search for i = 1 to N-1
  for (let i = 1; i < N; i++) {
    const curCol = columns[i];
    const nextBeamCandidates: BeamPath[] = [];

    for (let k = 0; k < currentBeam.length; k++) {
      const path = currentBeam[k];
      const prevState = path.states[path.states.length - 1];
      const prevHyp = path.hypotheses[path.hypotheses.length - 1];

      for (let j = 0; j < curCol.length; j++) {
        const curState = curCol[j];

        // A. Contextual transition probability
        const baseProb = model.getProbability(
          prevHyp.contextualFunction,
          curState.hypothesis.contextualFunction
        );

        // B. Key signature transition multiplier
        const isSameState = prevState.root === curState.state.root && prevState.mode === curState.state.mode;
        const prevTonal = mapStateToTonalCenter(prevState);
        const curTonal = mapStateToTonalCenter(curState.state);
        let keyMultiplier = getKeyTransitionMultiplier(prevTonal, curTonal, profile);

        if (profile === 'MODAL_FUNCTIONAL' && !isSameState && getParentMajorChroma(prevState) === getParentMajorChroma(curState.state)) {
          keyMultiplier = 1.0;
        }

        if (profile !== 'MODAL_FUNCTIONAL' && !isSameState && curState.state.mode !== 'IONIAN' && curState.state.mode !== 'AEOLIAN') {
          keyMultiplier *= 0.50;
        }

        // C. Tonal Persistence rule
        let persistenceMultiplier = 1.0;
        if (!isSameState) {
          const prevKeyDuration = path.consecutiveCount;
          if (prevKeyDuration === 1) {
            persistenceMultiplier = 0.15;
          } else if (prevKeyDuration === 2) {
            persistenceMultiplier = 0.50;
          }
          if (i >= N - 2) {
            persistenceMultiplier *= 0.15;
          }
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
        let resolutionExpl = 'no target';
        const targetDegree = prevHyp.secondaryTarget || prevHyp.chromaticAnalysis?.targetDegree;
        
        if (targetDegree) {
          const targetOffset = getScaleDegreeOffset(targetDegree);
          const prevKeyChroma = getChroma(prevState.root);
          const absoluteTargetChroma = (prevKeyChroma + targetOffset) % 12;

          const dist = prevHyp.contextualAnalysis?.resolutionDistance || prevHyp.chromaticAnalysis?.resolutionDistance || 1;
          const targetIdx = (i - 1 + dist) % N;
          const targetChordSymbol = cache[getStateString(activeCandidates[0])][targetIdx].chordSymbol;
          const targetParsed = parseChord(targetChordSymbol);
          const targetRootChroma = getChroma(targetParsed.root);

          if (targetRootChroma === absoluteTargetChroma) {
            targetMultiplier = 1.15;
            resolutionExpl = `matched target PC (${targetParsed.root})`;
          } else {
            targetMultiplier = 0.15;
            resolutionExpl = `mismatched target PC (expected chroma ${absoluteTargetChroma}, got ${targetRootChroma})`;
          }
        }

        // F. Functional syntax matching
        let functionalMult = getFunctionalMultiplier(
          prevHyp.harmonicFunction,
          curState.hypothesis.harmonicFunction,
          profile
        );
        if (targetMultiplier > 1.0) {
          functionalMult = 1.30;
        }

        const transProbability = baseProb * keyMultiplier * persistenceMultiplier * cadenceBonus * targetMultiplier * functionalMult;
        const transitionLog = Math.log(Math.max(1e-10, transProbability));
        const localLog = Math.log(Math.max(0.01, curState.hypothesis.confidence));

        const score = path.score + transitionLog + localLog;

        let baseProbExplanation = `[Base: ${baseProb.toFixed(2)}]`;
        if (model instanceof HybridTransitionModel) {
          const details = model.getExplanations(prevHyp.contextualFunction, curState.hypothesis.contextualFunction);
          baseProbExplanation = `[Base: ${details.baseProb.toFixed(2)} (α: ${details.alpha.toFixed(2)}), Corpus: ${details.corpusProb.toFixed(2)} (β: ${details.beta.toFixed(2)}), Final Base: ${details.finalProb.toFixed(2)}]`;
        }

        const keyExpl = isSameState ? 'same state' : `state modulation to ${getStateString(curState.state)} (mult: ${keyMultiplier.toFixed(2)})`;
        const cadenceExpl = matchingCadence ? `cadence: ${matchingCadence.name}` : 'no cadence';

        nextBeamCandidates.push({
          score,
          localScore: path.localScore + localLog,
          transitionScore: path.transitionScore + transitionLog,
          states: [...path.states, curState.state],
          hypotheses: [...path.hypotheses, curState.hypothesis],
          hypothesisIndexes: [...path.hypothesisIndexes, curState.hypIndex],
          consecutiveCount: isSameState ? (path.consecutiveCount + 1) : 1,
          explanations: [
            ...path.explanations,
            `Transition ${i - 1} -> ${i} (${prevState.root} ${prevState.mode} -> ${curState.state.root} ${curState.state.mode}): ` +
            `State ${getStateString(prevState)} -> ${getStateString(curState.state)} [${keyExpl}] ` +
            `${prevHyp.contextualFunction} (${prevHyp.romanNumeral}) -> ${curState.hypothesis.contextualFunction} (${curState.hypothesis.romanNumeral}) ` +
            `${baseProbExplanation} ` +
            `[Multiplier Target: ${targetMultiplier.toFixed(2)} (${resolutionExpl}), Functional: ${functionalMult.toFixed(2)}, Cadence: ${cadenceExpl}, Persistence: ${persistenceMultiplier.toFixed(2)}]`
          ]
        });
      }
    }

    // Sort and keep top BEAM_WIDTH paths
    nextBeamCandidates.sort((a, b) => b.score - a.score);
    if (nextBeamCandidates.length > 0) {
      currentBeam = nextBeamCandidates.slice(0, BEAM_WIDTH);
    } else {
      currentBeam = [];
    }

    beamHistory.push(currentBeam);
  }

  // 5. Select overall optimal path
  const bestPath = currentBeam[0];
  if (!bestPath) {
    throw new Error('Viterbi Beam Search collapsed to 0 paths.');
  }

  // Calculate adaptive persistence threshold based on the optimal path's key persistence
  let persistenceThreshold = 3;
  if (N > 2) {
    const keyRuns: number[] = [];
    let currentRun = 1;
    for (let k = 1; k < N; k++) {
      if (bestPath.states[k].root === bestPath.states[k - 1].root && bestPath.states[k].mode === bestPath.states[k - 1].mode) {
        currentRun++;
      } else {
        keyRuns.push(currentRun);
        currentRun = 1;
      }
    }
    keyRuns.push(currentRun);
    const avgPrimaryRun = keyRuns.reduce((a, b) => a + b, 0) / keyRuns.length;
    if (avgPrimaryRun < 2.2) {
      persistenceThreshold = 1; // highly alternating (e.g. Scriabin loop, politonality)
    } else if (avgPrimaryRun < 3.2) {
      persistenceThreshold = 2; // moderately modulating (e.g. Coltrane changes)
    }
  }

  // 6. Build keys and modulations for compatibility
  const keys: TonalCenter[] = [];
  for (let i = 0; i < N; i++) {
    const tonal = mapStateToTonalCenter(bestPath.states[i]);
    keys.push({
      root: tonal.root,
      mode: tonal.mode,
      confidence: bestPath.hypotheses[i].confidence
    });
  }

  const modulations: ModulationEvent[] = [];
  for (let i = 1; i < N; i++) {
    const prevTonal = keys[i - 1];
    const curTonal = keys[i];
    const prevState = bestPath.states[i - 1];
    const curState = bestPath.states[i];
    const isSameState = prevState.root === curState.root && prevState.mode === curState.mode;

    if (!isSameState) {
      const curStateStr = getStateString(curState);
      const curKeyCadences = cadencesByKey[curStateStr] || [];
      const cadence = curKeyCadences.find(cad => i >= cad.startIndex && i <= cad.endIndex && !cad.suppressed && cad.resolution?.status !== 'INTERRUPTED' && cad.resolution?.status !== 'EVADED');
      
      const isClose = isCloselyRelated(prevTonal, curTonal);
      let confidence = isClose ? 0.70 : 0.50;
      let reason = isClose 
        ? `Regional state transition (${getStateString(prevState)} -> ${getStateString(curState)})`
        : `Distant state transition (${getStateString(prevState)} -> ${getStateString(curState)})`;

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

  // 7. Post-process final beam paths to construct AdaptiveTonalState[]
  const adaptiveTonalStates: AdaptiveTonalState[] = [];
  for (let i = 0; i < N; i++) {
    const activePaths = beamHistory[i];
    if (activePaths.length === 0) {
      const fallbackHyp = {
        root: keys[i].root,
        mode: keys[i].mode,
        probability: 1.0,
        harmonicFunction: bestPath.hypotheses[i].harmonicFunction,
        contextualFunction: bestPath.hypotheses[i].contextualFunction
      };
      const consensusRes = computeConsensus([fallbackHyp], progression[i] || 'C', progression, i);
      adaptiveTonalStates.push({
        primary: fallbackHyp,
        alternatives: [],
        certaintyLevel: 'HIGH',
        pcs: 1.0,
        pcsBeforePrior: 1.0,
        rawHypotheses: [fallbackHyp],
        mig: consensusRes.mig,
        adi: consensusRes.adi,
        cfs: consensusRes.cfs
      });
      continue;
    }

    // A. Compute normalized probabilities of paths in the final beam
    const scores = activePaths.map(p => p.score);
    const maxS = Math.max(...scores);
    const exps = scores.map(s => Math.exp(s - maxS));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(e => e / (sumExps || 1));

    // B. Group path probabilities by unique TonalCenter at index i
    const keyMap: Record<string, { tonal: TonalCenter; prob: number; harmonicFunction: HarmonicFunction; contextualFunction?: string; isPersistent: boolean }> = {};

    for (let k = 0; k < activePaths.length; k++) {
      const path = activePaths[k];
      const state = path.states[i];
      const tonal = mapStateToTonalCenter(state);
      const keyStr = `${tonal.root}_${tonal.mode}`;
      const hyp = path.hypotheses[i];
      const pathProb = probs[k];

      const runLen = getRunLength(path.states, i);
      const isPersistent = runLen >= Math.min(persistenceThreshold, N);

      if (!keyMap[keyStr]) {
        keyMap[keyStr] = {
          tonal,
          prob: pathProb,
          harmonicFunction: hyp.harmonicFunction,
          contextualFunction: hyp.contextualFunction,
          isPersistent
        };
      } else {
        keyMap[keyStr].prob += pathProb;
        if (isPersistent) {
          keyMap[keyStr].isPersistent = true;
        }
      }
    }

    // C. Convert map to sorted array of hypotheses
    const hypothesesList = Object.values(keyMap)
      .map(item => ({
        root: item.tonal.root,
        mode: item.tonal.mode === 'MINOR' ? 'MINOR' : 'MAJOR' as 'MAJOR' | 'MINOR',
        probability: item.prob,
        harmonicFunction: item.harmonicFunction,
        contextualFunction: item.contextualFunction,
        isPersistent: item.isPersistent
      }))
      .sort((a, b) => b.probability - a.probability);

    const primary = hypothesesList[0];
    const alternatives = hypothesesList.slice(1).filter(h => h.isPersistent);

    const kept = [primary, ...alternatives].map(h => ({
      root: h.root,
      mode: h.mode,
      probability: h.probability,
      harmonicFunction: h.harmonicFunction,
      contextualFunction: h.contextualFunction
    }));

    // Re-normalize raw probabilities of the kept hypotheses
    const sumKeptProbs = kept.reduce((sum, h) => sum + h.probability, 0);
    if (sumKeptProbs > 0) {
      kept.forEach(h => {
        h.probability = h.probability / sumKeptProbs;
      });
    }

    const rawHypothesesCopy = kept.map(h => ({
      root: h.root,
      mode: h.mode as 'MAJOR' | 'MINOR',
      probability: h.probability,
      harmonicFunction: h.harmonicFunction as HarmonicFunction,
      contextualFunction: h.contextualFunction
    }));

    // Apply Bayesian calibration step
    const calibrationRes = calibrateHypotheses(kept, progression[i]);
    
    // Apply Musicological priors
    const priorResult = applyMusicologicalPriors(calibrationRes.hypotheses, progression, i);
    const finalHyps = priorResult.hypotheses;

    // Compute final PCS and certaintyLevel based on finalHyps
    const finalProbs = finalHyps.map(h => h.probability);
    const finalEntropy = -finalProbs.reduce((sum, p) => p > 0 ? sum + p * Math.log(p) : sum, 0);
    const K = finalProbs.length;
    const hMax = K > 1 ? Math.log(K) : 1.0;
    const pTop = finalProbs[0] ?? 0;
    
    let pcsVal = Number((pTop * (1.0 - (hMax > 0 ? finalEntropy / hMax : 0.0))).toFixed(4));
    if (priorResult.matchedTemplate) {
      pcsVal = 0.98; // high confidence when we match an exact musicological consensus
    }

    let certaintyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    if (pcsVal > 0.80) {
      certaintyLevel = 'HIGH';
    } else if (pcsVal >= 0.50) {
      certaintyLevel = 'MEDIUM';
    } else {
      certaintyLevel = 'LOW';
    }

    const cleanedPrimary = {
      root: finalHyps[0].root,
      mode: finalHyps[0].mode,
      probability: finalHyps[0].probability,
      harmonicFunction: finalHyps[0].harmonicFunction as HarmonicFunction,
      contextualFunction: finalHyps[0].contextualFunction
    };
    const cleanedAlternatives = finalHyps.slice(1).map(alt => ({
      root: alt.root,
      mode: alt.mode,
      probability: alt.probability,
      harmonicFunction: alt.harmonicFunction as HarmonicFunction,
      contextualFunction: alt.contextualFunction
    }));

    const consensusRes = computeConsensus(finalHyps as any, progression[i], progression, i);

    adaptiveTonalStates.push({
      primary: cleanedPrimary,
      alternatives: cleanedAlternatives,
      certaintyLevel,
      pcs: pcsVal,
      pcsBeforePrior: calibrationRes.pcs,
      rawHypotheses: rawHypothesesCopy,
      mig: consensusRes.mig,
      adi: consensusRes.adi,
      cfs: consensusRes.cfs
    });
  }

  // 8. Return final analysis DTO
  return {
    chordIndexes: bestPath.hypothesisIndexes.map((_, idx) => idx),
    hypothesisIndexes: bestPath.hypothesisIndexes,
    totalScore: bestPath.score,
    localScore: bestPath.localScore,
    transitionScore: bestPath.transitionScore,
    keys,
    modulations,
    explanations: bestPath.explanations,
    states: bestPath.states,
    adaptiveTonalStates
  };
}
