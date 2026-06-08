import type {
  FunctionalAnalysis,
  HarmonicGrammarProfile,
  TonalCenter,
  CadenceInfo,
  FunctionalChord,
  AnalysisTag,
  SecondaryContext,
  ModalContext,
  HarmonicState,
  ModalMode,
  ModalAxis
} from '../models/FunctionalAnalysis';
import { resolveTonalCenter } from '../tonalCenter';
import { analyzeProgressionUnderKey, mapStateToTonalCenter } from '../facade/analyzeProgressionUnderKey';
import { detectCadences } from '../cadenceDetector';
import { resolveGlobalPath, StaticTransitionModel, CorpusTransitionModel, HybridTransitionModel, getStateString } from '../pathResolver';
import { detectModalCandidates } from '../modalAxisSolver';
import { ALL_24_KEYS } from '../../theory/pitchClass';
import { GRAMMAR_PARAMETERS, GRAMMAR_CORPUS_TRANSITIONS } from '../grammarProfiles';
import { segmentHarmonicRegions } from '../regions/regionSegmentation';
import { segmentPhrases } from '../narrative/phraseSegmentation';
import { buildHarmonicRegionTree } from '../regions/regionTree';
import { calculateTonalSummary } from '../narrative/tonalSummary';
import { generateTonalNarrative } from '../narrative/tonalNarrative';
import { analyzeSemanticContext } from '../narrative/semanticAnalyzer';

/**
 * Analyzes a chord progression and returns a complete functional analysis.
 *
 * This is the orchestrator pipeline for harmonic analysis.
 *
 * @param progression - Array of chord symbols (e.g. ["Dm7", "G7", "Cmaj7"])
 * @param profile - The harmonic grammar profile to analyze with (COMMON_PRACTICE, EXTENDED_FUNCTIONAL, etc.)
 * @returns FunctionalAnalysis DTO
 */
export function analyzeProgression(
  progression: string[],
  profile: HarmonicGrammarProfile = 'GENERAL'
): FunctionalAnalysis {
  if (progression.length === 0) {
    return {
      tonalCenter: { root: 'C', mode: 'MAJOR', confidence: 0 },
      chords: [],
      cadences: []
    };
  }

  const initialTonalCenter = resolveTonalCenter(progression);

  // 1. Build active candidate list (24 tonal keys + top-N modal candidates)
  const modalCandidates = detectModalCandidates(progression, 3);
  const tonalCandidates = ALL_24_KEYS.map(k => ({
    root: k.root,
    mode: (k.mode === 'MAJOR' ? 'IONIAN' : 'AEOLIAN') as ModalMode
  }));
  const candidates: HarmonicState[] = [...tonalCandidates, ...modalCandidates];

  // 2. Build cache of pre-analyzed chords and cadences for candidate states
  const cache: Record<string, FunctionalChord[]> = {};
  const cadencesByKey: Record<string, CadenceInfo[]> = {};

  for (const state of candidates) {
    const keyCenter = mapStateToTonalCenter(state);
    const stateStr = getStateString(state);
    
    const analyzedChords = analyzeProgressionUnderKey(progression, state);
    cache[stateStr] = analyzedChords;
    cadencesByKey[stateStr] = detectCadences(analyzedChords, keyCenter, state.mode);
  }

  // 3. Instantiate transition model based on profile parameters
  const params = GRAMMAR_PARAMETERS[profile];
  const corpusTransitions = GRAMMAR_CORPUS_TRANSITIONS[profile];
  
  const theoryModel = new StaticTransitionModel();
  const corpusModel = new CorpusTransitionModel(corpusTransitions);
  const hybridModel = new HybridTransitionModel(
    theoryModel,
    corpusModel,
    params.theoryWeight,
    params.corpusWeight
  );

  // 4. Run the global path resolver (Viterbi Engine)
  const globalPath = resolveGlobalPath(cache, cadencesByKey, hybridModel, initialTonalCenter, profile, candidates);
  const resolvedStates: HarmonicState[] = globalPath.states || [];
  const resolvedKeys = globalPath.keys || [];

  // 5. Map the globally optimal path states back to the output progression
  const chords: FunctionalChord[] = [];

  for (let idx = 0; idx < progression.length; idx++) {
    const state = resolvedStates[idx] || {
      root: initialTonalCenter.root,
      mode: (initialTonalCenter.mode === 'MAJOR' ? 'IONIAN' : 'AEOLIAN') as ModalMode
    };
    const keyCenter = mapStateToTonalCenter(state);
    const stateStr = getStateString(state);
    
    const chordUnderKey = cache[stateStr][idx];
    const chosenHypIndex = globalPath.hypothesisIndexes[idx];
    const winner = chordUnderKey.debug?.functionalHypotheses?.[chosenHypIndex];

    if (winner) {
      const analysisTags = [...chordUnderKey.analysisTags];

      // Add tag for non-PRIMARY functions
      if (winner.contextualFunction !== 'PRIMARY') {
        const tag = winner.contextualFunction as AnalysisTag;
        if (!analysisTags.includes(tag)) {
          analysisTags.push(tag);
        }
      }

      // Picardy third logic check
      if (
        winner.contextualFunction === 'MODAL_BORROWING' &&
        winner.modalBorrowing?.sourceMode === 'IONIAN' &&
        idx === progression.length - 1 &&
        keyCenter.mode === 'MINOR'
      ) {
        if (!analysisTags.includes('PICARDY_THIRD')) {
          analysisTags.push('PICARDY_THIRD');
        }
      }

      const secondaryContext = (winner.contextualFunction === 'SECONDARY_DOMINANT' ||
        winner.contextualFunction === 'TRITONE_SUBSTITUTION' ||
        winner.contextualFunction === 'SECONDARY_LEADING_TONE')
          ? {
              secondaryTarget: winner.secondaryTarget || '',
              contextualAnalysis: winner.contextualAnalysis!,
              contextualFunction: winner.contextualFunction as SecondaryContext['contextualFunction']
            }
          : undefined;

      const isModalMode = state.mode !== 'IONIAN' && state.mode !== 'AEOLIAN';
      const modalAxisContext = isModalMode
        ? {
            axis: `${state.mode}_AXIS` as ModalAxis,
            mode: state.mode,
            confidence: 0.90,
            active: true
          }
        : undefined;

      let modalContext = undefined;
      if (winner.contextualFunction === 'MODAL_BORROWING' ||
          winner.contextualFunction === 'PASSING_DIMINISHED' ||
          winner.contextualFunction === 'COMMON_TONE_DIMINISHED' ||
          winner.contextualFunction === 'NEIGHBOR_DIMINISHED' ||
          winner.contextualFunction === 'CHROMATIC_APPROACH' ||
          isModalMode) {
        
        let contextualFunctionValue: ModalContext['contextualFunction'] = 'MODAL_AXIS';
        if (winner.contextualFunction !== 'PRIMARY') {
          contextualFunctionValue = winner.contextualFunction as ModalContext['contextualFunction'];
        }
        
        modalContext = {
          contextualFunction: contextualFunctionValue,
          modalBorrowing: winner.modalBorrowing,
          chromaticAnalysis: winner.chromaticAnalysis,
          axisContext: modalAxisContext
        };
      }

      let resolutionEvidence = undefined;
      if (winner.evidence) {
        resolutionEvidence = {
          commonTones: winner.evidence.commonTones || 0,
          semitoneResolutions: winner.evidence.stepwiseCount || 0,
          harmonicResolutionScore: winner.evidence.resolutionScore || 0,
          targetChordIndex: winner.evidence.targetChordIndex || 0
        };
      } else if (chordUnderKey.resolution?.resolutionEvidence) {
        const ev = chordUnderKey.resolution.resolutionEvidence;
        resolutionEvidence = {
          commonTones: ev.commonTones,
          semitoneResolutions: ev.ascendingSemitoneResolutions + ev.descendingSemitoneResolutions,
          harmonicResolutionScore: ev.harmonicResolutionScore,
          targetChordIndex: ev.targetChordIndex
        };
      }

      chords.push({
        ...chordUnderKey,
        state,
        contextualFunction: winner.contextualFunction,
        resolutionEvidence,
        explanation: winner.explanation,
        tonal: { tonalCenter: keyCenter },
        romanNumeral: winner.romanNumeral,
        harmonicFunction: winner.harmonicFunction,
        confidence: winner.confidence,
        secondary: secondaryContext,
        modal: modalContext,
        debug: {
          ...chordUnderKey.debug,
          explanation: winner.explanation
        },
        analysisTags
      });
    } else {
      chords.push({
        ...chordUnderKey,
        state,
        contextualFunction: 'PRIMARY',
        explanation: ['Diatonic chord in this key center'],
        tonal: { tonalCenter: keyCenter }
      });
    }
  }

  // 6. Select cadences that align with the Viterbi path's chosen local keys
  const cadences: CadenceInfo[] = [];
  for (const state of candidates) {
    const stateStr = getStateString(state);
    const keyCadences = cadencesByKey[stateStr] || [];
    for (const cad of keyCadences) {
      let pathMatchesKey = true;
      for (let idx = cad.startIndex; idx <= cad.endIndex; idx++) {
        const pathState = resolvedStates[idx];
        if (pathState.root !== state.root || pathState.mode !== state.mode) {
          pathMatchesKey = false;
          break;
        }
      }
      if (pathMatchesKey) {
        cadences.push(cad);
      }
    }
  }

  // 6b. Post-process to clear modal borrowing for backdoor dominant chords
  for (const cad of cadences) {
    if (cad.type === 'AUTHENTIC' && cad.name.includes('Backdoor')) {
      const backdoorChordIdx = cad.startIndex;
      const chord = chords[backdoorChordIdx];
      if (chord) {
        chord.modal = undefined;
        chord.analysisTags = chord.analysisTags.filter(t => t !== 'MODAL_BORROWING');
      }
    }
  }

  // 7. Set global center tonal as the starting key signature in Viterbi
  const finalTonalCenter: TonalCenter = resolvedKeys.length > 0
    ? {
        root: resolvedKeys[0].root,
        mode: resolvedKeys[0].mode,
        confidence: initialTonalCenter.confidence
      }
    : initialTonalCenter;

  // 8. Segment regions and phrases (Sprint Infra-1)
  const regions = segmentHarmonicRegions(chords, cadences, finalTonalCenter);
  const phrases = segmentPhrases(progression.length, regions, cadences);

  // 8b. Perform semantic analysis (Sprint F6)
  analyzeSemanticContext(chords, phrases);

  // 9. Build region tree hierarchy (Sprint Infra-1)
  const regionTree = buildHarmonicRegionTree(regions);

  // 10. Calculate summary (Sprint Infra-1)
  const summary = calculateTonalSummary(chords, regions, regionTree, cadences, finalTonalCenter, profile);

  // 11. Generate tonal narrative (Sprint Infra-1)
  const narrative = summary
    ? generateTonalNarrative(regions, regionTree, chords, summary)
    : undefined;

  return {
    tonalCenter: finalTonalCenter,
    chords,
    cadences,
    globalPath,
    regions,
    phrases,
    regionTree: regionTree || undefined,
    summary: summary || undefined,
    narrative: narrative || undefined
  };
}
