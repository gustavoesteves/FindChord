# Find Chord Core API v1 Specification

Este documento define a especificação oficial de contratos e modelos de dados do **Find Chord Core API v1**. Esta camada serve como a "verdade única" (Source of Truth) que desacopla o motor analítico e metateórico de qualquer interface de exibição cliente (MuseScore plugins, VSCode adapters, aplicativo mobile, DAW VST).

---

## 📐 Hierarquia de Intercâmbio Harmônico

O ecossistema divide a representação da harmonia em três níveis de abstração crescentes, mapeados de forma homóloga à arquitetura de compiladores e processamento de linguagem natural:

```
CanonicalChordEvent       (Micro-harmonia / Token / Acorde)
         ↓
CanonicalProgressionEvent (Macro-harmonia / AST / Sentença / Progressão)
         ↓
CanonicalScoreEvent       (Super-macro-harmonia / Programa / Obra Completa)
```

---

## 📦 1. CanonicalChordEvent
Representa o nível do acorde individual, suas posições físicas, afinação ativa e metadados cognitivos.

### TypeScript Definition
```typescript
export interface CanonicalChordEvent {
  id: string;                            // Identificador único com prefixo (ex: "ch_Gmaj7_1")
  symbol: string;                        // Cifra harmônica (ex: "Gmaj7/B")
  voicing: {
    notes: number[];                    // Notas MIDI absolutas ordenadas de baixo para cima (pitch crescente)
    frets?: (number | null)[];          // Casas pressionadas nas cordas (null se abafada/não tocada)
  };
  tuning: {
    instrument: string;                 // Nome do instrumento de cordas (ex: "Guitarra", "Ukulele")
    strings: string[];                  // Afinação absoluta das cordas (ex: ["E2", "A2", "D3", "G3", "B3", "E4"])
  };
  inversion: 'Root' | 'First' | 'Second' | 'Third' | string;
  voicingType?: string;                 // Tipo de voicing (ex: "Drop-2", "Drop-3", "Closed", "Quartal")
  tensionLevel?: number;                // Grau de tensão do acorde [0.0 a 1.0]
  voiceLeadingScore?: number;           // Nota de voice leading com relação ao acorde anterior [0.0 a 1.0]
  universalLaws?: string[];             // IDs das leis universais que apoiam este acorde
  predictionMechanisms?: string[];      // Escolas do MIG ativas na inferência (ex: ["rp_functional"])
}
```

### Regras de Validação Estrutural
1. **Ordenação de Notas**: O vetor `voicing.notes` deve estar estritamente ordenado em ordem crescente de números MIDI.
2. **Alinhamento de Afinação**: O vetor `voicing.frets` (se presente) deve possuir exatamente o mesmo comprimento que `tuning.strings`. Cada corda do instrumento deve ter uma casa definida (`number`) ou estar explicitamente abafada/não tocada (`null`).
3. **Escalonamento de Scores**: Os campos `tensionLevel` e `voiceLeadingScore` (quando declarados) devem estar normalizados no intervalo $[0.0, 1.0]$.

---

## 📦 2. CanonicalProgressionEvent
Representa o nível da transição e da progressão harmônica local (ex: seção de 8 compassos). É o payload primário utilizado pelo **Find Chord Inspector (Plugin B)** para diagnosticar transições harmônicas e voice leading.

### TypeScript Definition
```typescript
import type { CanonicalChordEvent } from './CanonicalChordEvent';

export interface CanonicalProgressionEvent {
  id: string;                            // ID único da progressão (ex: "pr_verse_1")
  chordEvents: CanonicalChordEvent[];    // Cadeia ordenada de acordes
  tonalCenters: string[];                 // Centros tonais estimados ao longo da progressão (ex: ["C", "Am"])
  narrativeSegments?: string[];           // Parágrafos descritivos da jornada regional de modulação/estabilidade
  globalTensionCurve?: number[];          // Curva de tensão por acorde (valores correspondentes a chordEvents)
  activeParadigms?: string[];             // Programas de pesquisa concorrentes ativos no MPC
  metaTheoryId?: string;                  // ID da Metateoria (F11-X) que embasa a análise da progressão
}
```

### Regras de Validação Estrutural
1. **Cardinalidade Mínima**: A progressão deve conter pelo menos 1 acorde (`chordEvents.length >= 1`).
2. **Correspondência de Curva**: O vetor `globalTensionCurve` (se presente) deve possuir o mesmo comprimento que `chordEvents`. Cada valor representa a tensão do acorde correspondente no mesmo índice.
3. **Mapeamento de Transições**: O cálculo de `voiceLeadingScore` no acorde `chordEvents[i]` é computado tomando como referência de partida o acorde anterior `chordEvents[i - 1]`. Para o primeiro acorde `chordEvents[0]`, o score pode ser nulo ou refletir a inércia do ponto de partida da peça.

---

## 📦 3. CanonicalScoreEvent
Representa o nível da obra completa (super-macro-harmonia). É o payload utilizado pelo **Find Chord Narrative (Plugin C)** para interpretar a jornada estrutural global e a metateoria unificada.

### TypeScript Definition
```typescript
import type { CanonicalProgressionEvent } from './CanonicalProgressionEvent';
import type { MetaTheory } from './MetaTheory';

export interface SectionNarrative {
  sectionId: string;
  name: string;                           // Nome formal da seção (ex: "Exposição", "Refrão", "Parte A")
  range: { startMeasure: number; endMeasure: number };
  progressionId: string;                  // Referência para o ID do CanonicalProgressionEvent
  localNarrative: string;                 // Descrição explicativa local desta seção
}

export interface CanonicalScoreEvent {
  id: string;                            // ID único da partitura (ex: "sc_sonata_op1")
  title: string;                         // Título da obra
  progressionEvents: CanonicalProgressionEvent[];
  globalNarrative: string;                // Análise textual global sintetizando a peça inteira
  sections: SectionNarrative[];           // Segmentação formal e seções musicais da peça
  metaTheory: MetaTheory;                 // A Metateoria (F11-X) dominante que sintetiza a obra
  dominantResearchPrograms: string[];     // Paradigmas/escolas predominantes na peça (ex: ["rp_transformational"])
  universalLawsActivated: string[];       // Todos os IDs de leis universais ativadas na obra
}
```

### Regras de Validação Estrutural
1. **Cardinalidade Mínima**: O score deve conter pelo menos 1 progressão (`progressionEvents.length >= 1`).
2. **Consistência de Mapeamento**: Todo `progressionId` referenciado na lista de seções `sections[i].progressionId` deve existir e corresponder a um ID de `progressionEvents`.
3. **Sobreposição de Compassos**: As faixas de compassos definidas em `sections[i].range` devem ser contíguas e não-sobrepostas (start/end logicamente ordenados).

---

## 🔄 Fluxo de Ciclo de Vida do Evento Canônico

```
     Builder (Input)        Inspector (Lint/Debug)       Narrative (Interpretation)
 [Desenhar/Capturar Acorde]  [Diagnóstico de Transições]  [Significado & Metateoria]
           ↓                              ↓                            ↓
  Produces:                      Consumes:                    Consumes:
  CanonicalChordEvent            CanonicalChordEvent[]        CanonicalProgressionEvent[]
                                 Produces:                    Produces:
                                 CanonicalProgressionEvent    CanonicalScoreEvent
```

Qualquer alteração física do voicing na partitura pelo usuário invalida os metadados canônicos salvos no nó correspondente, disparando um sinal de reanálise automática para re-computação do payload pelo Find Chord Engine.
