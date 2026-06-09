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
  sourceReference?: string; // Informação histórica opcional. Não participa de cálculos de similaridade.
  description?: string;
  cachedFingerprint?: CachedFingerprint; // Cache com densidade explícita
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
}

export interface DiscoveryMatch {
  item: CorpusItem;
  score: number; // Nota específica da estratégia selecionada (0.0 a 1.0)
  report: SimilarityResult;
  fingerprint: HarmonicFingerprint;
  explanation?: string; // Renderização textual básica
  explanationData?: {
    dominantAxis: DiscoveryStrategy;
    dominantScore: number;
  };
}
