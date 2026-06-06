# Decisões Arquiteturais — Sprint 7: Harmonic Resolution & Explicabilidade DTO

Este documento registra as decisões de design e a especificação formal acordadas para a **Sprint 7**. A próxima grande evolução do motor harmônico migrará o paradigma de reconhecimento de padrões de cifragem estáticos para uma **análise fundamentada em evidências de resolução de classes de altura (Pitch Class Sets)**.

---

## 1. Interface de Evidência Extensível (`ResolutionEvidence`)

Para permitir que a análise futura distinga a força e a direção funcional de movimentos clássicos (sensíveis ascendentes vs. sétimas descendentes vs. slides cromáticos) e capture resoluções não adjacentes (com atrasos por inversões ou acordes intermediários), a interface do motor de resolução registrará as seguintes métricas:

```typescript
export interface ResolvedPair {
  fromChroma: number; // Pitch class de origem (0-11)
  toChroma: number;   // Pitch class de destino (0-11)
  type: 'SEMITONE_ASCENDING' | 'SEMITONE_DESCENDING' | 'WHOLE_TONE_ASCENDING' | 'WHOLE_TONE_DESCENDING' | 'COMMON_TONE';
}

export interface ResolutionEvidence {
  // Índice do acorde na progressão onde a resolução real foi encontrada (lookahead de +1, +2 ou +3 acordes)
  targetChordIndex: number;
  
  // Distância física de acordes até a resolução (ex: 1 = adjacente, 2 = com acorde intermediário)
  resolutionDistance: number;

  // Quantidade de notas em comum mantidas
  commonTones: number;

  // Coleção detalhada dos mapeamentos físicos de notas resolvidos
  resolvedPairs: ResolvedPair[];

  // Subcategorias específicas extraídas para fins funcionais
  leadingToneResolutions: number;      // Notas resolvendo em direção à tônica do alvo (ex: B -> C)
  seventhResolutions: number;          // Notas de sétima resolvendo de forma descendente (ex: F -> E)
  
  ascendingSemitoneResolutions: number;  // Outros semitons ascendentes
  descendingSemitoneResolutions: number; // Outros semitons descendentes
  wholeToneResolutions: number;          // Movimento por tom inteiro

  unresolvedTones: number;             // Notas que saltaram (3 semitons ou mais) ou não resolveram conjunto
  
  // Score de resolução normalizado de 0.0 a 1.0 (função dos pesos das evidências brutas)
  harmonicResolutionScore: number;
}
```

---

## 2. Separação: Evidência Bruta vs. Heurística de Confiança

O motor de resolução (`Resolution Evidence Engine`) **não deve possuir scores ou coeficientes fixos (hardcoded)** para decisões de classificação. O papel do motor é meramente extrair a física das notas em comum e resoluções por passo conjunto.

A atribuição de significados e confianças será de responsabilidade das camadas analíticas superiores.
* **Correto**:
  ```typescript
  const evidence = calculateResolutionEvidence(chordA, chordsList, index);
  const confidence = scoreSecondaryLeadingTone(evidence); // Heurística definida no classificador do vii°7
  ```
* **Incorreto**:
  Definir fórmulas de confiança dentro do cálculo primário das resoluções.

---

## 3. Pipeline e Arquitetura Unificada

O motor de evidências funcionará como uma camada fundamental (middleware) que alimenta todos os módulos contextuais. Em vez de criar detectores de resolução individuais e isolados para cada tipo de acorde, a pipeline do analisador será reestruturada:

```text
       Progression Cifrada
                ↓
    Extração de Pitch Class Sets (Tonal)
                ↓
    [NOVO] Resolution Evidence Engine (Calcula evidências brutas e lookahead de +1 a +3 acordes)
                ↓
    +--------------------------------------------------------+
    |           Pipeline de Classificação Contextual        |
    |                                                        |
    |   1. Secondary Dominant & Tritone Substitution        |
    |   2. [NOVO] Secondary Leading-Tone Harmony             |
    |   3. Backdoor Cadence                                  |
    |   4. Modal Borrowing / Interchange                    |
    |   5. Chromatic Harmony (Passing/Common/Neighbor/Slide) |
    +--------------------------------------------------------+
                ↓
      Detecção de Cadências (Fraseado)
```

---

## 4. Ordem de Precedência com Leading-Tone Secundário

A introdução de acordes diminutos de sensível secundária (`vii°7/x`) exige precedência sobre cadências indiretas e empréstimos:

1.  **Tritone Substitution** (`subV7`)
2.  **Secondary Dominant** (`V7/x`)
3.  **Secondary Leading-Tone** (`vii°7/x` ou `vii°/x` - *Novo*)
4.  **Backdoor Cadence** (`bVII7 -> I`)
5.  **Modal Borrowing / Interchange** (`MODAL_BORROWING`)
6.  **Chromatic Harmony** (`PASSING_DIMINISHED`, `COMMON_TONE_DIMINISHED`, `NEIGHBOR_DIMINISHED`, `CHROMATIC_APPROACH` - *Fallback*)

---

## 5. DTO Autodeclarativo (Self-Explaining DTO)

Para facilitar a depuração e habilitar uma UI pedagógica de alto nível, os metadados do acorde serão expandidos para carregar a explicação humana e o rastro de evidências diretamente do classificador:

```typescript
export interface FunctionalChord {
  // ... campos existentes
  
  // Rótulo unificado de Verdade Semântica na ContextualFunction
  contextualFunction: 
    | 'PRIMARY'
    | 'SECONDARY_DOMINANT'
    | 'TRITONE_SUBSTITUTION'
    | 'SECONDARY_LEADING_TONE' // NOVO
    | 'MODAL_BORROWING'
    | 'PASSING_DIMINISHED'      // Centralizado do sub-objeto
    | 'COMMON_TONE_DIMINISHED'  // Centralizado do sub-objeto
    | 'NEIGHBOR_DIMINISHED'     // Centralizado do sub-objeto
    | 'CHROMATIC_APPROACH';
  
  // Rastro de evidência de resolução harmônica abstrata extraído na análise
  resolutionEvidence?: {
    commonTones: number;
    semitoneResolutions: number;
    harmonicResolutionScore: number;
    targetChordIndex: number;
  };

  // Frases de explicação para fins pedagógicos e de testes
  explanation?: string[];
}
```

---

## 6. Cronograma de Execução Proposto

*   **Sprint 7A — Resolution Evidence Engine**: Implementar o motor genérico de cálculo de movimentação e passos conjuntos entre conjuntos de notas abstratas (Pitch Class Sets), com capacidade de lookahead (+1 a +3 acordes) para suportar resoluções indiretas ou atrasadas.
*   **Sprint 7B — Secondary Leading-Tone Harmony**: Implementar a lógica de sensível secundária (`vii°7/x`) alimentada pelas evidências da 7A.
*   **Sprint 7C — Explicabilidade & Refatoração DTO**: Migrar a tipagem do DTO para centralizar a verdade na `ContextualFunction`, alimentar os arrays de `explanation` e desmembrar `COMMON_TONE` de `NEIGHBOR_DIMINISHED`.
*   **Sprint 8 — SATB Real Voice-Leading**: Integrar o motor analítico com o gerador SATB físico para conferir movimentos paralelos proibidos (oitavas/quintas) e condução física real.
