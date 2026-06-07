// ──────────────────────────────────────────────────────────────
// Sprint 6A — Functional Analysis DTOs (Contrato Congelado)
// ──────────────────────────────────────────────────────────────

/**
 * Função harmônica tonal de um acorde dentro de uma tonalidade.
 *  - TONIC:        Repouso (I, iii, vi no maior / i, bIII no menor)
 *  - SUBDOMINANT:  Suspensão/Preparação (ii, IV no maior / ii°, iv, bVI, bVII no menor)
 *  - DOMINANT:     Tensão/Resolução (V, vii° / V7, vii° no menor)
 */
export type HarmonicFunction = 'TONIC' | 'SUBDOMINANT' | 'DOMINANT';

/**
 * Tags de análise avançada. Na Sprint 6A este array fica vazio ([]).
 * As tags serão populadas progressivamente nas sprints seguintes:
 *  - 6C: SECONDARY_DOMINANT, TRITONE_SUBSTITUTION
 *  - 6D: II_V_CADENCE, BLUES_DOMINANT
 *  - 6E: MODAL_BORROWING
 *  - 6F: CHROMATIC_APPROACH
 */
export const AnalysisTag = {
  SECONDARY_DOMINANT: 'SECONDARY_DOMINANT',
  TRITONE_SUBSTITUTION: 'TRITONE_SUBSTITUTION',
  SECONDARY_LEADING_TONE: 'SECONDARY_LEADING_TONE',
  MODAL_BORROWING: 'MODAL_BORROWING',
  MODAL_AXIS: 'MODAL_AXIS',
  II_V_CADENCE: 'II_V_CADENCE',
  BLUES_DOMINANT: 'BLUES_DOMINANT',
  CHROMATIC_APPROACH: 'CHROMATIC_APPROACH',
  PICARDY_THIRD: 'PICARDY_THIRD',
  PASSING_DIMINISHED: 'PASSING_DIMINISHED',
  COMMON_TONE_DIMINISHED: 'COMMON_TONE_DIMINISHED',
  NEIGHBOR_DIMINISHED: 'NEIGHBOR_DIMINISHED'
} as const;

export type AnalysisTag = typeof AnalysisTag[keyof typeof AnalysisTag];



export type HarmonicGrammarProfile =
  | 'COMMON_PRACTICE'
  | 'EXTENDED_FUNCTIONAL'
  | 'CHROMATIC_FUNCTIONAL'
  | 'MODAL_FUNCTIONAL'
  | 'GENERAL';

/**
 * Modo tonal da tonalidade detectada.
 */
export type TonalMode = 'MAJOR' | 'MINOR';

/**
 * Centro tonal resolvido de uma progressão harmônica.
 *
 * `confidence` indica o quão forte é a evidência para esta tonalidade
 * em relação às alternativas candidatas. Varia de 0.0 (sem evidência,
 * ex: progressão vazia) a 1.0 (evidência inequívoca).
 *
 * Nota: Este `confidence` é **tonal** — reflete a certeza sobre a
 * tonalidade inteira, NÃO sobre acordes individuais.
 */
export interface TonalCenter {
  root: string;
  mode: TonalMode;
  confidence: number;
}

/**
 * Análise funcional de um acorde individual dentro do contexto tonal.
 *
 * `confidence` é **chord-level** — indica o quão bem este acorde
 * específico se encaixa na tonalidade detectada.
 * - 1.0: Acorde diatônico com função clara (ex: V7 → DOMINANT)
 * - 0.5–0.8: Acorde comum mas ambíguo (ex: v menor no eólio)
 * - 0.1–0.4: Acorde não-diatônico sem relação funcional clara
 *
 * `scaleDegree` é a representação lógica do grau para uso em algoritmos
 * (ex: "bII", "#IV", "bVII"). Diferente de `romanNumeral` que é
 * formatado para display (ex: "bII7", "vii°").
 */
export interface TonalContext {
  tonalCenter: TonalCenter;
}

export interface SecondaryContext {
  secondaryTarget: string;
  contextualAnalysis: ContextualAnalysis;
  contextualFunction: 'SECONDARY_DOMINANT' | 'TRITONE_SUBSTITUTION' | 'SECONDARY_LEADING_TONE';
}

export interface ModalContext {
  contextualFunction: 'MODAL_BORROWING' | 'MODAL_AXIS' | 'PASSING_DIMINISHED' | 'COMMON_TONE_DIMINISHED' | 'NEIGHBOR_DIMINISHED' | 'CHROMATIC_APPROACH';
  modalBorrowing?: ModalBorrowing;
  chromaticAnalysis?: ChromaticAnalysis;
  axisContext?: ModalAxisContext;
}

export interface ResolutionContext {
  resolutionEvidence?: ResolutionEvidence;
  candidateResolutions?: ResolutionEvidence[];
}

export interface SemanticContext {
  /**
   * Placeholder types. Will be replaced during future sprints:
   *  - F6: Harmonic Intent Engine
   *  - F7: Cadential Grammar Engine
   *  - F9: Phrase & Form Engine
   *  - F10: Hypermetric Engine
   */
  harmonicIntent?: unknown;
  cadentialContext?: unknown;
  phraseRole?: unknown;
  hypermetricRole?: unknown;
}

export interface DebugContext {
  functionalHypotheses?: FunctionalHypothesis[];
  explanation?: string[];
}

export interface FunctionalChord {
  /** Índice do acorde na progressão (0-based) */
  index: number;

  /** Cifra original (ex: "Dm7", "G7", "Cmaj7") */
  chordSymbol: string;

  /** Grau romano formatado para display (ex: "IIm7", "V7", "Imaj7") */
  romanNumeral: string;

  /**
   * Grau da escala para lógica/algoritmos.
   * Sempre maiúsculo para maior, minúsculo para menor.
   * Com prefixo "b" ou "#" quando alterado.
   * Ex: "I", "ii", "bII", "bVII", "#IV", "vii°"
   */
  scaleDegree: string;

  /** Função harmônica: TONIC, SUBDOMINANT ou DOMINANT */
  harmonicFunction: HarmonicFunction;

  /** Grau numérico (1-7) baseado na escala diatônica */
  degree: number;

  /** true se o acorde pertence ao campo harmônico da tonalidade detectada */
  isDiatonic: boolean;

  /** Tags de análise avançada (vazio na Sprint 6A) */
  analysisTags: AnalysisTag[];

  /** Confiança chord-level (ver documentação acima) */
  confidence: number;

  // Sub-contextos opcionais agrupados
  tonal?: TonalContext;
  secondary?: SecondaryContext;
  modal?: ModalContext;
  resolution?: ResolutionContext;
  semantic?: SemanticContext;
  debug?: DebugContext;
}

export interface ResolvedPair {
  fromChroma: number; // Pitch class de origem (0-11)
  toChroma: number;   // Pitch class de destino (0-11)
  type: 'COMMON_TONE' | 'SEMITONE_ASCENDING' | 'SEMITONE_DESCENDING' | 'WHOLE_TONE_ASCENDING' | 'WHOLE_TONE_DESCENDING';
  intervalSize: number; // Distância absoluta no ciclo de semitons (0 a 6)
}

export interface ResolutionEvidence {
  targetChordIndex: number;
  resolutionDistance: number;
  
  // Evidências Físicas
  commonTones: number;
  resolvedPairs: ResolvedPair[];
  
  ascendingSemitoneResolutions: number;
  descendingSemitoneResolutions: number;
  wholeToneResolutions: number;
  unresolvedTones: number;
  harmonicResolutionScore: number;
}

export type ContextualFunction = 
  | 'PRIMARY' 
  | 'SECONDARY_DOMINANT' 
  | 'TRITONE_SUBSTITUTION' 
  | 'SECONDARY_LEADING_TONE'
  | 'MODAL_BORROWING'
  | 'MODAL_AXIS'
  | 'PASSING_DIMINISHED'
  | 'COMMON_TONE_DIMINISHED'
  | 'NEIGHBOR_DIMINISHED'
  | 'CHROMATIC_APPROACH';

export interface FunctionalHypothesis {
  contextualFunction: ContextualFunction;
  romanNumeral: string;
  harmonicFunction: HarmonicFunction;
  confidence: number;
  explanation: string[];
  secondaryTarget?: string;
  contextualAnalysis?: ContextualAnalysis;
  modalBorrowing?: ModalBorrowing;
  chromaticAnalysis?: ChromaticAnalysis;
  evidence?: {
    resolutionScore?: number;
    targetChordIndex?: number;
    commonTones?: number;
    stepwiseCount?: number;
  };
}

export type ModalMode = 'IONIAN' | 'DORIAN' | 'PHRYGIAN' | 'LYDIAN' | 'MIXOLYDIAN' | 'AEOLIAN' | 'LOCRIAN';

export type ModalAxis = 
  | 'IONIAN_AXIS'
  | 'DORIAN_AXIS'
  | 'PHRYGIAN_AXIS'
  | 'LYDIAN_AXIS'
  | 'MIXOLYDIAN_AXIS'
  | 'AEOLIAN_AXIS'
  | 'LOCRIAN_AXIS';

export interface ModalAxisContext {
  axis: ModalAxis;
  mode: ModalMode;
  confidence: number;
  active: boolean;
}

export interface HarmonicState {
  root: string;
  mode: ModalMode;
}

export interface ModalRegion {
  startIndex: number;
  endIndex: number;
  axis: ModalAxis;
  mode: ModalMode;
  confidence: number;
}

export interface ModalBorrowing {
  sourceMode: ModalMode;
  modeName: string;
}

export interface ChromaticAnalysis {
  type: 'PASSING_DIMINISHED' | 'COMMON_TONE_DIMINISHED' | 'NEIGHBOR_DIMINISHED' | 'CHROMATIC_APPROACH';
  targetDegree?: string;
  resolutionDistance: number;
}



export interface ContextualAnalysis {
  type: 'SECONDARY_DOMINANT' | 'TRITONE_SUBSTITUTION';
  targetDegree: string;
  resolutionDistance: number; // 1 = vizinho imediato, 2 = pulando um acorde
}

export interface CadenceInfo {
  name: string; // Ex: "ii - V - I (C Maior)", "Turnaround de Jazz", "Plagal"
  type: 'PERFECT' | 'PLAGAL' | 'DECEPTIVE' | 'BACKDOOR' | 'TURNAROUND' | 'SECONDARY_PERFECT';
  startIndex: number;
  endIndex: number;
  chordIndexes: number[];
  confidence: number;
  suppressed?: boolean;
  suppressionReason?: string;
}

export interface ModulationEvent {
  chordIndex: number;
  from: TonalCenter;
  to: TonalCenter;
  confidence: number;
  reason: string;
}

export interface GlobalAnalysisPath {
  chordIndexes: number[];
  hypothesisIndexes: number[];
  totalScore: number;
  localScore: number;
  transitionScore: number;
  keys?: TonalCenter[];
  modulations?: ModulationEvent[];
  explanations: string[];
  states?: HarmonicState[];
}

export type TonalRegionType = 
  | 'TONICIZATION'
  | 'REGIONAL_SHIFT'
  | 'ESTABLISHED_MODULATION';

export interface TonalRegion {
  key: TonalCenter;
  startIndex: number;
  endIndex: number;
  duration: number;
  type: TonalRegionType;
  isHomeKey: boolean;
  stabilityScore: number;
  cadenceIndexes: number[];
}

export interface Phrase {
  index: number;
  startIndex: number;
  endIndex: number;
  terminatingCadence?: CadenceInfo;
  regions: TonalRegion[];
}

export interface TonalRegionNode {
  id: string;
  region: TonalRegion;
  parent?: TonalRegionNode;
  children: TonalRegionNode[];
}

export type KeyRelation =
  | 'RELATIVE'
  | 'PARALLEL'
  | 'DOMINANT'
  | 'SUBDOMINANT'
  | 'MEDIANT'
  | 'CHROMATIC_MEDIANT'
  | 'TRITONE'
  | 'DISTANT';

export interface TonalSummary {
  homeKey: TonalCenter;
  
  // Métricas principais normalizadas (0.0 a 1.0)
  tonalComplexity: number;
  tonalStability: number;
  regionalCoherenceScore: number;
  
  // Estatísticas estruturais e de árvore
  modulationCount: number;
  tonicizationCount: number;
  longestRegion: TonalRegion;
  deepestNestingLevel: number;
  visitedKeys: TonalCenter[];
  regionalTransitionCount: number;
  keyModulationRelations: KeyRelation[];
  
  // Contagens auxiliares de recurso harmônico
  cadenceCount: number;
  resolvedCadenceCount: number;
  modalBorrowingCount: number;
  secondaryFunctionCount: number;
  chromaticChordCount: number;
}

export type TonalNarrativeType =
  | 'STATIC'
  | 'TONICIZATION_CHAIN'
  | 'MODULATING'
  | 'ROUND_TRIP'
  | 'MULTI_CENTRIC';

export interface StructuralTonalEvent {
  startRegionId: string;
  endRegionId: string;
  relation: KeyRelation;
  significance: 'LOCAL' | 'REGIONAL' | 'STRUCTURAL';
}

export interface TonalNarrative {
  departureKey: TonalCenter;
  arrivalKey: TonalCenter;
  primaryTrajectory: TonalCenter[];
  structuralEvents: StructuralTonalEvent[];
  narrativeType: TonalNarrativeType;
}

/**
 * Resultado completo da análise funcional de uma progressão.
 * DTO imutável retornado por `analyzeProgression()`.
 */
export interface FunctionalAnalysis {
  /** Centro tonal resolvido (root + modo + confidence tonal) */
  tonalCenter: TonalCenter;

  /** Análise funcional de cada acorde na progressão */
  chords: FunctionalChord[];

  /** Cadências detectadas na progressão */
  cadences?: CadenceInfo[];

  /** Caminho de análise global ótimo (Sprint 8B) */
  globalPath?: GlobalAnalysisPath;

  /** Regiões tonais detectadas na progressão (Sprint 9B) */
  regions?: TonalRegion[];

  /** Regiões modais detectadas na progressão (Sprint F4) */
  modalRegions?: ModalRegion[];

  /** Frases musicais estruturais detectadas (Sprint 9B) */
  phrases?: Phrase[];

  /** Árvore hierárquica de regiões tonais (Sprint 10A) */
  regionTree?: TonalRegionNode;

  /** Sumário tonal analítico e quantitativo (Sprint 10B) */
  summary?: TonalSummary;

  /** Narrativa tonal e redução estrutural (Sprint 12A) */
  narrative?: TonalNarrative;
}

