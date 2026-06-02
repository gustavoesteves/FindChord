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
├── AnalyzedVoicing.ts      # Moeda oficial do sistema: Agregador (Shape + Analysis + Score + Metadata)
├── GenerationConstraints.ts # Contrato declarativo de filtros e regras harmônicas
├── VoiceLeadingMetrics.ts  # Métricas numéricas brutas da condução contrapontística e movimento
├── VoiceLeadingExplanation.ts # Diagnóstico e explicabilidade humanizada de caminhos harmônicos
├── ResolvedProgression.ts  # O resultado oficial e explicável do pipeline do resolvedor Viterbi
└── HarmonySession.ts       # Sessão harmônica agregada contendo a progressão, regras e solução calculada

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

voiceLeading/               # Resolvedor contrapontístico de caminhos temporais
├── rules/                  # Regras modulares (ParallelFifths, ContraryMotion, etc.)
├── solver/                 # Algoritmo Viterbi DP puro de caminho mínimo
└── models/                 # Interfaces de transição e resolvedores

midi/                       # Eventos e exportadores de protocolos musicais
└── midiExporter.ts         # Conversor de ResolvedProgression para arquivos binários .mid SMF 0

harmonyEngine/              # Fachada Principal (Public API Facade)
└── index.ts                # APIs públicas unificadas (findBestVoicings, findBestProgression, generateMidi)
```

---

## 📐 Pipeline Harmônico Central (Core Harmonic Pipeline)

O Harmony Engine opera sobre um pipeline unidirecional rígido de transformação de dados. O tráfego de dados é inteiramente orientado a contratos (DTOs) que desacoplam a intenção musical de sua materialização e de sua renderização final:

```text
  1. INTENT (Intenção do Músico)
     GenerationConstraints
              │
              ▼
  2. CANDIDATES (Candidatos Físicos e Geométricos)
     AnalyzedVoicing[]
              │
              ▼
  3. RESOLUTION (Resolução e Otimização Tonal)
     ResolvedProgression
              │
              ▼
  4. EXPLAINABILITY (Métricas & Explicabilidade Didática)
     VoiceLeadingMetrics + VoiceLeadingExplanation
              │
              ▼
  5. RENDERING (Camadas de Apresentação / Renderização)
     UI React / MIDI Exporter / DAW Extension (Reaper) / VST3 / CLAP
```

### Detalhamento das Camadas do Pipeline:
1. **Intent (Intenção)**: O músico declara suas preferências harmônicas abstratas (ex: "Quero uma progressão contrapontística Drop 2, sem tônica e com a 9ª obrigatória") encapsuladas em `GenerationConstraints`. A intenção é agnóstica de instrumento ou representação física.
2. **Candidates (Candidatos)**: O motor combinatório do gerador procura shapes compatíveis no braço e os analisa no domínio, anexando os papéis das vozes no DTO `AnalyzedVoicing`.
3. **Resolution (Resolução)**: O algoritmo Viterbi otimiza a progressão inteira de forma horizontal no tempo, encontrando o menor custo contrapontístico e retornando o DTO consolidado `ResolvedProgression`.
4. **Explainability (Explicabilidade)**: O motor de métricas calcula os diagnósticos numéricos (`VoiceLeadingMetrics`) e formula a justificativa teórica em linguagem natural (`VoiceLeadingExplanation`), respondendo de forma fidedigna e didática *"Por que este caminho venceu as alternativas?"*.
5. **Rendering (Renderização)**: Camada de apresentação/saída que converte a decisão resolvida e explicada em formatos perceptíveis (desenho de diagramas SVG, eventos MIDI, bytes SMF `.mid` salvos em arquivo, comandos VST3, extensões de DAW, etc.).

---

## 📐 Regra Estrita de Dependência (Dependency Rule)

Para blindar o sistema contra acoplamentos circulares e garantir a integridade da arquitetura, estabelecemos a seguinte regra unidirecional de dependências:

```text
  ┌─────────────────────────┐
  │      harmonyEngine      │
  └────────────┬────────────┘
               │ (pode importar de)
               ▼
  ┌─────────────────────────┐
  │      voiceLeading       │
  └────────────┬────────────┘
               │ (pode importar de)
               ▼
  ┌─────────────────────────┐
  │      midi / scoring     │
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

### `models/GenerationConstraints.ts`
```typescript
export interface GenerationConstraints {
  requireGuideTones?: boolean;
  omitRoot?: boolean;
  omitFifth?: boolean;
  omitSeventh?: boolean;
  requiredIntervals?: string[]; // ex: ["3", "7", "b9", "#11"]
  voiceCount?: 3 | 4 | 5 | 6 | "any";
  positionRange?: "0-5" | "5-9" | "9-12" | "12+" | "all";
  bassFilter?: "root" | "third" | "fifth" | "seventh" | "tension" | "any";
  structure?: string; // ex: "drop2", "drop3", "shell"
}
```

### `models/VoiceLeadingMetrics.ts`
```typescript
// Métricas numéricas brutas do resolvedor (ideais para algoritmos, ponderações e comparações)
export interface VoiceLeadingMetrics {
  totalDistance: number;         // Distância física acumulada em semitônios nas cordas
  contraryMotions: number;        // Quantidade de movimentos contrários/oblíquos promovidos
  retainedCommonTones: number;   // Quantidade de notas comuns mantidas na mesma voz física
  parallelFifths: number;        // Quantidade de quintas paralelas identificadas e evitadas
  parallelOctaves: number;       // Quantidade de oitavas paralelas identificadas e evitadas
  functionalResolutions: number; // Quantidade de resoluções de guide tones/trítonos realizadas
}
```

### `models/VoiceLeadingExplanation.ts`
```typescript
// Diagnóstico pedagógico humanizado (perfeito para renderização e leitura direta do músico)
export interface VoiceLeadingExplanation {
  summary: string;     // Breve veredito de "Por que este caminho venceu as alternativas?"
  strengths: string[]; // Pontos fortes da resolução (ex: ["Movimento contrário suave", "Notas comuns retidas"])
  weaknesses: string[];// Concessões ergonômicas feitas (ex: ["Salto maior que 5 trastes na 6ª corda"])
}
```

### `models/ResolvedProgression.ts`
```typescript
import { AnalyzedVoicing } from "./AnalyzedVoicing";
import { VoiceLeadingTransition } from "./VoiceLeadingTransition";
import { VoiceLeadingMetrics } from "./VoiceLeadingMetrics";
import { VoiceLeadingExplanation } from "./VoiceLeadingExplanation";

// O ativo mais valioso do resolvedor: a progressão inteiramente calculada e explicável
export interface ResolvedProgression {
  progression: string[];                // Cifras solicitadas (ex: ["Dm7", "G7", "Cmaj7"])
  candidates: AnalyzedVoicing[][];      // Candidatos a aberturas gerados para cada acorde
  bestPath: (AnalyzedVoicing | null)[]; // O melhor caminho harmônico (resolução) calculado
  totalCost: number;                    // Custo acumulado total de condução e ergonomia
  transitions: VoiceLeadingTransition[];// Conexões e caminhos de voz individuais SATB por passo
  metrics?: VoiceLeadingMetrics;        // Métricas brutas da progressão
  explanation?: VoiceLeadingExplanation;// Justificativa teórica humanizada da progressão
}
```

### `models/HarmonySession.ts`
```typescript
import { GenerationConstraints } from "./GenerationConstraints";
import { ResolvedProgression } from "./ResolvedProgression";

// Sessão focada puramente no domínio harmônico (vigilância contra poluição de DAW/UI)
export interface HarmonySession {
  progression: string[];               // Cifras ativas da sessão
  constraints: GenerationConstraints;  // Parâmetros declarativos aplicados
  solution: ResolvedProgression | null;// A solução harmônica resolvida pelo motor
}
```
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

## 🎯 Roadmap Evolutivo de Sprints (Congelado & Atualizado)

O Harmony Engine evoluiu de um visualizador físico-mecânico para um **gerador e auditor harmônico semântico inteligente**. O roteiro a seguir define as fases concluídas e planejadas do produto:

### 📅 Sprints 1, 1.1 & 2: O Motor Harmônico Semântico e Condução Funcional (Concluídos)
*   **Objetivo**: Desenvolver o mapeamento estruturado `VoiceRoleAnalysis`, modularizar o gerador combinatório recursivo e implementar o resolvedor Viterbi de condução horizontal física e funcional (7ª ➔ 3ª, 3ª ➔ Tônica, combos de resolução de trítonos dominantes).

### 📅 Sprint 3.35: Consolidação Arquitetural (Architectural Consolidation) (Concluído)
*   **Objetivo**: Garantir que toda a aplicação (incluindo o Zustand global store e futuros renders) consuma exclusivamente a fachada pública `harmonyEngine.solve`.
*   **Critérios de Sucesso**:
    *   Zero chamadas diretas ao resolvedor Viterbi (`findAutoVoicings` / `findAutoVoicingsAdvanced`) fora do domínio `harmonyEngine`.
    *   Garantia de que a aplicação Web React, o sequenciador de timeline e os futuros renderizadores consumam apenas a especificação abstrata e declarativa exposta no DTO `HarmonyDecision`.

### 📅 Sprint 3.6 & 3.65: MIDI Hardening & Humanization (Concluído)
*   **Objetivo**: Refinar a robustez e a expressividade musical do sequenciador binário.
*   **Especificações Concluídas**:
    *   **Time Signature Meta Event (`0xFF, 0x58`)**: Escrita explícita de fórmula de compasso (ex: 4/4) na trilha inicial, prevenindo defaults inconsistentes em DAWs externas.
    *   **Program Change (`instrumentProgram`)**: Suporte a patch de timbre inicial por canal/trilha (ex: 24 = Nylon Guitar, 0 = Piano, 48 = Strings).
    *   **SMF Tipo 1 (Multi-Track)**: Distribuição física e independente das notas em 4 faixas (Track 0 "Conductor" pura para andamento/tempo, Track 1 "Bass", Track 2 "Guide Tones" e Track 3 "Upper Structure").
    *   **Humanização Semeada (PRNG)**: Introdução de variação de intensidade (+/- 8) e micro-tempo (+/- 6 ticks) baseada em LCG determinístico com semente (`seed`), garantindo reprodução perfeita e consistência nos testes unitários.
    *   **MIDI Validation Suite (Golden Master)**: Testes de integridade bit a bit comparando hashes DJB2 de cadências de referência (`ii-V-I`, `Rhythm Changes`, `Autumn Leaves`) para evitar qualquer regressão.

### 📅 Sprint 4: Progression Realizer (Voicing Layer) (Concluído)
*   **Objetivo**: Introduzir a camada pura e desacoplada de reinterpretação acústica e materialização horizontal das decisões de condução abstratas (`VoicedProgression`).
*   **Design Concluído (SRP & Ortogonalidade)**:
    *   **VoicingLayout (Disposição)**:
        *   `"guitar"`: Preserva exatamente a distribuição de trastes física resolvida pelo resolvedor Viterbi original na guitarra.
        *   `"satb"`: Coraliza as aberturas de forma fixa em exatamente 4 vozes (*Bass, Tenor, Alto, Soprano*).
    *   **VoicingTransform (Técnica)**:
        *   `"none"`: Sem alterações.
        *   `"rootless"`: Remove tônicas para focar a textura em terças, sétimas e tensões.
        *   `"drop2"`: Transpõe a segunda voz mais aguda uma oitava abaixo (`midiNote - 12`).
        *   `"shell"`: Reduz o voicing estritamente a *Root, 3rd, 7th*.
        *   `"quartal"`: Reorganiza os pitches de forma quartal (intervalos de quarta justa), sob a regra estrita e conservativa de não rearmonização (ou seja, `outputNotes ⊆ inputNotes`).
    *   **VoicingMetrics**: Métricas ricas incluindo **`rootPresence`** e **`averageVoiceMotion`** (movimento médio em semitônios entre acordes consecutivos).
    *   **Fachada Polimórfica**: Método `realize` público e `generateMidi` aceitando progressões materializadas diretamente, desmembrando o MIDI da afinação física da guitarra.

### 📅 Sprint 3.7: Harmony Runtime (Planejado)
*   **Objetivo**: Consolidar a camada compartilhada de runtime (`createHarmonyRuntime()`) para orquestrar execução, análise e depuração das decisões.
*   **Benefício**: Centralizar chamadas de depuração e auditorias para serem compartilhadas diretamente entre a Web UI, CLI, REST API e futuros plugins.

### 📅 Sprint 5: Reaper Extension (Planejado)
*   **Objetivo**: Integrar a VoicedProgression diretamente na timeline do DAW Reaper através de ReaScripts e APIs nativas do Reaper, criando itens MIDI de forma automatizada.

### 📅 Sprint 6: MIDI FX Plugin (VST3/CLAP) (Planejado)
*   **Objetivo**: Desenvolver um plugin de efeitos MIDI em formato nativo VST3 ou CLAP capaz de atuar como host e materializar as realizações harmônicas do core engine em tempo real.
