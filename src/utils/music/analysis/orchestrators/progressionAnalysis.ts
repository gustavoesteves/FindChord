import type {
  FunctionalAnalysis,
  HarmonicGrammarProfile,
  TonalCenter,
  CadenceInfo,
  FunctionalChord,
  AnalysisTag,
  SecondaryContext,
  ModalContext
} from '../models/FunctionalAnalysis';
import { resolveTonalCenter } from '../tonalCenter';
import { analyzeProgressionUnderKey } from '../facade/analyzeProgressionUnderKey';
import { detectCadences } from '../cadenceDetector';
import { resolveGlobalPath, StaticTransitionModel, CorpusTransitionModel, HybridTransitionModel } from '../pathResolver';
import { ALL_24_KEYS, getKeyString } from '../../theory/pitchClass';
import { GRAMMAR_PARAMETERS, GRAMMAR_CORPUS_TRANSITIONS } from '../grammarProfiles';
import { segmentTonalRegions } from '../regions/regionSegmentation';
import { segmentPhrases } from '../narrative/phraseSegmentation';
import { buildTonalRegionTree } from '../regions/regionTree';
import { calculateTonalSummary } from '../narrative/tonalSummary';
import { generateTonalNarrative } from '../narrative/tonalNarrative';

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

  // 1. Build cache of pre-analyzed chords and cadences for all 24 key centers
  const cache: Record<string, FunctionalChord[]> = {};
  const cadencesByKey: Record<string, CadenceInfo[]> = {};

  for (const key of ALL_24_KEYS) {
    const keyCenter: TonalCenter = {
      root: key.root,
      mode: key.mode,
      confidence: 1.0
    };
    const keyStr = getKeyString(key);
    
    const analyzedChords = analyzeProgressionUnderKey(progression, keyCenter);
    cache[keyStr] = analyzedChords;
    cadencesByKey[keyStr] = detectCadences(analyzedChords, keyCenter);
  }

  // 2. Instantiate transition model based on profile parameters
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

  // 3. Run the global path resolver (Viterbi Engine)
  const globalPath = resolveGlobalPath(cache, cadencesByKey, hybridModel, initialTonalCenter, profile);
  const resolvedKeys = globalPath.keys || [];

  // 4. Map the globally optimal path states back to the output progression
  const chords: FunctionalChord[] = [];

  for (let idx = 0; idx < progression.length; idx++) {
    const keyCenter = resolvedKeys[idx] || initialTonalCenter;
    const keyStr = getKeyString(keyCenter);
    
    const chordUnderKey = cache[keyStr][idx];
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

      const modalContext = (winner.contextualFunction === 'MODAL_BORROWING' ||
        winner.contextualFunction === 'PASSING_DIMINISHED' ||
        winner.contextualFunction === 'COMMON_TONE_DIMINISHED' ||
        winner.contextualFunction === 'NEIGHBOR_DIMINISHED' ||
        winner.contextualFunction === 'CHROMATIC_APPROACH')
          ? {
              contextualFunction: winner.contextualFunction as ModalContext['contextualFunction'],
              modalBorrowing: winner.modalBorrowing,
              chromaticAnalysis: winner.chromaticAnalysis
            }
          : undefined;

      chords.push({
        ...chordUnderKey,
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
        tonal: { tonalCenter: keyCenter }
      });
    }
  }

  // 5. Select cadences that align with the Viterbi path's chosen local keys
  const cadences: CadenceInfo[] = [];
  for (const key of ALL_24_KEYS) {
    const keyStr = getKeyString(key);
    const keyCadences = cadencesByKey[keyStr] || [];
    for (const cad of keyCadences) {
      let pathMatchesKey = true;
      for (let idx = cad.startIndex; idx <= cad.endIndex; idx++) {
        if (resolvedKeys[idx].root !== key.root || resolvedKeys[idx].mode !== key.mode) {
          pathMatchesKey = false;
          break;
        }
      }
      if (pathMatchesKey) {
        cadences.push(cad);
      }
    }
  }

  // 5b. Post-process to clear modal borrowing for backdoor dominant chords
  for (const cad of cadences) {
    if (cad.type === 'BACKDOOR') {
      const backdoorChordIdx = cad.startIndex;
      const chord = chords[backdoorChordIdx];
      if (chord) {
        chord.modal = undefined;
        chord.analysisTags = chord.analysisTags.filter(t => t !== 'MODAL_BORROWING');
      }
    }
  }

  // 6. Set global center tonal as the starting key signature in Viterbi
  const finalTonalCenter: TonalCenter = resolvedKeys.length > 0
    ? {
        root: resolvedKeys[0].root,
        mode: resolvedKeys[0].mode,
        confidence: initialTonalCenter.confidence
      }
    : initialTonalCenter;

  // 7. Segment regions and phrases (Sprint 9B)
  const regions = segmentTonalRegions(chords, cadences, finalTonalCenter);
  const phrases = segmentPhrases(progression.length, regions, cadences);

  // 8. Build region tree hierarchy (Sprint 10A)
  const regionTree = buildTonalRegionTree(regions);

  // 9. Calculate summary (Sprint 10B)
  const summary = calculateTonalSummary(chords, regions, regionTree, cadences, finalTonalCenter, profile);

  // 10. Generate tonal narrative (Sprint 12A)
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
