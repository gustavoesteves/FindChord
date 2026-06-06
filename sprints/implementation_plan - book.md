# Sprint 6A — Functional Analysis Engine

## Objetivo

Criar a camada semântica de análise funcional que transforma uma progressão de cifras em um DTO rico contendo: tonalidade detectada (maior/menor), grau romano de cada acorde, função harmônica (T/SD/D) e flag de diatonicidade. Esta camada será a fundação para todas as sprints seguintes (campo harmônico, cadências, dominantes secundários, substituições e análise modal).

## Escopo Estrito

### ✅ Incluído
- Detecção de tonalidade com diferenciação maior/menor
- Classificação funcional (TONIC / SUBDOMINANT / DOMINANT)
- Grau romano com qualidade
- Flag `isDiatonic` para cada acorde
- Campo `analysisTags` (vazio na 6A, preparado para futuro)
- Facade pública `analyzeProgression()`
- Integração na UI (substituir chamadas diretas)

### ❌ Excluído (sprints futuras)
- Dominantes secundários
- SubV7
- Cadências (II-V-I, etc.)
- Empréstimo modal
- Análise modal
- Funções aparentes (dim, sus, m6)
- Blues detection

---

## Proposed Changes

### Novos DTOs

#### [NEW] [FunctionalAnalysis.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/models/FunctionalAnalysis.ts)

```ts
export type HarmonicFunction = 'TONIC' | 'SUBDOMINANT' | 'DOMINANT';

export type AnalysisTag =
  | 'SECONDARY_DOMINANT'
  | 'TRITONE_SUBSTITUTION'
  | 'MODAL_BORROWING'
  | 'II_V_CADENCE'
  | 'BLUES_DOMINANT'
  | 'CHROMATIC_APPROACH';

export type TonalMode = 'MAJOR' | 'MINOR';

export interface TonalCenter {
  root: string;
  mode: TonalMode;
  confidence: number;
}

export interface FunctionalChord {
  index: number;
  chordSymbol: string;
  romanNumeral: string;
  harmonicFunction: HarmonicFunction;
  degree: number;
  isDiatonic: boolean;
  analysisTags: AnalysisTag[];
  confidence: number;
}

export interface FunctionalAnalysis {
  tonalCenter: TonalCenter;
  chords: FunctionalChord[];
}
```

> [!NOTE]
> O `AnalysisTag` começa como union type (não `string[]`) para garantir type safety. Na Sprint 6A o array fica vazio `[]`, mas o tipo já previne typos nas sprints futuras.

---

### Novos Módulos de Análise

#### [NEW] [tonalCenter.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/tonalCenter.ts)

**Responsabilidade:** Resolver a tonalidade de uma progressão (root + major/minor).

Refatoração e melhoria do `detectKey()` atual de [musicTheory.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/theory/musicTheory.ts) (linhas 159-234).

##### Heurísticas de Pontuação (documentadas e testáveis)

| Evidência | Peso | Justificativa |
|-----------|------|---------------|
| Acorde diatônico no campo | +5 | Base: o acorde "pertence" à tonalidade |
| Primeiro acorde = tônica | +8 | Músicas frequentemente começam na tônica |
| Primeiro acorde tem qualidade compatível (maior=!minor, menor=minor) | +4 | Reforça a detecção de modo |
| Último acorde = tônica | +4 | Músicas frequentemente resolvem na tônica |
| Presença de V7→I (4ªJ acima, dominante→tônica) | +6 | Cadência autêntica perfeita — evidência mais forte |
| Presença de sensível (#7 no menor = V7 dominante) | +3 | Diferencia menor harmônica de menor natural |
| Acorde não-diatônico mas comum (V/V, bVI, bVII, iv) | +2 | Acordes de empréstimo ou secundários comuns |
| Acorde completamente estranho ao campo | +0 | Não contribui |

##### Diferencial vs implementação atual
- **Hoje:** `detectKey()` não dá peso especial a V7→I como sequência (olha acorde por acorde isoladamente)
- **Novo:** `resolveTonalCenter()` analisa **pares consecutivos** para detectar cadências V7→I e V7→Im, que são o indicador mais forte de tonalidade

---

#### [NEW] [functionalClassifier.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/functionalClassifier.ts)

**Responsabilidade:** Dado um acorde e uma tonalidade conhecida, classificar sua função harmônica.

##### Tabela de Classificação — Tonalidade Maior

| Intervalo (semitons) | Grau | Qualidade Esperada | Função | isDiatonic |
|---------------------|------|--------------------|--------|------------|
| 0 | I | major/maj7 | TONIC | true |
| 2 | ii | minor/m7 | SUBDOMINANT | true |
| 4 | iii | minor/m7 | TONIC | true |
| 5 | IV | major/maj7 | SUBDOMINANT | true |
| 7 | V | major/dom7 | DOMINANT | true |
| 9 | vi | minor/m7 | TONIC | true |
| 11 | vii° | halfDim/dim | DOMINANT | true |

Para acordes **não-diatônicos** (isDiatonic = false), a função é inferida pelo intervalo mais próximo ou marcada com confidence reduzido.

##### Tabela de Classificação — Tonalidade Menor

| Intervalo | Grau | Qualidade Esperada | Função | isDiatonic |
|-----------|------|--------------------|--------|------------|
| 0 | i | minor/m7 | TONIC | true |
| 2 | ii° | halfDim | SUBDOMINANT | true |
| 3 | bIII | major/maj7 | TONIC | true |
| 5 | iv | minor/m7 | SUBDOMINANT | true |
| 7 | V | dom7 (harm.) | DOMINANT | true |
| 7 | v | minor (nat.) | TONIC | true |
| 8 | bVI | major/maj7 | SUBDOMINANT | true |
| 10 | bVII | dom7 | SUBDOMINANT | true |
| 11 | vii° | dim | DOMINANT | true |

> [!IMPORTANT]
> No tom menor, o V grau dominante (V7) vem da escala menor harmônica — é o indicador mais forte de tonalidade menor. Quando o V é menor (Vm7), a progressão tende a ser modal (eólio/dórico).

---

#### [NEW] [functionalAnalysis.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/functionalAnalysis.ts)

**Responsabilidade:** Facade pública que orquestra `resolveTonalCenter` → `classifyChordFunction` e retorna o DTO `FunctionalAnalysis`.

```ts
export function analyzeProgression(progression: string[]): FunctionalAnalysis
```

A UI nunca chamará `detectKey()` ou `getRomanNumeral()` diretamente. Ela recebe o DTO pronto.

---

### Integração na UI

#### [MODIFY] [VoiceLeadingPanel.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/VoiceLeadingPanel.tsx)

- **Linha 4:** Substituir `import { detectKey, getRomanNumeral }` por `import { analyzeProgression }`
- **Linha 41:** Substituir `const detectedKeyObj = detectKey(progressionChords)` por `const analysis = analyzeProgression(progressionChords)`
- **Linha 672:** Substituir `getRomanNumeral(chord, ...)` por `analysis.chords[idx]?.romanNumeral`
- **Adicionar:** Exibir a função harmônica (T/SD/D) como badge colorido ao lado do grau romano
  - TONIC → badge azul
  - SUBDOMINANT → badge amarelo
  - DOMINANT → badge vermelho

---

### Manutenção de Compatibilidade

#### [MODIFY] [musicTheory.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/theory/musicTheory.ts)

- `detectKey()` e `getRomanNumeral()` **permanecem exportados** mas marcados com `@deprecated` e delegam internamente para os novos módulos
- Isso evita quebrar qualquer consumidor que ainda use as funções antigas

---

## Estrutura Final de Arquivos

```text
src/utils/music/
├── analysis/
│   ├── chordAnalyzer.ts          (existente)
│   ├── voicingAnalyzer.ts        (existente)
│   ├── voicingClassifier.ts      (existente)
│   ├── tonalCenter.ts            [NEW] — resolveTonalCenter()
│   ├── functionalClassifier.ts   [NEW] — classifyChordFunction()
│   └── functionalAnalysis.ts     [NEW] — analyzeProgression() facade
├── models/
│   ├── FunctionalAnalysis.ts     [NEW] — DTOs congelados
│   └── ... (existentes)
└── theory/
    └── musicTheory.ts            [MODIFY] — deprecar detectKey/getRomanNumeral
```

---

## Verification Plan

### Testes Automatizados

Novo arquivo: `src/utils/music/tests/functionalAnalysis.test.ts`

#### Caso 1 — Tonalidade Maior (II-V-I)
```
Input:  ["Dm7", "G7", "Cmaj7"]
Expect: key=C, mode=MAJOR, confidence>0.8
        Dm7  → IIm7  → SUBDOMINANT → isDiatonic=true
        G7   → V7    → DOMINANT    → isDiatonic=true
        Cmaj7→ Imaj7 → TONIC       → isDiatonic=true
```

#### Caso 2 — Tonalidade Menor
```
Input:  ["Am", "Dm", "E7", "Am"]
Expect: key=A, mode=MINOR, confidence>0.8
        Am → i   → TONIC        → isDiatonic=true
        Dm → iv  → SUBDOMINANT  → isDiatonic=true
        E7 → V7  → DOMINANT     → isDiatonic=true
        Am → i   → TONIC        → isDiatonic=true
```

#### Caso 3 — Acorde Não-Diatônico
```
Input:  ["Cmaj7", "Db7", "Cmaj7"]
Expect: key=C, mode=MAJOR
        Cmaj7→ I    → TONIC    → isDiatonic=true
        Db7  → bII7 → DOMINANT → isDiatonic=false
        Cmaj7→ I    → TONIC    → isDiatonic=true
```

#### Caso 4 — Progressão Pop I-V-vi-IV
```
Input:  ["C", "G", "Am", "F"]
Expect: key=C, mode=MAJOR
        C  → I  → TONIC        → isDiatonic=true
        G  → V  → DOMINANT     → isDiatonic=true
        Am → vi → TONIC        → isDiatonic=true
        F  → IV → SUBDOMINANT  → isDiatonic=true
```

#### Caso 5 — Relativa Maior/Menor (ambiguidade)
```
Input:  ["Am7", "Dm7", "G7", "Cmaj7"]
Expect: key=C, mode=MAJOR (o G7→Cmaj7 como cadência V→I é decisivo)
```

#### Caso 6 — Determinismo
```
Duas chamadas consecutivas de analyzeProgression() com a mesma entrada
devem produzir resultado idêntico (deepEqual).
```

#### Caso 7 — Progressão vazia
```
Input:  []
Expect: key=C, mode=MAJOR, confidence=0, chords=[]
```

### Verificação de Build
```bash
npm run build
```
Deve compilar sem erros.

### Manual Verification
- Abrir o app no navegador
- Digitar `Dm7 G7 Cmaj7` na timeline
- Verificar que cada bloco exibe: cifra + grau romano + badge de função (SD/D/T)
- Digitar `Am Dm E7 Am` e verificar que a tonalidade muda para "A Menor"
