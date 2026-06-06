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
} from './models/FunctionalAnalysis';
import { resolveTonalCenter } from './tonalCenter';
import { classifyChordFunction } from './functionalClassifier';
import { analyzeSecondaryFunctions } from './secondaryAnalysis';

/**
 * Analyzes a chord progression and returns a complete functional analysis.
 *
 * This is the single entry point for harmonic analysis in the UI layer.
 * It resolves the tonal center, classifies each chord's function, and
 * returns a frozen DTO.
 *
 * @param progression - Array of chord symbols (e.g. ["Dm7", "G7", "Cmaj7"])
 * @returns FunctionalAnalysis DTO
 *
 * @example
 * ```ts
 * const analysis = analyzeProgression(["Dm7", "G7", "Cmaj7"]);
 * // analysis.tonalCenter → { root: "C", mode: "MAJOR", confidence: 0.95 }
 * // analysis.chords[0] → { romanNumeral: "iim7", harmonicFunction: "SUBDOMINANT", ... }
 * ```
 */
export function analyzeProgression(progression: string[]): FunctionalAnalysis {
  const tonalCenter = resolveTonalCenter(progression);

  let chords = progression.map((chordSymbol, index) =>
    classifyChordFunction(chordSymbol, index, tonalCenter)
  );

  chords = analyzeSecondaryFunctions(chords, tonalCenter);

  return {
    tonalCenter,
    chords,
  };
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
