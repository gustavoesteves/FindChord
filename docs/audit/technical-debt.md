# Technical Debt Report — F11-AUD
**Technical Debt Inventory, Circular Imports & Criticality Matrix**

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

### [P1] Pré-Cálculo Massivo e Caching de Chords (Viterbi Allocation)
* **Arquivo afetado**: [progressionAnalysis.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/orchestrators/progressionAnalysis.ts#L69-L80)
* **Descrição**: O orquestrador realiza a pré-análise completa do vetor de acordes para cada uma das 27 chaves candidatas. Isso aloca arrays inteiros de instâncias pesadas de `FunctionalChord` que persistem na memória durante todo o processo.
* **Impacto**: Consumo de memória RAM escala linearmente com o número de candidatos, batendo no teto do heap do V8 e gerando estouro de memória (Out Of Memory) em progressões grandes.
* **Ação Corretiva**: Adotar lazy evaluation (análise sob demanda) ou reduzir o DTO cache pré-Viterbi para armazenar apenas as pontuações brutas (valores de probabilidade local) em vez do objeto de representação visual inteiro.

---

### [P1] Evasão de Tipagem Estrita (Uso Excessivo de `any` Casts)
* **Arquivos afetados**: 
  * [resolveGlobalPath.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/viterbi/resolveGlobalPath.ts#L624) (`finalHyps as any`)
  * [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts#L216) (`targetChord.debug as any`, `c.debug as any`)
* **Descrição**: A tipagem de depuração e as estruturas internas de hipóteses em tempo de compilação são burladas com coerções para `any`.
* **Impacto**: O compilador do TypeScript perde a capacidade de validar erros de estrutura em tempo de build, abrindo brechas para falhas silenciosas de ponteiro nulo em produção (Runtime crashes).
* **Ação Corretiva**: Tipar formalmente todas as propriedades dinâmicas do objeto `debug` e alinhar as interfaces de `TonalHypothesis` com os retornos do motor de consenso.

---

### [P2] Acoplamento Circular Lógico no Loop Contrafactual
* **Arquivos afetados**: [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts) e [progressionAnalysis.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/orchestrators/progressionAnalysis.ts)
* **Descrição**: O orquestrador de análise chama o motor de estabilidade, que por sua vez re-executa a análise harmônica completa via callback.
* **Impacto**: Embora evite a dependência circular física no compilador por meio do uso de callback em runtime, cria-se um acoplamento lógico forte em loop, dificultando a modularização e testes isolados. Além disso, causa explosão de complexidade algorítmica ($O(N^2)$).
* **Ação Corretiva**: Isolar as regressões contrafactuais em uma classe de serviço desacoplada que opere apenas nas matrizes de pontuação do Viterbi pré-calculadas, eliminando a recursão completa de análise.

---

### [P2] Métricas Mortas no Detector de Fronteiras
* **Arquivo afetado**: [TheoryFrontierDetector.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/TheoryFrontierDetector.ts)
* **Descrição**: As variáveis `adi` e `cfs` são mapeadas e processadas, mas nunca chegam à interface visual do Compose Suite ou são logadas de maneira útil.
* **Impacto**: Processamento desnecessário pós-Viterbi gerando lixo na heap para rastrear métricas acadêmicas inativas na prática.
* **Ação Corretiva**: Remover a computação dessas métricas pós-hoc se não houver interesse de telemetria visual, ou adicioná-las ativamente ao contrato JSON consumido pelo frontend.

---

### [P3] Arquivos Experimentais Órfãos
* **Diretório afetado**: [src/utils/music/analysis/_experimental/](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/_experimental/)
* **Descrição**: Presença do script `transitionTrainer.ts` e diretórios auxiliares que serviram de protótipos de treinamento de transições.
* **Impacto**: Lixo no repositório aumentando a fricção de leitura para desenvolvedores novos.
* **Ação Corretiva**: Excluir a pasta experimental ou movê-la para um repositório separado de pesquisa/ferramental de suporte.
