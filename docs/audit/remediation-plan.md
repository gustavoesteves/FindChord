# Remediation Plan — F11-AUD
**F12 Development Backlog & Technical Debt Remediation Roadmap**

Este documento estabelece o backlog estruturado de engenharia para a remediação das fragilidades e débitos técnicos identificados durante a auditoria executiva de arquitetura do **Find Chord**.

---

## 🛠️ Sprint Intermediária F11-AUD-REM (Remediação Imediata)

Antes de iniciar o desenvolvimento das interfaces e plugins em F12, foi estabelecida a sprint **F11-AUD-REM** para consolidar a qualidade e governança da base de código. O foco desta sprint é resolver quatro pontos chaves mapeados:

1.  **Saneamento de Telemetria Morta**: Ativar os campos `adi` (Academic Disaccord) e `cfs` (Consensus Fragility Score) no fluxo de consenso ativo do resolvedor.
2.  **Expurgo de Campos Órfãos**: Limpar os contratos de transferência (interfaces canônicas) removendo campos sem consumo real ou os ativando de vez.
3.  **Congelamento Definitivo da API v1**: Estabelecer que os contratos `CanonicalChordEvent`, `CanonicalProgressionEvent` e `CanonicalScoreEvent` sob `/api/v1/contracts` estão congelados (`FROZEN`).
4.  **Consolidação Filosófica do Builder**: Documentar e definir formalmente o plugin Builder como um **Transcritor de Voicings** (entrada e mapeamento de dedos/notas para partitura), sem IA ou sugestões criativas.

---

## Backlog de Remediação

### P0 (Bloqueia F12)
*Nenhum item P0 pendente no momento da auditoria. A bridge local e a segurança de rede encontram-se estabilizadas e aprovadas.*

---

### P1 (Deve ser corrigido antes do Builder)

#### 1. Eliminação da Lentidão Quadrática $O(N^2)$ do Loop Contrafactual
* **Item**: Otimização do cálculo de estabilidade e causalidade para remover a re-execução total do resolvedor Viterbi.
* **Responsável**: Engenheiro de Núcleo Científico (Scientific Core Engineer)
* **Impacto**: Redução imediata do tempo de processamento de progressões de 500 acordes de minutos para menos de $2\text{ segundos}$, desbloqueando a responsividade da UI.

#### 2. Correção do Vazamento de RAM no Cache Viterbi (Heap OOM)
* **Item**: Otimização do cache de estados candidatos pré-Viterbi para evitar a alocação eager de milhares de objetos `FunctionalChord`.
* **Responsável**: Arquiteto de Software (Software Architect)
* **Impacto**: Resolução do estouro de memória (Heap OOM), permitindo a análise contínua de partituras longas de mais de 5.000 acordes sem ultrapassar o teto de 100 MB de RAM.

---

### P2 (Pode ser corrigido durante F12)

#### 1. Limpeza do Contrato Órfão `CanonicalScoreEvent`
* **Item**: Remoção ou simplificação dos campos e interfaces do contrato de partitura não utilizado na produção.
* **Responsável**: Engenheiro de Integrações/API (API Engineer)
* **Impacto**: Redução de complexidade no esquema de validação de dados e eliminação de contratos inativos redundantes no repositório.

#### 2. Substituição do Callback Circular por Acoplamento Desacoplado
* **Item**: Refatoração da interface de chamada recursiva entre o orquestrador `progressionAnalysis.ts` e o motor de estabilidade `InterpretiveStabilityEngine.ts`.
* **Responsável**: Arquiteto de Software (Software Architect)
* **Impacto**: Código limpo, desacoplado, mais fácil de depurar e adequado para testes unitários isolados eficientes.

---

### P3 (Refatoração futura)

#### 1. Remoção de Resíduos de Código Experimental
* **Item**: Exclusão da pasta órfã `src/utils/music/analysis/_experimental/` e do script `transitionTrainer.ts`.
* **Responsável**: Desenvolvedor Core (Core Developer)
* **Impacto**: Repositório de código mais limpo e organizado.

#### 2. Restauração de Tipagem Estrita TypeScript (any cleanup)
* **Item**: Eliminação de coerções para `any` em motores de consenso e estabilidade.
* **Responsável**: Desenvolvedor Core (Core Developer)
* **Impacto**: 100% de segurança de tipos na compilação, eliminando erros silenciosos de tempo de execução por incompatibilidade de DTOs.
