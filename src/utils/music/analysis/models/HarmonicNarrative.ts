export type NarrativeFactType =
  | 'PERIOD_RELATION'
  | 'STANDALONE_PHRASE'
  | 'SECONDARY_DOMINANT_PREPARATION'
  | 'PRIMARY_DOMINANT_RESOLUTION'
  | 'MODAL_BORROWING_COLORATION'
  | 'CHROMATIC_APPROACH_PASSING'
  | 'REGIONAL_MODULATION'
  | 'PHRASE_OPENING_PROLONGATION'
  | 'PHRASE_PRE_CADENTIAL_PREPARATION';

export interface BaseFact {
  type: NarrativeFactType;
  priority: number;      // Prioridade pedagógica (ex: 100 para Dominante Secundária vs 40 para Preparação Subdominante)
  sourceEngine: 'F6' | 'F7' | 'F8' | 'GRAPH'; // Módulo de origem do fato
}

export interface PeriodRelationFact extends BaseFact {
  type: 'PERIOD_RELATION';
  antecedentPhraseIndex: number;
  consequentPhraseIndex: number;
  periodName: string;
  confidence: number;
}

export interface StandalonePhraseFact extends BaseFact {
  type: 'STANDALONE_PHRASE';
  phraseIndex: number;
  initialKey: string;
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

export interface RegionalModulationFact extends BaseFact {
  type: 'REGIONAL_MODULATION';
  sourceRegionIndex: number;
  targetRegionIndex: number;
  fromKey: string;
  toKey: string;
  relation: string;
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
  | PeriodRelationFact
  | StandalonePhraseFact
  | SecondaryDominantPreparationFact
  | PrimaryDominantResolutionFact
  | ModalBorrowingColorationFact
  | ChromaticApproachPassingFact
  | RegionalModulationFact
  | PhraseOpeningProlongationFact
  | PhrasePreCadentialPreparationFact;

export interface HarmonicNarrativeFacts {
  overviewFacts: NarrativeFact[];
  chordFacts: Record<number, NarrativeFact[]>;
}

export interface ChordExplanation {
  index: number;
  chordSymbol: string;
  facts: NarrativeFact[];
  roleDescription: string;     // Ex: "Dominante Secundário"
  compositionalChoice: string; // Explicação final compilada em PT-BR
}

export interface HarmonicNarrativeExplanation {
  overview: string; // Texto geral em português
  chords: ChordExplanation[];
}
