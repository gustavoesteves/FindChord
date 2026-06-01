# 🎼 Harmony Engine: Architectural Blueprint & Roadmap (Sprint 0)

Este documento define a especificação técnica para a **Sprint 0: Refatoração Arquitetural** e estabelece o **Roadmap Estratégico** para as próximas sprints. 

O objetivo principal desta sprint de infraestrutura é **congelar novas capacidades funcionais**, reduzir o **acoplamento semântico** e criar uma base modular explicável, escalável e de fácil manutenção para o motor harmônico.

---

## 🔬 Diagnóstico Arquitetural: Acoplamento Semântico

Projetos que começam simples e rapidamente ganham inteligência tendem a acumular conceitos que aparecem simultaneamente em vários lugares. Este "acoplamento semântico" cria redundâncias de código e aumenta os riscos de regressões a cada nova funcionalidade adicionada.

### Evolução Histórica do Motor
1. **Geração de Acordes** (Fretboard & search combinatório)
2. **Análise Harmônica** (Identificação semântica de graus e tensões)
3. **DP Viterbi** (Condução suave de vozes na timeline)
4. **Regras de Baixo** (Identificação e penalidades de inversão física)
5. **Omissões Opcionais** (Guitar-friendly shell voicings sem a 5ª justa)
6. **Extensões Obrigatórias** (Presença estrita de 9ª, 11ª e 13ª no core)
7. **Correção Enarmônica** (Spelling inteligente para leitura visual)
8. **VoiceRoleAnalysis** (Mapeamento explícito de vozes e funções)

---

## 🛠️ Fase 0: Inventário de Mapeamento de Código

Mapeamos minuciosamente todas as funções e constantes dos arquivos legados e definimos seus destinos estritos na nova estrutura sob `src/utils/music/`:

| Arquivo Legado | Recurso Original | Responsabilidade Conceitual | Arquivo de Destino |
| :--- | :--- | :--- | :--- |
| **`musicTheory.ts`** | `getPitchClass` | Mapeamento de semitônios de pitch class (0-11) | `core/pitch.ts` |
| **`musicTheory.ts`** | `simplifyNote` | Simplificação e normatização enarmônica crua | `core/pitch.ts` |
| **`musicTheory.ts`** | `noteToMidi` | Conversão pura de nota científica para MIDI | `core/midi.ts` |
| **`musicTheory.ts`** | `getAbsolutePitch` | Cálculo de MIDI a partir de traste e afinação | `core/midi.ts` |
| **`musicTheory.ts`** | `getNoteAt` | Retorna nota visual a partir de traste e afinação | `core/notes.ts` |
| **`musicTheory.ts`** | `getOctave` | Retorna oitava física da nota | `core/notes.ts` |
| **`musicTheory.ts`** | `getPhysicalBassInfo` | Detecção acústica do baixo absoluto do voicing | `core/physicalVoice.ts` |
| **`musicTheory.ts`** | `CHORD_REGISTRY` | Dicionário estático de qualidades e fórmulas | `constants/chordRegistry.ts` |
| **`musicTheory.ts`** | `TUNING_PRESETS` | Predefinições físicas de afinações | `constants/tunings.ts` |
| **`musicTheory.ts`** | `getFriendlyInterval` | Tradutor teórico de intervalos para texto | `theory/chordParser.ts` |
| **`musicTheory.ts`** | `enarmonizeChordCandidate`| Regras estéticas de spelling e correção enarmônica | `theory/enharmonics.ts` |
| **`musicTheory.ts`** | `analyzeChords` | Identificação e cifra nominal do acorde | `analysis/chordAnalyzer.ts` |
| **`musicTheory.ts`** | (Regras de escala/graus) | Teoria abstrata geral e intervalos teóricos | `theory/musicTheory.ts` |
| **`voicingGenerator.ts`**| `search` (combinatória) | Motor puro recursivo físico de trastes | `generation/voicingGenerator.ts` |
| **`voicingGenerator.ts`**| Penalidades/Pesos | Pesos de completeza, gaps e score de qualidade | `constants/scoringWeights.ts` |
| **`voicingGenerator.ts`**| `scoreVoicingQuality` | Cálculo numérico de completeza, gaps e score | `scoring/voicingScorer.ts` |
| **`presets.ts`** | `getPresetVoicingsForChord`| Presets rápidos e diagramas clássicos | `generation/shapeFinder.ts` |
| **`voiceLeading.ts`** | `findAutoVoicings` (Viterbi)| Algoritmo DP Viterbi de caminhos temporais | `voiceLeading/voiceLeading.ts` |

---

## 🛠️ Fase 1: Árvore de Arquivos e Divisão de Responsabilidades

O diretório `src/utils/music/` é dividido em subdiretórios com limites conceituais claros e responsabilidades isoladas.

```text
src/utils/music/

core/                       # Física, acústica e utilitários básicos do instrumento (Sem lógica musical)
├── pitch.ts                # Pitch classes, chroma, operações puras de semitônios
├── midi.ts                 # Conversões numéricas de notas para frequências/MIDI absolutos
├── notes.ts                # Nomenclaturas físicas de notas (A1, C#3) e oitavas
└── physicalVoice.ts        # Identificação de baixo absoluto e soprano no braço da guitarra

constants/                  # Centralização de pesos e dados estáticos
├── chordRegistry.ts        # Fórmulas e nomenclaturas de qualidades de acordes
├── tunings.ts              # Afinações da guitarra
└── scoringWeights.ts       # Penalidades de duplicação, gaps e inversão do baixo acústico

models/                     # DTOs e Interfaces de Dados Puros (Sem funções nem comportamento)
├── ChordAnalysis.ts        # Interface para análise harmônica nominal do acorde
├── VoiceRoleAnalysis.ts    # Modelagem pura de HarmonicRole, VoiceRole e VoiceRoleAnalysis
├── VoicingShape.ts         # Posicionamento mecânico do braço (VoicingShape, CAGE)
├── VoicingScoreBreakdown.ts # Mapeamento granular e explicável do score de qualidade
├── VoiceLeadingTransition.ts # Métricas de custo de condução de vozes e transições
└── AnalyzedVoicing.ts      # Moeda oficial do sistema: Agregador (Shape + Analysis + Score + Metadata)

theory/                     # Teoria musical pura e abstrata
├── musicTheory.ts          # Regras gerais de intervalos, transposição e escalas
├── chordParser.ts          # Parser de cifras em fórmulas
└── enharmonics.ts          # Regras de enarmonização visual e spelling corretivo

analysis/                   # Analisadores semânticos e comportamentos de domínio
├── chordAnalyzer.ts        # Tradutor de pitch classes cruas para nomenclatura de acordes
└── voicingAnalyzer.ts      # Mapeador de dedilhados físicos para VoiceRoleAnalysis

generation/                 # Geradores combinatórios e mapeadores de shapes
├── voicingGenerator.ts     # Mecanismo recursivo puro e filtros ergonômicos mecânicos
└── shapeFinder.ts          # Buscador de diagramas clássicos/presets

scoring/                    # Motor de pontuação explicável
└── voicingScorer.ts        # Tradutor de análises e shapes para breakdowns de scores de qualidade

voiceLeading/               # Resolvedor de caminhos temporais
└── voiceLeading.ts         # Algoritmo Viterbi DP puro baseado em transição e qualidade
```

---

## 📐 Regra Estrita de Dependência (Dependency Rule)

Para blindar o sistema contra acoplamentos circulares e garantir a integridade da arquitetura, estabelecemos a seguinte regra unidirecional de dependências:

```text
  ┌─────────────────────────┐
  │      voiceLeading       │
  └────────────┬────────────┘
               │ (pode importar de)
               ▼
  ┌─────────────────────────┐
  │         scoring         │
  └────────────┬────────────┘
               │ (pode importar de)
               ▼
  ┌─────────────────────────┐
  │        analysis         │
  └────────────┬────────────┘
               │ (pode importar de)
               ▼
  ┌─────────────────────────┐
  │         theory          │
  └────────────┬────────────┘
               │ (pode importar de)
               ▼
  ┌─────────────────────────┐
  │          core           │
  └─────────────────────────┘
```

### Regras de Ouro:
1. **Core Independente**: O domínio `core/` **nunca** importa nada de outros domínios de `music/`. É o alicerce acústico e matemático físico.
2. **Modelos Universais**: O domínio `models/` contém apenas tipos e interfaces puras. Pode ser importado por **qualquer** domínio, mas **nunca** importa lógica ou funções de outros domínios.
3. **Comportamento vs. DTO**: Modelos sob `models/` são DTOs puros. Nenhuma função helper, lógica ou método estático reside em `models/`. Toda a lógica comportamental de mapeamento semântico reside em `analysis/voicingAnalyzer.ts`.
4. **Fluxo Unidirecional**: A dependência sempre sobe no grafo de camadas. Nunca desce. Por exemplo, é terminantemente proibido importar `voicingAnalyzer` ou `voicingScorer` dentro do domínio `core/` ou `theory/`.

---

## 🛠️ Modelagem de Dados Puros (Domain Models)

### `models/AnalyzedVoicing.ts`
```typescript
import { VoicingShape } from "./VoicingShape";
import { VoiceRoleAnalysis } from "./VoiceRoleAnalysis";
import { VoicingScoreBreakdown } from "./VoicingScoreBreakdown";

export interface AnalyzedVoicing {
  shape: VoicingShape;
  analysis: VoiceRoleAnalysis;
  score: VoicingScoreBreakdown;
  metadata: {
    source: "generated" | "preset";
    chordSymbol: string;
    physicalBass: string;
    physicalSoprano: string;
  };
}
```

---

## 🎯 Critérios de Sucesso Objetivos da Sprint 0

Para declarar a Sprint 0 formalmente concluída e homologada, o código refatorado deve atender rigorosamente aos seguintes limites quantitativos e qualitativos:

*   **Tamanho de Arquivo**: Nenhum arquivo do domínio `music/` pode ultrapassar **600 linhas** de código.
*   **Tamanho de Função**: Nenhuma função ou método de utilitários de música pode exceder **80 linhas** de código.
*   **Responsabilidade Única**: Cada módulo deve ter no máximo uma única responsabilidade principal (sem mesclar física com cifragem harmônica).
*   **Zero Dependências Circulares**: Ausência completa de ciclos de importação (`npm run build` limpo).
*   **Aprovação Completa de Testes**: Divisão da suíte em arquivos específicos por domínio sob `src/utils/music/tests/` com **100% de sucesso**.
*   **Compatibilidade Comportamental Rígida**: O comportamento musical e as escolhas de dedilhados e scores para a cadência abaixo devem permanecer **rigorosamente idênticos** aos anteriores:
    ```text
    Amaj7/C# ➔ B6 ➔ Amaj7/C# ➔ D#m7 ➔ A7M ➔ G#m7 ➔ G#m11 ➔ Amaj9 ➔ G#m7 ➔ B11 ➔ C#m7
    ```

---

## 🎯 Roadmap Evolutivo de Sprints

### 📅 Sprint 0: Refatoração Arquitetural e Divisão por Domínios (Atual)
*   **Objetivo**: Estruturar e isolar os 5 motores conceituais, core físico e DTOs puros.
*   **Neutralidade**: Zero alteração de comportamento musical e zero adição de novas heurísticas complexas.

### 📅 Sprint 1: VoiceRoleAnalysis Engine
*   **Objetivo**: Implementar e expandir o modelo de voz estruturado `VoiceRoleAnalysis`.
*   **Funcionalidades**:
    *   `analyzeVoiceRoles()`
    *   Identificação de graus em cada corda (Root, Third, Fifth, Seventh, Extensions)
    *   Mapeamento de duplicidades (`duplicatedRoles`) e omissões (`omittedRoles`)
    *   Cálculo de vozes efetivas (`effectiveVoices`)

### 📅 Sprint 2: VoicingScorer v2 (Explainable Score)
*   **Objetivo**: Desenvolver o motor de pontuação explicável utilizando as informações do DTO `AnalyzedVoicing`.
*   **Funcionalidades**:
    *   Cálculo e breakdown detalhado do score no front-end para o usuário.
    *   Exposição visual de auditoria anatômica e harmônica para depuração em tempo real.

### 📅 Sprint 3: Rootless & Jazz Engine
*   **Objetivo**: Suportar voicings jazzísticos e formas clássicas.
*   **Funcionalidades**:
    *   Geração de aberturas sem tônica (Rootless maj7, m7, dominant7) para guitarra.
    *   Presets estruturados e codificação física para voicings Drop 2, Drop 3 e Shell voicings.

### 📅 Sprint 4: Advanced Voice Leading
*   **Objetivo**: Implementar conduções contrapontísticas clássicas ao algoritmo Viterbi DP.
*   **Funcionalidades**:
    *   Evitar paralelismos rígidos (quintas e oitavas paralelas).
    *   Priorizar movimento contrário, oblíquo e resolução de graus instáveis (Terça para Sétima e vice-versa).

### 📅 Sprint 5: Arranger Engine
*   **Objetivo**: Introduzir inteligência tonal adaptativa baseada em arranjo estilístico.
*   **Funcionalidades**:
    *   Ajuste inteligente de registros e oitavas com base no estilo (Jazz/Bossa/Pop).
    *   Densidade adaptativa e priorização da linha do soprano.
