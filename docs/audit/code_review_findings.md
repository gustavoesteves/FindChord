# Revisão de Código — Lacunas Não Cobertas pelo Plano F11-AUD-REM

Realizei uma varredura profunda no código fonte do motor de análise harmônica para verificar se o plano de implementação cobre todos os problemas reais. Abaixo está o resultado organizado por criticidade.

---

## ✅ O que o plano já cobre bem

| Item | Status |
| :--- | :--- |
| Congelamento dos contratos v1 (`FROZEN`) | ✅ Coberto |
| Campos órfãos do `CanonicalScoreEvent` → `@deprecated` | ✅ Coberto |
| Ativação de ADI/CFS no fallback do Viterbi | ✅ Coberto |
| Auditoria de consumo de telemetria | ✅ Coberto |
| Auditoria de mutabilidade dos contratos | ✅ Coberto |
| Filosofia do Builder | ✅ Coberto |
| Categoria R&D para Lakatos e Contrafactuais | ✅ Coberto |

---

## ⚠️ Lacunas Encontradas (Não Cobertas)

### 1. Padrão Monkey-Patch via `as any` entre Engines (Criticidade: P2)

Encontrei um padrão recorrente e perigoso: engines que **escrevem propriedades em objetos que não possuem** essas propriedades na tipagem oficial, usando `as any` para contornar o compilador TypeScript.

**Casos concretos:**

| Arquivo | Linha | O que faz |
| :--- | :---: | :--- |
| [MusicologicalPriorEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/MusicologicalPriorEngine.ts#L278) | 278 | Injeta `matchedTemplate = true` no array de retorno via `(result as any).matchedTemplate` |
| [resolveGlobalPath.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/viterbi/resolveGlobalPath.ts#L596) | 596 | Lê `(finalHyps as any).matchedTemplate` — comunicação implícita entre engines sem contrato |
| [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts#L216) | 216 | Injeta `cisTotal` no `chord.debug` via `(targetChord.debug as any).cisTotal = finalCis` |
| [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts#L220) | 220 | Lê `(c.debug as any)?.cisTotal` em outro ponto — dado nunca tipado |
| [ConsensusModelingEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/ConsensusModelingEngine.ts#L69) | 69 | Acessa `(h as any).romanNumeral` porque `TonalHypothesis` não contém `romanNumeral` |
| [OntologyReplacementEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/OntologyReplacementEngine.ts#L22) | 22 | Acessa `(active.metadata as any).ontologyId` — `metadata` não contém a propriedade |
| [HypothesisGenerationEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/HypothesisGenerationEngine.ts#L44) | 44 | Mesmo padrão: `(ontology.metadata as any).ontologyId` |

> [!WARNING]
> **Risco**: Esses monkey-patches criam canais de comunicação invisíveis entre engines. Se alguém refatorar `MusicologicalPriorEngine` sem saber que `resolveGlobalPath` lê `matchedTemplate`, o PCS de calibração cai silenciosamente para 0.98 → valor não-calibrado.
> 
> **Recomendação**: Incluir no plano uma tarefa de **tipagem explícita dos contratos inter-engine**, pelo menos para os dois fluxos críticos no runtime (`matchedTemplate` e `cisTotal`). Não precisa ser agora, mas deve ser rastreado.

---

### 2. Código Morto Experimental Confirmado (Criticidade: P3)

A pasta `_experimental/` confirmada como ativa no filesystem:

```
src/utils/music/analysis/_experimental/fx/transitionTrainer.ts (2.940 bytes)
```

Este arquivo **não é importado por nenhum código de produção** — apenas por um teste isolado (`transitionLearning.test.ts`). O plano de remediação anterior mencionava isso (P3), mas o plano atual **F11-AUD-REM não o inclui explicitamente**.

> [!NOTE]
> **Recomendação**: Adicionar como tarefa P3 (executável durante F12) para manter o escopo da sprint limpo.

---

### 3. Acoplamento Circular do Loop de Estabilidade (Criticidade: P1 — já mapeado, mas merece destaque)

O orquestrador [progressionAnalysis.ts:L321](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/orchestrators/progressionAnalysis.ts#L321) chama:

```typescript
computeStabilityAndCausality(fullAnalysisDTO, (prog) => analyzeProgression(prog, profile, true));
```

Isso significa que o `InterpretiveStabilityEngine` **re-executa o pipeline inteiro** (incluindo Viterbi, cache de 24 chaves, cadências) para cada perturbação contrafactual. Isso produz o comportamento $O(N^2)$ documentado.

O plano remete isso para **F12-F (Performance Hardening)**, o que está correto. Porém, o impacto real vai além da performance:

- A flag `isPerturbation = true` desativa estabilidade e fronteiras, evitando recursão infinita.
- Mas o cache de `FunctionalChord[]` para 24+ estados × N acordes é **recriado do zero** a cada perturbação — este é o verdadeiro ponto de estouro de heap.

> [!IMPORTANT]
> **Recomendação**: Documentar isso explicitamente no plano como **P1 técnico com solução adiada para F12-F**, com a nota de que a solução provável é um cache compartilhado de perturbações ou uma heurística de amostragem (sample K perturbações em vez de todas N).

---

### 4. `console.error` em Código de Produção (Criticidade: P3)

Encontrei 3 ocorrências de `console.error` em engines de produção:

| Arquivo | Contexto |
| :--- | :--- |
| [harmonicStateEvaluator.ts:L38](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/harmonicStateEvaluator.ts#L38) | Catch genérico no avaliador de voice leading |
| [discoveryEngine.ts:L49](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/discoveryEngine.ts#L49) | Erro ao processar progressão do corpus |
| [discoveryEngine.ts:L157](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/discoveryEngine.ts#L157) | Erro ao analisar progressão sob demanda |

> [!NOTE]
> Não é grave, mas quando o sistema migrar para o MuseScore via bridge, esses `console.error` se perdem no void. Se quisermos observabilidade real, eles devem eventualmente ser encapsulados em um logger estruturado. **Rastrear como P3.**

---

### 5. Ausência de `romanNumeral` na Interface `TonalHypothesis` (Criticidade: P2)

A interface [TonalHypothesis](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/models/AdaptiveTonalState.ts#L5-L11) não declara `romanNumeral`, mas o `ConsensusModelingEngine` acessa `(h as any).romanNumeral` duas vezes. Isso indica que a informação existe de fato no objeto em runtime (vinda do `FunctionalHypothesis`), mas **não está tipada no contrato público**.

> [!TIP]
> **Correção simples**: Adicionar `romanNumeral?: string` à interface `TonalHypothesis` e remover os `as any` correspondentes. Pode ser feito na Parte A (Governança) junto com a revisão dos contratos.

---

## Resumo de Ajustes Sugeridos ao Plano

| # | Achado | Criticidade | Ação Proposta | Quando |
| :---: | :--- | :---: | :--- | :--- |
| 1 | Monkey-patches `as any` entre engines (`matchedTemplate`, `cisTotal`, `ontologyId`) | P2 | Rastrear como dívida; tipar `matchedTemplate` e `cisTotal` nos modelos | F11-AUD-REM ou F12 |
| 2 | `romanNumeral` ausente em `TonalHypothesis` | P2 | Adicionar campo opcional na interface | F11-AUD-REM (Parte A) |
| 3 | Pasta `_experimental/` com `transitionTrainer.ts` morto | P3 | Documentar para remoção futura | F12 |
| 4 | `console.error` em 3 engines de produção | P3 | Rastrear para substituição por logger estruturado | F12 |
| 5 | Loop $O(N^2)$ com re-criação de cache completo por perturbação | P1 | Documentar explicitamente como P1 adiado com solução proposta | F12-F |
