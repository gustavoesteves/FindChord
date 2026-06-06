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
export type AnalysisTag =
  | 'SECONDARY_DOMINANT'
  | 'TRITONE_SUBSTITUTION'
  | 'MODAL_BORROWING'
  | 'II_V_CADENCE'
  | 'BLUES_DOMINANT'
  | 'CHROMATIC_APPROACH';

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

  /** Grau do acorde alvo (ex: "ii", "V", "I") */
  secondaryTarget?: string;

  /** Análise contextual (Dominante Secundário ou SubV7) */
  contextualAnalysis?: ContextualAnalysis;
}

export interface ContextualAnalysis {
  type: 'SECONDARY_DOMINANT' | 'TRITONE_SUBSTITUTION';
  targetDegree: string;
  resolutionDistance: number; // 1 = vizinho imediato, 2 = pulando um acorde
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
}
