import type { FunctionalEquivalenceLayerData } from './FunctionalEquivalence';
import type { VoiceLeadingLayerData } from './VoiceLeadingLayer';
import type { ApparentFunctionLayerData } from './ApparentFunctionLayer';

export type FingerprintLayer =
  | 'STRUCTURAL'
  | 'HARMONIC'
  | 'FORMAL'
  | 'REGIONAL'
  // Camadas futuras (F11 - F14)
  | 'FUNCTIONAL_EQUIVALENCE'
  | 'VOICE_LEADING'
  | 'APPARENT_FUNCTION'
  | 'STYLE_EXTENSIONS';

export type StructuralState = 'PROLONGATION' | 'PREPARATION' | 'TENSION' | 'RESOLUTION' | 'UNKNOWN';

export interface StructuralEvent {
  chordIndex: number;
  state: StructuralState;
  relativeTension: number; // Valor normalizado entre 0.0 (estável) e 1.0 (tensão máxima)
}

export interface StructuralLayerData {
  events: StructuralEvent[];
}

export type HarmonicDeviceType =
  | 'SECONDARY_DOMINANT'
  | 'TRITONE_SUBSTITUTION'
  | 'MODAL_BORROWING'
  | 'DECEPTIVE_CADENCE'
  | 'PASSING_CHROMATIC'
  | 'DIATONIC';

export interface HarmonicDeviceEvent {
  chordIndex: number;
  deviceType: HarmonicDeviceType;
  sourceDegree?: string; // Ex: "V7/V", "bVI"
}

export interface HarmonicLayerData {
  devices: HarmonicDeviceEvent[];
  deviceFrequency: Record<string, number>;
}

export interface FormalPhraseEvent {
  phraseIndex: number;
  role: 'ANTECEDENT' | 'CONSEQUENT' | 'STANDALONE';
  startChordIndex: number;
  endChordIndex: number;
  cadenceType: string;
  cadenceResolution: string;
}

export interface FormalLayerData {
  phrases: FormalPhraseEvent[];
  isPeriodBased: boolean;
  totalPhrases: number;
}

export interface RegionTransition {
  fromRegion: string; // Ex: "I" (grau de região relativo)
  toRegion: string;   // Ex: "vi"
  startChordIndex: number;
  durationInChords: number;
}

export interface RegionalLayerData {
  homeKey: string;
  regionsVisited: string[]; // Relações em graus romanos de região
  transitions: RegionTransition[];
}

export interface HarmonicFingerprint {
  version: string;
  metadata: {
    sourceKey: string; // Tonalidade original preservada para auditoria
    transpositionInvariant: boolean; // Sempre true para assinalar a invariância
    chordsCount: number;
    phrasesCount: number;
    queryProgression?: string[];
  };
  layers: {
    structural?: StructuralLayerData;
    harmonic?: HarmonicLayerData;
    formal?: FormalLayerData;
    regional?: RegionalLayerData;
    // Extensibilidade estruturada e tipada para as Camadas 5 a 8 (F11 - F14)
    extendedLayers?: {
      functionalEquivalence?: FunctionalEquivalenceLayerData;
      voiceLeading?: VoiceLeadingLayerData;
      apparentFunction?: ApparentFunctionLayerData;
      [key: string]: unknown;
    };
  };
}

export type FingerprintDensity = 'CORE' | 'STANDARD' | 'FULL';

export interface FingerprintOptions {
  layers?: FingerprintLayer[];
  density?: FingerprintDensity;
  tuning?: string[]; // Afinação customizada opcional para voice-leading (Layer 6)
}
