// @ts-nocheck
import type { RegionType } from "../regions/OntologyRegion";

export type SelectionScope = 'CHORD' | 'REGION' | 'SECTION';

export interface MutationIntent {
  category: RouteCategory;
  strategy: HarmonicStrategy;
  targetRegionId: string;
  intensity: number; // 0-1
  confidence: number;
}

export interface SuggestedChord {
  index?: number;
  original: string;
  suggested: string;
  reason: string;
}

export type HarmonicStrategy =
  | 'SECONDARY_DOMINANT'
  | 'BACKDOOR_CADENCE'
  | 'TRITONE_SUBSTITUTION'
  | 'MODAL_BORROWING'
  | 'DECEPTIVE_CADENCE'
  | 'CHROMATIC_APPROACH'
  | 'PASSING_DIMINISHED'
  | 'COMMON_TONE_DIMINISHED'
  | 'OMNIBUS_PROGRESSION'
  | 'VOICE_EXCHANGE'
  | 'UNKNOWN';

export type MusicalGoal =
  | 'INCREASE_TENSION'
  | 'SOFTEN_RESOLUTION'
  | 'EXTEND_PROLONGATION'
  | 'ADD_COLOR'
  | 'CREATE_SURPRISE'
  | 'INCREASE_FORWARD_MOTION';

export type RouteCategory = 
  | 'TENSION' 
  | 'COLOR' 
  | 'MOTION' 
  | 'SURPRISE';

export type MelodicRelation = 
  | 'CHORD_TONE' 
  | 'EXTENSION' 
  | 'TENSION' 
  | 'FRICTION' 
  | 'UNSTABLE_COLOR'
  | 'CLASH';

export type IntervalClass = 
  | 'UNISON' | 'MINOR_SECOND' | 'MAJOR_SECOND' | 'MINOR_THIRD' 
  | 'MAJOR_THIRD' | 'PERFECT_FOURTH' | 'TRITONE' | 'PERFECT_FIFTH'
  | 'MINOR_SIXTH' | 'MAJOR_SIXTH' | 'MINOR_SEVENTH' | 'MAJOR_SEVENTH';

export interface MusicalInterpretation {
  intervalClass: IntervalClass;
  relation: MelodicRelation;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

export type VoiceLeadingRelation =
  | 'PEDAL'
  | 'CHROMATIC_RESOLUTION'
  | 'STEPWISE'
  | 'FUNCTIONAL'
  | 'TRITONE_LEAP'
  | 'ABRUPT';

export interface ValidationObservation {
  type: MelodicRelation | VoiceLeadingRelation | 'ONTOLOGICAL' | 'SECTION' | 'RHYTHMIC_ACCENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export type ComparisonAxis = 'MELODY' | 'VOICE_LEADING' | 'ONTOLOGY' | 'SECTION' | 'CHARACTER' | 'AFFINITY';

export interface ComparisonPoint {
  axis: ComparisonAxis;
  advantage: boolean;
  description: string;
}

export interface PerspectiveComparison {
  perspectiveAId: string;
  perspectiveBId: string;
  points: ComparisonPoint[];
}

export interface PerspectiveCluster {
  id: string;
  category: RouteCategory;
  name: string;
  topPerspectiveId: string;
  perspectives: HarmonicPerspective[];
  overallClusterScore: number;
  tradeoffsAgainstWinningCluster?: string[];
}

import { MelodicAnchor } from "./MelodicAnchor";

export interface MelodyExtractionResult {
  notes: MelodicAnchor[];
  confidence: number;
  source: 'highest_note' | 'single_voice' | 'explicit_staff';
}

export interface VoiceLeadingScore {
  smoothness: number;           // Saltos físicos entre os voicings (0-100)
  melodicCompatibility: number; // Consonância com a melodia (0-100)
  bassCoherence: number;        // Lógica do movimento do baixo (0-100)
  harmonicPlausibility: number; // Coesão funcional do encadeamento (0-100)
  overall: number;              // Score agregado ponderado
}

export interface ExplorationResult {
  winningPerspectiveId: string;
  linearRanking: HarmonicPerspective[];
  clusters: PerspectiveCluster[];
}

export interface HarmonicPerspective {
  id: string;
  sourceRegionId: string;
  sourceRegionType: RegionType;
  
  strategy: HarmonicStrategy;
  category: RouteCategory;
  goal: MusicalGoal;

  originalChords: string[];
  examples: SuggestedChord[]; // F13.2 pedagogical focus: these are just examples of the strategy
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  affectedTicks: {
    start: number;
    end: number;
  };

  confidence: number;
  expectedEffects: string[];

  // F13.3 Analytical Validation
  melodicInteractionScore?: number; // 0-100% (kept for backwards compat)
  voiceLeadingScore: VoiceLeadingScore;
  observations: ValidationObservation[];

  // F13.4 Ontological Validation
  ontologicalCohesionScore?: number; // 0-100%
  ontologicalObservations?: ValidationObservation[];
  
  // F13.5 Section Validation
  sectionAlignmentScore?: number; // 0-100%
  sectionObservations?: ValidationObservation[];
  
  // Overall Final Metric
  overallPerspectiveScore?: number; // 0-100%
  rankingReason?: string;
  
  // F13.6 Multi-criteria Comparisons
  comparisons?: PerspectiveComparison[];
}

export type SuggestedRoute = HarmonicPerspective; // Alias for smooth transition
