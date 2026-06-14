# Technical Debt Report — F11-AUD

Este relatório cataloga os débitos técnicos acumulados nas últimas sprints de pesquisa do **Find Chord**, avaliando riscos de manutenção, vazamentos de tipo e acoplamento.

---

## 1. Matriz de Criticidade de Débitos Técnicos

Adotamos a seguinte classificação para a priorização de correções e refatorações em preparação para a fase F12:

| Criticidade | Definição | Impacto no Roadmap |
| :---: | :--- | :--- |
| **P0** | Bloqueia F12 | Impede a bridge de funcionar ou ameaça a segurança local. |
| **P1** | Deve ser corrigido antes do Builder | Risco crítico de falha de execução ou vazamento severo em produção. |
| **P2** | Pode ser corrigido durante F12 | Risco moderado, acoplamento evitável ou dados mortos/inativos. |
| **P3** | Refatoração futura | Otimização cosmética ou limpeza de arquivos residuais/experimentais. |

---

## 2. Inventário de Achados de Débito Técnico

### [P1] Heap OOM e Loop O(N²) por Perturbações (F12-F)
* **Arquivos afetados**: [progressionAnalysis.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/orchestrators/progressionAnalysis.ts#L321) e [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts)
* **Descrição**: A análise contrafactual chama `computeStabilityAndCausality` re-executando `analyzeProgression` para cada perturbação. O loop em si é $O(N^2)$, mas o impacto real é que a cada perturbação um cache completo de `FunctionalChord` para 24+ tonalidades é recriado do zero.
* **Impacto**: O cache redundante consome muita memória RAM e estoura o heap do V8 em progressões grandes.
* **Solução Proposta**: Compartilhar o cache de acordes harmônicos para contrafactuais ou implementar amostragem de K-perturbações em vez de varrer todas as perturbações contrafactuais.

---

### [P2] Evasão de Tipagem Estrita (Uso de `as any` em `cisTotal` e `ontologyId`)
* **Arquivos afetados**: 
  * [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts#L216) (`(targetChord.debug as any).cisTotal`)
  * [OntologyReplacementEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/OntologyReplacementEngine.ts#L22) (`(active.metadata as any).ontologyId`)
  * [OntologyTournamentEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/OntologyTournamentEngine.ts#L19) (`(active.metadata as any).ontologyId`)
  * [HypothesisGenerationEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/HypothesisGenerationEngine.ts#L44) (`(ontology.metadata as any).ontologyId`)
* **Descrição**: Propriedades epistemológicas e de telemetria interna transitam sem tipagem estrita nos contratos, ocultadas por casts para `any`.
* **Impacto**: Perda de segurança em tempo de compilação; refatorações futuras podem quebrar o fluxo sem emitir erros no compilador.
* **Solução Proposta**: Declarar formalmente `cisTotal` e `ontologyId` nas respectivas interfaces de tipagem.

---

### [P3] Código Morto Experimental
* **Arquivos afetados**: [transitionTrainer.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/_experimental/fx/transitionTrainer.ts)
* **Status**: *experimental orphan*
* **Descrição**: Script usado em protótipos de treinamento de transição. É importado apenas por um arquivo de teste isolado.
* **Impacto**: Aumenta a complexidade cognitiva do repositório para novos contribuidores.
* **Solução Proposta**: Remover do projeto principal ou isolar em repositório de R&D separado.

---

## 3. Observability Debt

Durante o mapeamento de código, identificamos o uso de saídas genéricas que afetam a visibilidade do comportamento do motor em execução incorporada.

### [P3] logs via `console.error` em Produção
* **Arquivos afetados**:
  * [harmonicStateEvaluator.ts:L38](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/harmonicStateEvaluator.ts#L38)
  * [discoveryEngine.ts:L49](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/discoveryEngine.ts#L49)
  * [discoveryEngine.ts:L157](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/discoveryEngine.ts#L157)
* **Descrição**: Capturas genéricas de erro executando `console.error(...)` diretamente na saída padrão do Node.
* **Impacto**: Quando o motor rodar encapsulado no plugin do MuseScore, essas mensagens se perderão ou bagunçarão a saída de log estruturada do plugin.
* **Solução Proposta**: Introduzir um logger estruturado em uma camada de observabilidade dedicada para que mensagens de erro sejam canalizadas corretamente.

---

## 4. Backlog Remanescente (Pós-F11-AUD-REM)

### P1 (F12-F)
* Heap OOM em perturbações
* Cache compartilhado para contrafactuais (Recriação de cache harmônico por perturbação)
* Redução do O(N²)
* Estratégia de amostragem K-perturbações

### P2 (F12)
* Tipagem de `cisTotal`
* Tipagem de `ontologyId`
* Eliminação gradual de `as any`

### P3
* Logger estruturado
* Limpeza de `_experimental` (`transitionTrainer.ts`)
* Observability Layer

### R&D (Ativos Científicos Isolados)
* Lakatos
* Contrafactuais científicos
* Meta-benchmarks epistemológicos
