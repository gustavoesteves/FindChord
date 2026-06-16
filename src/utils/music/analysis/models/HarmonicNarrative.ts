export type NarrativeFactType =
  | 'SECONDARY_DOMINANT_PREPARATION'
  | 'PRIMARY_DOMINANT_RESOLUTION'
  | 'MODAL_BORROWING_COLORATION'
  | 'CHROMATIC_APPROACH_PASSING'
  | 'PHRASE_OPENING_PROLONGATION'
  | 'PHRASE_PRE_CADENTIAL_PREPARATION';

export interface BaseFact {
  type: NarrativeFactType;
  priority: number;      // Prioridade pedagógica (ex: 100 para Dominante Secundária vs 40 para Preparação Subdominante)
  sourceEngine: 'F6' | 'F7' | 'F8' | 'GRAPH'; // Módulo de origem do fato
}



export interface SecondaryDominantPreparationFact extends BaseFact {
  type: 'SECONDARY_DOMINANT_PREPARATION';
  sourceChordIndex: number;
  targetChordIndex: number;
  secondaryFunction: string; // SECONDARY_DOMINANT | TRITONE_SUBSTITUTION | SECONDARY_LEADING_TONE
  targetDegree: string;
}

export interface PrimaryDominantResolutionFact extends BaseFact {
  type: 'PRIMARY_DOMINANT_RESOLUTION';
  sourceChordIndex: number;
  targetChordIndex: number;
  deceptive: boolean;
  plagal: boolean;
  strength: string;
}

export interface ModalBorrowingColorationFact extends BaseFact {
  type: 'MODAL_BORROWING_COLORATION';
  chordIndex: number;
  sourceMode: string;
  modeName: string;
}

export interface ChromaticApproachPassingFact extends BaseFact {
  type: 'CHROMATIC_APPROACH_PASSING';
  chordIndex: number;
}



export interface PhraseOpeningProlongationFact extends BaseFact {
  type: 'PHRASE_OPENING_PROLONGATION';
  chordIndex: number;
  keyCenter: string;
}

export interface PhrasePreCadentialPreparationFact extends BaseFact {
  type: 'PHRASE_PRE_CADENTIAL_PREPARATION';
  chordIndex: number;
}

export type NarrativeFact =
  | SecondaryDominantPreparationFact
  | PrimaryDominantResolutionFact
  | ModalBorrowingColorationFact
  | ChromaticApproachPassingFact
  | PhraseOpeningProlongationFact
  | PhrasePreCadentialPreparationFact;

export interface HarmonicNarrativeFacts {
  chordFacts: Record<number, NarrativeFact[]>;
}

export interface ChordExplanation {
  index: number;
  chordSymbol: string;
  facts: NarrativeFact[];
  roleDescription: string;     // Ex: "Dominante Secundário"
  compositionalChoice: string; // Explicação final compilada em PT-BR
}

export interface NarrativeObservation {
  type: 'identity' | 'journey' | 'tension' | 'resolution';
  prose: string;
  confidence: number;
}

export interface GlobalNarrative {
  observations: NarrativeObservation[];
}

export interface HarmonicNarrativeExplanation {
  global: GlobalNarrative;
  arc?: GlobalHarmonicArc;
  sections?: Array<{ label: string; prose: string }>;
  overview?: string; // Fallback legado
  chords: ChordExplanation[];
}

export interface GlobalHarmonicMeaning {
  identity: {
      strength: 'strong'|'moderate'|'weak';
      reason: string;
  };

  departure: {
      strength: 'none'|'brief'|'significant'|'transformative';
      mechanism: string;
  };

  return: {
      strength: 'full'|'partial'|'none';
      mechanism: string;
  };

  tension: {
      profile: 'high-frequency'|'smooth-waves'|'static';
      source: string;
  };

  closure: {
      type: 'resolute'|'open'|'deceptive'|'suspended';
      reason: string;
  };
}

export type HarmonicPhaseType = 
  | 'ESTABLISHMENT' 
  | 'CONSOLIDATION' 
  | 'DESTABILIZATION' 
  | 'FRAGMENTATION' 
  | 'EXPANSION' 
  | 'RECONSTRUCTION' 
  | 'RESOLUTION'
  | 'DISSOLUTION';

export interface HarmonicPhase {
    type: HarmonicPhaseType;
    confidence: number;
    causes: string[];
    startSectionIndex?: number;
    endSectionIndex?: number;
    relativeDuration?: 'short' | 'moderate' | 'long';
}

export interface GlobalHarmonicArc {
    phases: HarmonicPhase[];
}
