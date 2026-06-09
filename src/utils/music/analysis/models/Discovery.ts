import type { HarmonicFingerprint, FingerprintDensity } from './HarmonicFingerprint';
import type { SimilarityResult, SimilarityWeights } from './Similarity';

export type DiscoveryStrategy = 
  | 'OVERALL'
  | 'STRUCTURAL'
  | 'HARMONIC'
  | 'FORMAL'
  | 'REGIONAL'
  | 'FUNCTIONAL'
  | 'VOICE_LEADING';

export type SimilarityAxis =
  | 'STRUCTURAL'
  | 'HARMONIC'
  | 'FORMAL'
  | 'REGIONAL'
  | 'FUNCTIONAL'
  | 'VOICE_LEADING'
  | 'APPARENT_FUNCTION';

export type EvidenceLayer =
  | 'LAYER_1'
  | 'LAYER_2'
  | 'LAYER_3'
  | 'LAYER_4'
  | 'LAYER_5'
  | 'LAYER_6'
  | 'LAYER_7';

export type EvidenceSourceType =
  | 'FUNCTION_EVENT'
  | 'VOICE_LEADING_EVENT'
  | 'APPARENT_FUNCTION_EVENT'
  | 'SIMILARITY_AXIS'
  | 'TRANSFORMATION';

export type EvidenceOrigin =
  | 'QUERY'
  | 'MATCH'
  | 'COMPARISON';

export type EvidenceLevel =
  | 'OBSERVATION'
  | 'INTERPRETATION'
  | 'CONCLUSION';

export type EvidenceNodeId = string;

export interface EvidenceNode {
  id: EvidenceNodeId;
  layer: EvidenceLayer;
  sourceType: EvidenceSourceType;
  origin: EvidenceOrigin;
  level: EvidenceLevel;
  sourceIndex?: number;
  weight: number;
  summary: string;
  metadata?: Record<string, unknown>;
}

export type EvidenceRelation = 
  | 'SUPPORTS' 
  | 'SUPPORTED_BY' 
  | 'DERIVES_FROM' 
  | 'CONTRADICTS';

export interface EvidenceLink {
  from: EvidenceNodeId;
  to: EvidenceNodeId;
  relation: EvidenceRelation;
}

export interface DependencyEdge {
  from: string;
  to: string;
  strength: number;
}

export interface EvidenceGraph {
  nodes: EvidenceNode[];
  links: EvidenceLink[];
  dependencyEdges?: DependencyEdge[];
}

export interface EvidenceTrace {
  targetNodeId: EvidenceNodeId;
  path: EvidenceNodeId[];
}

export type ContributionRole =
  | 'PRIMARY_CAUSE'
  | 'SECONDARY_CAUSE'
  | 'SUPPORTING_FACTOR';

export interface EvidenceContribution {
  nodeId: EvidenceNodeId;
  contribution: number;
  rank: number;
  role: ContributionRole;
}

export interface EvidenceExplanationGroup {
  nodeIds: EvidenceNodeId[];
  summaries: string[];
}

export interface EvidenceExplanation {
  primaryEvidence: EvidenceExplanationGroup;
  secondaryEvidence: EvidenceExplanationGroup;
  supportingEvidence: EvidenceExplanationGroup;
}

export interface SimilarityInsight {
  axis: SimilarityAxis;
  score: number;
  importance: number;  // Relative impact of this axis on the final decision [0.0 - 1.0]
  evidence?: string[]; // Raw analytical metrics
  explanation: {
    technical: string;   // Formal music theory description
    pedagogical: string; // Intuitive musical description
  };
  evidenceNodeIds?: EvidenceNodeId[];
}

export interface InterpretiveInsight {
  source: 'APPARENT_FUNCTION' | 'VOICE_LEADING' | 'SEMANTICS';
  importance: number;
  evidence?: string[];
  explanation: {
    technical: string;
    pedagogical: string;
  };
  evidenceNodeIds?: EvidenceNodeId[];
}

export type TransformationMechanism =
  | 'TRITONE_SUBSTITUTION'
  | 'MODAL_BORROWING'
  | 'SECONDARY_DOMINANT'
  | 'CHROMATIC_PREDOMINANT'
  | 'CADENTIAL_REINTERPRETATION'
  | 'FUNCTIONAL_COMPRESSION'
  | 'FUNCTIONAL_EXPANSION';

export type TransformationEffect =
  | 'VOICE_LEADING_PRESERVATION'
  | 'BASS_SMOOTHING'
  | 'FUNCTION_PRESERVATION'
  | 'TENSION_PRESERVATION';

export interface PedagogicalTransformation {
  mechanism: TransformationMechanism;
  effects: TransformationEffect[];
  technicalDescription: string;
  pedagogicalDescription: string;
  evidenceNodeIds?: EvidenceNodeId[];
}

export type HarmonicGoal =
  | 'INCREASE_TENSION'
  | 'REDUCE_TENSION'
  | 'INCREASE_CHROMATICISM'
  | 'SMOOTHER_BASS'
  | 'PRESERVE_FUNCTION'
  | 'JAZZIFY'
  | 'SIMPLIFY'
  | 'INCREASE_DRAMA';

export interface TransformationOutcome {
  tensionDelta: number;
  chromaticismDelta: number;
  bassSmoothnessDelta: number;
  functionalStabilityDelta: number;
  voiceLeadingDelta: number;
}

export interface TransformationTemplate {
  id: string;
  mechanism: TransformationMechanism;
  preconditions: string[];
  effects: string[];
  reversibility: number;
  confidence: number;
  expectedOutcome: TransformationOutcome;
}

export type TransformationFamily =
  | 'FUNCTIONAL_SUBSTITUTION'
  | 'MODAL_REINTERPRETATION'
  | 'CADENTIAL_REINTERPRETATION'
  | 'PATH_OPTIMIZATION'
  | 'TENSION_INJECTION';

export interface TransformationOpportunity {
  id: string;
  chordIndex: number;
  mechanism: TransformationMechanism;
  confidence: number;
  musicalImpact: number;
  similarityImpact: number;
  pedagogicalValue: number;
  physicalComplexity: number;
  prerequisiteOpportunities?: string[];
  conflictingOpportunities?: string[];
  evidenceNodeIds?: string[];
  references?: number[];
}

export interface TransformationState {
  appliedTransformations: string[];
}

export interface TransformationNode {
  id: string;
  opportunityId: string;
  family: TransformationFamily;
  confidence: number;
  musicalImpact: number;
  similarityImpact: number;
  physicalComplexity: number;
  pedagogicalDifficulty: number;
  references?: number[];
}

export type TransformationRelation =
  | 'ENABLES'
  | 'CONFLICTS_WITH'
  | 'REINFORCES'
  | 'WEAKENS';

export interface TransformationEdge {
  from: string;
  to: string;
  relation: TransformationRelation;
  stateDelta?: string[];
}

export interface TransformationGraph {
  nodes: TransformationNode[];
  edges: TransformationEdge[];
}

export interface TransformationApplication {
  transformationId: string;
  originalProgression: string[];
  transformedProgression: string[];
  appliedAtChordIndex: number;
  explanation: string;
}

export interface TransformationExecutionResult {
  applications: TransformationApplication[];
  finalProgression: string[];
  confidence: number;
}

export interface RecommendationPath {
  steps: TransformationNode[];
  accumulatedImpact: number;
  accumulatedDifficulty: number;
  executionResult?: TransformationExecutionResult;
}

export type HarmonicCategory =
  | 'DIATONIC_AXIS'
  | 'CIRCLE_OF_FIFTHS'
  | 'MODAL_BORROWING'
  | 'CHROMATIC_SUBSTITUTION'
  | 'SECONDARY_DOMINANT'
  | 'DECEPTIVE_RESOLUTION'
  | 'PLAGAL_MOVEMENT';

export type FunctionalCategory =
  | 'TONIC_EXPANSION'
  | 'PREDOMINANT_DOMINANT_TONIC'
  | 'CADENTIAL_PROGRESSION'
  | 'INTERRUPTED_RESOLUTION'
  | 'REGIONAL_MOTION';

export interface CachedFingerprint {
  density: FingerprintDensity;
  fingerprint: HarmonicFingerprint;
}

export interface CorpusItem {
  id: string;
  name: string;
  progression: string[];
  harmonicCategory?: HarmonicCategory;
  functionalCategory?: FunctionalCategory;
  sourceReference?: string; // Optional historical metadata
  description?: string;
  cachedFingerprint?: CachedFingerprint; // Density-specific cached fingerprint
}

export interface PrepareCorpusOptions {
  density?: FingerprintDensity;
  tuning?: string[];
}

export interface DiscoveryOptions {
  strategy?: DiscoveryStrategy;
  limit?: number;
  minScore?: number;
  customWeights?: Partial<SimilarityWeights>;
  filters?: {
    harmonicCategory?: HarmonicCategory;
    functionalCategory?: FunctionalCategory;
    minChordsCount?: number;
    maxChordsCount?: number;
  };
  goal?: HarmonicGoal;
}

export interface DiscoveryPrimaryReason {
  type: string;
  confidence: number;
}

export type SensitivityTier =
  | 'CRITICAL'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW';

export interface CounterfactualResult {
  nodeId: string;
  originalScore: number;
  counterfactualScore: number;
  scoreImpact: number;
  impactPercentage: number;
  causalImportance: number;
  tier: SensitivityTier;
  localImpact: number;
  globalImpact: number;
}

export interface SensitivityAnalysis {
  results: CounterfactualResult[];
  dominantFactor?: string;
  counterfactualFormulaVersion?: string;
}

export interface DiscoveryMatch {
  item: CorpusItem;
  score: number; // strategy-specific score (0.0 to 1.0)
  report: SimilarityResult;
  fingerprint: HarmonicFingerprint;
  explanation?: string; // High-level natural language pedagogical report
  topInsights?: SimilarityInsight[]; // Sorted similarity insights
  interpretiveInsights?: InterpretiveInsight[]; // Retrospective interpretive insights
  transformations?: PedagogicalTransformation[]; // Rearmonizations/Pedagogical transformations
  primaryReason?: DiscoveryPrimaryReason; // The dominant structural/harmonic matching cause
  evidenceGraph?: EvidenceGraph; // The complete logical auditability graph
  causalExplanation?: EvidenceExplanation; // Hierarchical attribution reasons
  contributions?: EvidenceContribution[]; // Normalized causal contributions
  sensitivityAnalysis?: SensitivityAnalysis; // Counterfactual impact and sensitivity analysis
  explanationData?: {
    dominantAxis: DiscoveryStrategy;
    dominantScore: number;
  };
  transformationOpportunities?: TransformationOpportunity[];
  transformationGraph?: TransformationGraph;
  recommendedPaths?: RecommendationPath[];
}
