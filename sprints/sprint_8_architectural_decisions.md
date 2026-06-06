# Decisões Arquiteturais — Sprint 8A: Probabilistic Functional Analysis

Este documento registra as decisões de design e a especificação formal acordadas para a **Sprint 8A**. Em vez de prosseguir diretamente para a realização física SATB, a pipeline analítica será adaptada para suportar a **ambiguidade analítica inerente à teoria harmônica avançada**, permitindo múltiplas hipóteses concorrentes por acorde.

---

## 1. Mapeamento Probabilístico no DTO (`functionalHypotheses`)

Para expor a ambiguidade analítica (ex. um acorde diminuto simétrico que atua ao mesmo tempo como `vii°7/ii` e `NEIGHBOR_DIMINISHED` com confianças distintas), estenderemos o DTO do acorde para carregar um array de hipóteses:

```typescript
export interface FunctionalHypothesis {
  contextualFunction: ContextualFunction;
  romanNumeral: string;
  harmonicFunction: HarmonicFunction;
  confidence: number;
  explanation: string[];
  secondaryTarget?: string;
}

export interface FunctionalChord {
  // ... campos existentes
  
  // Lista de análises concorrentes ordenadas por confiança decrescente
  functionalHypotheses?: FunctionalHypothesis[];
}
```

---

## 2. Isolamento de Classificação (Decoupled Rule Pipelines)

Para evitar que a ordem de precedência no pipeline de mutação oculte hipóteses secundárias, os analisadores contextuais serão executados de forma **independente e isolada** sobre cópias da progressão base. 

```text
       Progression Cifrada
                ↓
    Extração de Pitch Class Sets (Tonal)
                ↓
    Resolution Evidence Engine (Lookahead +1 a +3)
                ↓
    +-----------------------------------------------------------+
    |           Execução em Paralelo (Isolamento)               |
    |                                                           |
    |  - Classifier 1: Secondary Dominant & Tritone Sub        |
    |  - Classifier 2: Secondary Leading-Tone                  |
    |  - Classifier 3: Modal Borrowing                         |
    |  - Classifier 4: Chromatic Harmony                       |
    +-----------------------------------------------------------+
                ↓
    Agregador & Ranqueador (Ordena hipóteses e seleciona a primária)
                ↓
     DTO com functionalHypotheses[]
```

---

## 3. Critério de Precedência em Caso de Empate (Tie-Breaking)

Em situações de confianças idênticas (ex: `vii°7/ii` vs. `PASSING_DIMINISHED` ambos com confiança `0.95`), o agregador utilizará um peso de precedência fixo para desempate:

1. `PRIMARY` (Tônica diatônica)
2. `TRITONE_SUBSTITUTION`
3. `SECONDARY_DOMINANT`
4. `SECONDARY_LEADING_TONE`
5. `MODAL_BORROWING`
6. `PASSING_DIMINISHED`
7. `COMMON_TONE_DIMINISHED`
8. `NEIGHBOR_DIMINISHED`
9. `CHROMATIC_APPROACH`
