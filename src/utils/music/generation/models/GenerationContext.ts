import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';

/**
 * A extracted melody tied to a structural harmony.
 */
export interface MelodicPhrase {
  id: string;
  anchors: MelodicAnchor[];
}

/**
 * A single note extracted from the melody. 
 * Structural notes demand strict harmonic compatibility.
 * Ornamental notes (passing, appoggiatura) tolerate more friction.
 */
export interface MelodicAnchor {
  noteName: string;         // e.g. "C4"
  midiNote: number;         // e.g. 60
  isStructural: boolean;    // true if on strong beat or long duration
  isOrnamental: boolean;    // true if passing tone
}

/**
 * The compositional intent behind a generation.
 */
export interface HarmonicGoal {
  type: 'AvoidResolution' | 'PrepareModulation' | 'IncreaseEnergy' | 'DesestabilizeCenter' | 'Custom';
  description: string;
}

/**
 * The practical limits to the generation.
 */
export interface HarmonicConstraint {
  type: 'PreserveBass' | 'LimitChromaticism' | 'PreserveTonalCenter' | 'AvoidComplexExtensions' | 'Custom';
  description: string;
}

/**
 * The contract between the system and the user on what to preserve from the original phrase.
 */
export interface PreservationContract {
  preserveMelody: boolean;
  preserveCadentialFunction: boolean;
  preserveTonalCenter: boolean;
  allowDensityChange: boolean;
  allowSecondaryDominants: boolean;
}

/**
 * The unified DTO sent from the Composer Mode to the RouteExplorerOrchestrator.
 */
export interface GenerationRequest {
  goals: HarmonicGoal[];
  constraints: HarmonicConstraint[];
  preservation: PreservationContract;
  // Controls from UI
  explorationIntensity: 'Low' | 'Medium' | 'High';
  memoryIntensity: 'Low' | 'Medium' | 'High';
}

/**
 * The atomic unit of substitution. 
 * Represents a block of chords serving a unified structural purpose.
 */
export interface HarmonicRegion {
  id: string;
  name: string; // e.g. "Establishment Region", "Dominant Region"
  function: 'Establishment' | 'Predominant' | 'Dominant' | 'Cadential' | 'Prolongation';
  originalChords: CanonicalChordEvent[];
  startMeasure: number;
  endMeasure: number;
}

/**
 * The unified output of the PhraseFunctionEngine before passing to the RegionEngine.
 */
export interface PhraseAnalysis {
  regions: HarmonicRegion[];
  functionNarrative: string;
  tonalCenter: string;
  cadentialWeight: number;
  directionalVector: number;
}

