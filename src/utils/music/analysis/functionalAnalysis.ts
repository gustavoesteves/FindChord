// ──────────────────────────────────────────────────────────────
// Sprint 6A — Functional Analysis Facade
// ──────────────────────────────────────────────────────────────
//
// Public API for harmonic analysis. The UI should call
// `analyzeProgression()` and never use `detectKey()` or
// `getRomanNumeral()` directly.
//
// Flow:
//   progression → resolveTonalCenter() → classifyChordFunction() → FunctionalAnalysis DTO
// ──────────────────────────────────────────────────────────────

import type {
  FunctionalAnalysis,
  HarmonicFunction,
  FunctionalHypothesis,
  AnalysisTag,
  HarmonicGrammarProfile,
  TonalCenter,
  CadenceInfo,
  FunctionalChord,
  TonalRegion,
  Phrase,
  TonalRegionType,
  TonalRegionNode,
  TonalSummary
} from './models/FunctionalAnalysis';
import { resolveTonalCenter } from './tonalCenter';
import { classifyChordFunction } from './functionalClassifier';
import { analyzeSecondaryFunctions } from './secondaryAnalysis';
import { detectCadences } from './cadenceDetector';
import { analyzeModalInterchange } from './modalInterchange';
import { analyzeChromaticHarmony } from './chromaticAnalysis';
import { analyzeResolutions } from './resolutionEngine';
import { analyzeSecondaryLeadingTones } from './secondaryLeadingTone';
import { resolveGlobalPath, StaticTransitionModel, CorpusTransitionModel, HybridTransitionModel, ALL_24_KEYS, getKeyString } from './pathResolver';
import { GRAMMAR_PARAMETERS, GRAMMAR_CORPUS_TRANSITIONS } from './styleModels';

/**
 * Runs chord classification and isolation classifiers under a fixed candidate key center.
 * Used to populate the key cache prior to global Viterbi resolution.
 */
export function analyzeProgressionUnderKey(
  progression: string[],
  candidateKey: TonalCenter
): FunctionalChord[] {
  let chords = progression.map((chordSymbol, index) =>
    classifyChordFunction(chordSymbol, index, candidateKey)
  );

  chords = analyzeResolutions(chords);

  // Run all classifiers in isolation to collect hypotheses
  const secondaryHypotheses = analyzeSecondaryFunctions(chords, candidateKey);
  const leadingToneHypotheses = analyzeSecondaryLeadingTones(chords, candidateKey);
  const modalHypotheses = analyzeModalInterchange(chords, candidateKey);
  const chromaticHypotheses = analyzeChromaticHarmony(chords, candidateKey);

  // Collect and sort hypotheses for each chord
  return chords.map((chord, idx) => {
    const list: FunctionalHypothesis[] = [];

    // 1. PRIMARY: Add if diatonic
    if (chord.isDiatonic) {
      list.push({
        contextualFunction: 'PRIMARY',
        romanNumeral: chord.romanNumeral,
        harmonicFunction: chord.harmonicFunction,
        confidence: chord.confidence,
        explanation: ['Diatonic chord in this key center']
      });
    }

    // 2. Add hypotheses from secondary functions
    if (secondaryHypotheses[idx]) {
      list.push(...secondaryHypotheses[idx]);
    }

    // 3. Add hypotheses from leading tone
    if (leadingToneHypotheses[idx]) {
      list.push(...leadingToneHypotheses[idx]);
    }

    // 4. Add hypotheses from modal interchange
    if (modalHypotheses[idx]) {
      list.push(...modalHypotheses[idx]);
    }

    // 5. Add hypotheses from chromatic harmony
    if (chromaticHypotheses[idx]) {
      list.push(...chromaticHypotheses[idx]);
    }

    // Sort hypotheses list strictly by confidence descending
    const sortedHypotheses = [...list].sort((h1, h2) => h2.confidence - h1.confidence);

    return {
      ...chord,
      tonalCenter: candidateKey,
      functionalHypotheses: sortedHypotheses.length > 0 ? sortedHypotheses : undefined
    };
  });
}

/**
 * Analyzes a chord progression and returns a complete functional analysis.
 *
 * This is the single entry point for harmonic analysis in the UI layer.
 * It resolves the tonal center, classifies each chord's function, and
 * returns a frozen DTO.
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
  const globalPath = resolveGlobalPath(cache, cadencesByKey, hybridModel, initialTonalCenter);
  const resolvedKeys = globalPath.keys || [];

  // 4. Map the globally optimal path states back to the output progression
  let chords: FunctionalChord[] = [];

  for (let idx = 0; idx < progression.length; idx++) {
    const keyCenter = resolvedKeys[idx] || initialTonalCenter;
    const keyStr = getKeyString(keyCenter);
    
    const chordUnderKey = cache[keyStr][idx];
    const chosenHypIndex = globalPath.hypothesisIndexes[idx];
    const winner = chordUnderKey.functionalHypotheses?.[chosenHypIndex];

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

      chords.push({
        ...chordUnderKey,
        tonalCenter: keyCenter,
        romanNumeral: winner.romanNumeral,
        harmonicFunction: winner.harmonicFunction,
        contextualFunction: winner.contextualFunction,
        confidence: winner.confidence,
        secondaryTarget: winner.secondaryTarget,
        contextualAnalysis: winner.contextualAnalysis,
        modalBorrowing: winner.modalBorrowing,
        chromaticAnalysis: winner.chromaticAnalysis,
        explanation: winner.explanation,
        analysisTags
      });
    } else {
      chords.push({
        ...chordUnderKey,
        tonalCenter: keyCenter
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
        chord.contextualFunction = undefined;
        chord.modalBorrowing = undefined;
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
  const summary = calculateTonalSummary(chords, regions, regionTree, cadences, finalTonalCenter);

  return {
    tonalCenter: finalTonalCenter,
    chords,
    cadences,
    globalPath,
    regions,
    phrases,
    regionTree: regionTree || undefined,
    summary: summary || undefined
  };
}

export function segmentTonalRegions(
  chords: FunctionalChord[],
  cadences: CadenceInfo[],
  homeKey: TonalCenter
): TonalRegion[] {
  const regions: TonalRegion[] = [];
  if (chords.length === 0) return regions;

  let currentKey = chords[0].tonalCenter!;
  let startIndex = 0;

  for (let i = 1; i <= chords.length; i++) {
    const isEnd = i === chords.length;
    const nextKey = !isEnd ? chords[i].tonalCenter! : null;

    if (isEnd || !nextKey || nextKey.root !== currentKey.root || nextKey.mode !== currentKey.mode) {
      const endIndex = i - 1;
      const duration = endIndex - startIndex + 1;

      const cadenceIndexes: number[] = [];
      let hasCadence = false;

      cadences.forEach((cad, cadIdx) => {
        if (
          cad.endIndex >= startIndex &&
          cad.endIndex <= endIndex &&
          chords[cad.endIndex].tonalCenter?.root === currentKey.root &&
          chords[cad.endIndex].tonalCenter?.mode === currentKey.mode
        ) {
          cadenceIndexes.push(cadIdx);
          hasCadence = true;
        }
      });

      let type: TonalRegionType = 'REGIONAL_SHIFT';
      if (duration <= 2) {
        type = 'TONICIZATION';
      } else if (hasCadence) {
        type = 'ESTABLISHED_MODULATION';
      } else {
        type = 'REGIONAL_SHIFT';
      }

      const isHomeKey = currentKey.root === homeKey.root && currentKey.mode === homeKey.mode;

      const sDur = Math.min(1.0, duration / 6);
      const sCad = hasCadence ? 1.0 : 0.0;

      let diatonicCount = 0;
      for (let idx = startIndex; idx <= endIndex; idx++) {
        if (chords[idx].isDiatonic) {
          diatonicCount++;
        }
      }
      const sDiat = duration > 0 ? diatonicCount / duration : 0.0;

      let confidenceSum = 0;
      for (let idx = startIndex; idx <= endIndex; idx++) {
        confidenceSum += chords[idx].confidence;
      }
      const sConf = duration > 0 ? confidenceSum / duration : 0.0;

      const stabilityScore = 0.3 * sDur + 0.3 * sCad + 0.2 * sDiat + 0.2 * sConf;

      regions.push({
        key: currentKey,
        startIndex,
        endIndex,
        duration,
        type,
        isHomeKey,
        stabilityScore: Math.round(stabilityScore * 100) / 100,
        cadenceIndexes
      });

      if (!isEnd) {
        currentKey = nextKey!;
        startIndex = i;
      }
    }
  }

  return regions;
}

export function segmentPhrases(
  progressionLength: number,
  regions: TonalRegion[],
  cadences: CadenceInfo[]
): Phrase[] {
  const phrases: Phrase[] = [];
  if (progressionLength === 0) return phrases;

  const structuralCadences = cadences
    .map((cad, originalIdx) => ({ cad, originalIdx }))
    .filter(({ cad }) => 
      cad.type === 'PERFECT' ||
      cad.type === 'PLAGAL' ||
      cad.type === 'DECEPTIVE' ||
      cad.type === 'BACKDOOR' ||
      cad.type === 'TURNAROUND'
    );

  const rawBoundaries = Array.from(
    new Set(structuralCadences.map(({ cad }) => cad.endIndex))
  ).sort((a, b) => a - b);

  const boundaryIndices: number[] = [];
  rawBoundaries.forEach(b => {
    const isTurnaroundEnd = structuralCadences.some(({ cad }) => cad.endIndex === b && cad.type === 'TURNAROUND');
    if (isTurnaroundEnd) {
      const hasResolvingLater = structuralCadences.some(({ cad }) =>
        (cad.type === 'PERFECT' || cad.type === 'PLAGAL' || cad.type === 'DECEPTIVE') &&
        (cad.endIndex === b + 1 || cad.endIndex === b + 2)
      );
      if (hasResolvingLater) {
        return;
      }
    }
    boundaryIndices.push(b);
  });

  let phraseStart = 0;
  let phraseIndex = 0;

  const createPhrase = (start: number, end: number) => {
    const match = structuralCadences.find(({ cad }) => cad.endIndex === end);
    const terminatingCadence = match ? match.cad : undefined;

    const phraseRegions = regions.filter(r => 
      (r.startIndex >= start && r.startIndex <= end) ||
      (r.endIndex >= start && r.endIndex <= end) ||
      (r.startIndex <= start && r.endIndex >= end)
    );

    phrases.push({
      index: phraseIndex++,
      startIndex: start,
      endIndex: end,
      terminatingCadence,
      regions: phraseRegions
    });
  };

  for (const boundary of boundaryIndices) {
    if (boundary >= phraseStart && boundary < progressionLength) {
      createPhrase(phraseStart, boundary);
      phraseStart = boundary + 1;
    }
  }

  if (phraseStart < progressionLength) {
    createPhrase(phraseStart, progressionLength - 1);
  }

  return phrases;
}

// ─── UI Display Helpers ──────────────────────────────────────

/**
 * Returns a short abbreviation for a harmonic function.
 * Use this in the UI layer to keep analysis strings out of components.
 *
 *   TONIC        → "T"
 *   SUBDOMINANT  → "SD"
 *   DOMINANT     → "D"
 */
export function getFunctionLabel(fn: HarmonicFunction): string {
  switch (fn) {
    case 'TONIC':       return 'T';
    case 'SUBDOMINANT': return 'SD';
    case 'DOMINANT':    return 'D';
  }
}

/**
 * Returns a CSS-friendly color class name for a harmonic function.
 * Useful for rendering colored badges in the timeline.
 *
 *   TONIC        → "tonic"      (blue tones)
 *   SUBDOMINANT  → "subdominant" (yellow/amber tones)
 *   DOMINANT     → "dominant"    (red/rose tones)
 */
export function getFunctionColorClass(fn: HarmonicFunction): string {
  switch (fn) {
    case 'TONIC':       return 'tonic';
    case 'SUBDOMINANT': return 'subdominant';
    case 'DOMINANT':    return 'dominant';
  }
}

/**
 * Retorna o rank numérico de uma região tonal com base em sua importância funcional (Sprint 10A).
 * Ranks maiores indicam centros tonais mais estáveis e abrangentes.
 *
 *   Rank 3: Home Key (Tonalidade principal)
 *   Rank 2: Modulação estabelecida (3+ acordes + cadência)
 *   Rank 1: Desvio harmônico regional (3+ acordes sem cadência)
 *   Rank 0: Tonicização efêmera (1-2 acordes)
 */
export function getRegionRank(region: TonalRegion): number {
  if (region.isHomeKey) return 3;

  switch (region.type) {
    case 'ESTABLISHED_MODULATION':
      return 2;
    case 'REGIONAL_SHIFT':
      return 1;
    case 'TONICIZATION':
      return 0;
  }
}

/**
 * Constrói uma árvore hierárquica baseada em ranks funcionais a partir de uma lista plana de regiões.
 * Esta árvore modela a hierarquia tonal de importância funcional e subordinação de desvios.
 *
 * Utiliza referências de pai ('parent') não-enumeráveis para evitar loops de serialização JSON.
 */
export function buildTonalRegionTree(regions: TonalRegion[]): TonalRegionNode | null {
  if (regions.length === 0) return null;

  // 1. Mapeia as regiões planas para nós da árvore com IDs estáveis
  const nodes: TonalRegionNode[] = regions.map((r, index) => ({
    id: `region-node-${index}`,
    region: r,
    children: []
  }));

  // 2. A primeira região representa a tonalidade de partida (Home Key) e atua como a raiz da árvore
  const root = nodes[0];
  let currentParent = root;

  // 3. Montagem iterativa da hierarquia baseada em ranks
  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeRank = getRegionRank(node.region);
    const parentRank = getRegionRank(currentParent.region);

    if (nodeRank < parentRank) {
      // O nó atual é subordinado ao pai atual (ex: tonicização dentro de modulação estável ou home key)
      currentParent.children.push(node);
      Object.defineProperty(node, 'parent', {
        value: currentParent,
        enumerable: false,
        writable: true,
        configurable: true
      });
      // Se não for uma folha local pura (Rank > 0), ele se torna o novo escopo/pai ativo
      if (nodeRank > 0) {
        currentParent = node;
      }
    } else {
      // O nó atual tem rank igual ou superior. Subimos a árvore de pais até encontrar um nó de rank estritamente maior
      let p = currentParent;
      while (p.parent && nodeRank >= getRegionRank(p.region)) {
        p = p.parent;
      }
      p.children.push(node);
      Object.defineProperty(node, 'parent', {
        value: p,
        enumerable: false,
        writable: true,
        configurable: true
      });
      currentParent = node;
    }
  }

  return root;
}

/**
 * Helper recursivo para calcular o nível mais profundo de aninhamento na árvore de regiões.
 * O nó raiz possui nível 0, seus filhos possuem nível 1, etc.
 */
function getDeepestNesting(node: TonalRegionNode, currentLevel: number = 0): number {
  if (node.children.length === 0) return currentLevel;
  let maxSubLevel = currentLevel;
  for (const child of node.children) {
    maxSubLevel = Math.max(maxSubLevel, getDeepestNesting(child, currentLevel + 1));
  }
  return maxSubLevel;
}

/**
 * Calcula estatísticas de sumário e scores normalizados de complexidade e estabilidade tonal (Sprint 10B).
 */
export function calculateTonalSummary(
  chords: FunctionalChord[],
  regions: TonalRegion[],
  regionTree: TonalRegionNode | null,
  cadences: CadenceInfo[],
  homeKey: TonalCenter
): TonalSummary | null {
  if (chords.length === 0 || regions.length === 0) return null;

  // 1. Nível mais profundo de aninhamento
  const deepestNestingLevel = regionTree ? getDeepestNesting(regionTree, 0) : 0;

  // 2. Tonalidades únicas visitadas
  const visitedKeys: TonalCenter[] = [];
  regions.forEach(reg => {
    const exists = visitedKeys.some(k => k.root === reg.key.root && k.mode === reg.key.mode);
    if (!exists) {
      visitedKeys.push(reg.key);
    }
  });

  // 3. Contadores de modulações e tonicizações
  let modulationCount = 0;
  let tonicizationCount = 0;
  regions.forEach(reg => {
    if (!reg.isHomeKey && reg.type === 'ESTABLISHED_MODULATION') {
      modulationCount++;
    } else if (reg.type === 'TONICIZATION') {
      tonicizationCount++;
    }
  });

  // 4. Região mais longa
  let longestRegion = regions[0];
  regions.forEach(reg => {
    if (reg.duration > longestRegion.duration) {
      longestRegion = reg;
    }
  });

  // 5. Contagens auxiliares
  const cadenceCount = cadences.length;
  const resolvedCadenceCount = cadences.filter(c => c.type !== 'TURNAROUND').length;

  let modalBorrowingCount = 0;
  let secondaryFunctionCount = 0;
  let chromaticChordCount = 0;
  let totalChromaticWeight = 0;

  chords.forEach(chord => {
    if (chord.modalBorrowing) {
      modalBorrowingCount++;
    }
    const hasSecondaryTag =
      chord.analysisTags.includes('SECONDARY_DOMINANT') ||
      chord.analysisTags.includes('SECONDARY_LEADING_TONE') ||
      chord.secondaryTarget !== undefined ||
      chord.contextualAnalysis !== undefined;
    if (hasSecondaryTag) {
      secondaryFunctionCount++;
    }
    if (!chord.isDiatonic) {
      chromaticChordCount++;

      // Ponderação do peso cromático sugerido pelo usuário
      let weight = 0.5; // Peso base padrão para acordes não-diatônicos sem tags específicas
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

  // 6. Cálculo da Complexidade Tonal
  const sKeys = Math.min(1.0, visitedKeys.length / 5);
  const sDensity = totalChords > 0
    ? Math.min(1.0, (modulationCount * 1.5 + tonicizationCount * 0.5) / totalChords)
    : 0;
  const sChromatic = totalChords > 0 ? totalChromaticWeight / totalChords : 0;
  const sNesting = Math.min(1.0, deepestNestingLevel / 3);

  const rawComplexity = 0.3 * sKeys + 0.3 * sDensity + 0.2 * sChromatic + 0.2 * sNesting;
  const tonalComplexity = Math.round(Math.min(1.0, Math.max(0.0, rawComplexity)) * 100) / 100;

  // 7. Cálculo da Estabilidade Tonal
  let homeKeyChordsCount = 0;
  chords.forEach(chord => {
    if (
      chord.tonalCenter &&
      chord.tonalCenter.root === homeKey.root &&
      chord.tonalCenter.mode === homeKey.mode
    ) {
      homeKeyChordsCount++;
    }
  });
  const sHomeDuration = totalChords > 0 ? homeKeyChordsCount / totalChords : 0;

  let weightedStabilitySum = 0;
  let totalDuration = 0;
  regions.forEach(reg => {
    weightedStabilitySum += reg.stabilityScore * reg.duration;
    totalDuration += reg.duration;
  });
  const sAvgStability = totalDuration > 0 ? weightedStabilitySum / totalDuration : 0;

  const rawStability = 0.7 * sHomeDuration + 0.3 * sAvgStability;
  const tonalStability = Math.round(Math.min(1.0, Math.max(0.0, rawStability)) * 100) / 100;

  return {
    homeKey,
    tonalComplexity,
    tonalStability,
    modulationCount,
    tonicizationCount,
    longestRegion,
    deepestNestingLevel,
    visitedKeys,
    cadenceCount,
    resolvedCadenceCount,
    modalBorrowingCount,
    secondaryFunctionCount,
    chromaticChordCount
  };
}
