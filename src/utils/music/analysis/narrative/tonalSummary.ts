import type {
  FunctionalChord,
  HarmonicRegion,
  HarmonicRegionNode,
  CadenceInfo,
  TonalCenter,
  HarmonicGrammarProfile,
  TonalSummary,
  KeyRelation
} from '../models/FunctionalAnalysis';
import { getKeyRelation, getKeyTransitionMultiplier } from '../../theory/tonalRelations';
import { getDeepestNesting } from '../regions/regionTree';

/**
 * Calculates tonal summary statistics and complexity/stability scores.
 */
export function calculateTonalSummary(
  chords: FunctionalChord[],
  regions: HarmonicRegion[],
  regionTree: HarmonicRegionNode | null,
  cadences: CadenceInfo[],
  homeKey: TonalCenter,
  profile: HarmonicGrammarProfile = 'GENERAL'
): TonalSummary | null {
  if (chords.length === 0 || regions.length === 0) return null;

  // 1. Deepest nesting level in the region tree
  const deepestNestingLevel = regionTree ? getDeepestNesting(regionTree, 0) : 0;

  // 2. Unique keys visited
  const visitedKeys: TonalCenter[] = [];
  regions.forEach(reg => {
    const exists = visitedKeys.some(k => k.root === reg.baseCenter.root && k.mode === reg.baseCenter.mode);
    if (!exists) {
      visitedKeys.push(reg.baseCenter);
    }
  });

  // 3. Counters for modulations and tonicizations
  let modulationCount = 0;
  let tonicizationCount = 0;
  regions.forEach(reg => {
    if (!reg.isHomeKey && (reg.type === 'ESTABLISHED_MODULATION' || reg.type === 'MODAL_AXIS')) {
      modulationCount++;
    } else if (reg.type === 'TONICIZATION') {
      tonicizationCount++;
    }
  });

  // 4. Longest region
  let longestRegion = regions[0];
  regions.forEach(reg => {
    const longestDur = longestRegion.endIndex - longestRegion.startIndex + 1;
    const regDur = reg.endIndex - reg.startIndex + 1;
    if (regDur > longestDur) {
      longestRegion = reg;
    }
  });

  // 5. Cadence counts and regional transitions
  const cadenceCount = cadences.length;
  const resolvedCadenceCount = cadences.filter(c => c.type !== 'TURNAROUND').length;

  const regionalTransitionCount = regions.length - 1;
  const keyModulationRelations: KeyRelation[] = [];
  let transitionMultipliersProduct = 1.0;

  for (let i = 1; i < regions.length; i++) {
    const prevReg = regions[i - 1];
    const curReg = regions[i];
    
    // Classify key relation
    const relation = getKeyRelation(prevReg.baseCenter, curReg.baseCenter);
    keyModulationRelations.push(relation);

    // Get transition multiplier
    const multiplier = getKeyTransitionMultiplier(prevReg.baseCenter, curReg.baseCenter, profile);
    transitionMultipliersProduct *= multiplier;
  }

  const regionalCoherenceScore = regionalTransitionCount > 0
    ? Math.round(Math.pow(transitionMultipliersProduct, 1 / regionalTransitionCount) * 100) / 100
    : 1.0;

  let modalBorrowingCount = 0;
  let secondaryFunctionCount = 0;
  let chromaticChordCount = 0;
  let totalChromaticWeight = 0;

  chords.forEach(chord => {
    if (chord.modal?.modalBorrowing) {
      modalBorrowingCount++;
    }
    const hasSecondaryTag =
      chord.analysisTags.includes('SECONDARY_DOMINANT') ||
      chord.analysisTags.includes('SECONDARY_LEADING_TONE') ||
      chord.secondary?.secondaryTarget !== undefined ||
      chord.secondary?.contextualAnalysis !== undefined;
    if (hasSecondaryTag) {
      secondaryFunctionCount++;
    }
    if (!chord.isDiatonic) {
      chromaticChordCount++;

      // Chromatic weight calculations
      let weight = 0.5; // default weight for non-diatonic chords without specific tags
      chord.analysisTags.forEach(tag => {
        if (tag === 'SECONDARY_DOMINANT' || tag === 'BLUES_DOMINANT') {
          weight = Math.max(weight, 0.5);
        } else if (
          tag === 'MODAL_BORROWING' ||
          tag === 'SECONDARY_LEADING_TONE' ||
          tag === 'PASSING_DIMINISHED' ||
          tag === 'COMMON_TONE_DIMINISHED' ||
          tag === 'NEIGHBOR_DIMINISHED'
        ) {
          weight = Math.max(weight, 0.75);
        } else if (tag === 'TRITONE_SUBSTITUTION' || tag === 'CHROMATIC_APPROACH') {
          weight = Math.max(weight, 1.0);
        }
      });
      totalChromaticWeight += weight;
    }
  });

  const totalChords = chords.length;

  // 6. Tonal Complexity score
  const sKeys = Math.min(1.0, visitedKeys.length / 5);
  const sDensity = totalChords > 0
    ? Math.min(1.0, (modulationCount * 1.5 + tonicizationCount * 0.5) / totalChords)
    : 0;
  const sChromatic = totalChords > 0 ? totalChromaticWeight / totalChords : 0;
  const sNesting = Math.min(1.0, deepestNestingLevel / 3);

  const rawComplexity = 0.3 * sKeys + 0.3 * sDensity + 0.2 * sChromatic + 0.2 * sNesting;
  const tonalComplexity = Math.round(Math.min(1.0, Math.max(0.0, rawComplexity)) * 100) / 100;

  // 7. Tonal Stability score
  let homeKeyChordsCount = 0;
  chords.forEach(chord => {
    if (
      chord.tonal?.tonalCenter &&
      chord.tonal.tonalCenter.root === homeKey.root &&
      chord.tonal.tonalCenter.mode === homeKey.mode
    ) {
      homeKeyChordsCount++;
    }
  });
  const sHomeDuration = totalChords > 0 ? homeKeyChordsCount / totalChords : 0;

  let weightedStabilitySum = 0;
  let totalDuration = 0;
  regions.forEach(reg => {
    const regDur = reg.endIndex - reg.startIndex + 1;
    weightedStabilitySum += reg.stabilityScore * regDur;
    totalDuration += regDur;
  });
  const sAvgStability = totalDuration > 0 ? weightedStabilitySum / totalDuration : 0;

  const rawStability = 0.7 * sHomeDuration + 0.3 * sAvgStability;
  const tonalStability = Math.round(Math.min(1.0, Math.max(0.0, rawStability)) * 100) / 100;

  return {
    homeKey,
    tonalComplexity,
    tonalStability,
    regionalCoherenceScore,
    modulationCount,
    tonicizationCount,
    longestRegion,
    deepestNestingLevel,
    visitedKeys,
    regionalTransitionCount,
    keyModulationRelations,
    cadenceCount,
    resolvedCadenceCount,
    modalBorrowingCount,
    secondaryFunctionCount,
    chromaticChordCount
  };
}
