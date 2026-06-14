# Relatório de Consumo de Telemetria — ADI & CFS

Este relatório apresenta o mapeamento de escrita e consumo dos indicadores de telemetria **ADI** (Academic Disaccord) e **CFS** (Consensus Fragility Score) no motor de análise harmônica.

---

## 1. Definições Científicas

*   **ADI (Academic Disaccord)**: Mede o grau de divergência interpretativa entre os diferentes paradigmas musicológicos (MIG) em relação a um determinado acorde. Varia entre `0.0` (consenso absoluto) e `1.0` (desacordo absoluto).
*   **CFS (Consensus Fragility Score)**: Mede quão sensível e instável é a escolha do centro tonal dominante a pequenas perturbações contrafactuais nas notas físicas de entrada.

---

## 2. Fluxo de Escrita e Produção (Writers)

Os indicadores são gerados dinamicamente a cada passo de análise:

1.  **ConsensusModelingEngine**:
    *   Arquivo: [ConsensusModelingEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/ConsensusModelingEngine.ts)
    *   Gera e normaliza os scores de ADI e CFS com base no grafo de interpretações e perturbações locais.
2.  **Viterbi Core (Fallback & Integração)**:
    *   Arquivo: [resolveGlobalPath.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/viterbi/resolveGlobalPath.ts)
    *   Consome o resultado do consenso e popula a lista de `adaptiveTonalStates`. Em cenários de fallback de colunas (sem caminhos ativos), inicializa valores seguros equivalentes a `computeConsensus` com uma única hipótese.

---

## 3. Matriz de Consumo Ativo (Readers)

Apesar de não estarem expostos diretamente na interface principal do Compose Suite no momento da auditoria, ambos os campos possuem consumo crítico em motores analíticos e de explicação:

### 3.1. Theory Frontier Detector (Detecção de Fronteiras Teóricas)
*   **Arquivo**: [TheoryFrontierDetector.ts:L12-17](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/TheoryFrontierDetector.ts#L12-L17)
*   **Consumo**: Lê `adi` e `cfs` para calcular o **TAS** (Theory Adequacy Score):
    ```typescript
    const tas = 1.0 - (0.4 * adi + 0.3 * cfs + 0.3 * (1.0 - iss));
    ```
*   **Importância**: Identifica pontos de transição e dissonância epistemológica onde as teorias de harmonia tradicional perdem adequação explicativa.

### 3.2. Epistemic Embedding Engine (Representação Epistêmica)
*   **Arquivo**: [EpistemicEmbeddingEngine.ts:L21-65](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/EpistemicEmbeddingEngine.ts#L21-L65)
*   **Consumo**: Utiliza `cfs` e `adi` como dimensões vetorizadas do embedding de 7 dimensões usado para clusterizar o comportamento de acordes no espaço analítico.
*   **Importância**: Alimenta o agrupamento K-Means de regiões de estabilidade e anomalias científicas.

### 3.3. Harmonic Explanation Engine (Motor de Explicação Harmônica)
*   **Arquivo**: [harmonicExplanationEngine.ts:L274-317](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/harmonicExplanationEngine.ts#L274-L317)
*   **Consumo**: Lê `cfs` para injetar explicações textuais automatizadas no painel narrativo:
    *   Se `cfs >= 0.4`: Injeta aviso de que o consenso local é frágil e dependente de eixos específicos.
    *   Se `cfs < 0.4`: Insere confirmação de que o consenso local é robusto.
*   **Importância**: Dá transparência textual sobre a confiabilidade do resolvedor Viterbi para o usuário final.

### 3.4. Theory Discovery Engine (Clusterização e Padrões)
*   **Arquivo**: [TheoryDiscoveryEngine.ts:L88](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/TheoryDiscoveryEngine.ts#L88)
*   **Consumo**: Lê `adi` para computar a média de divergência acadêmica de agrupamentos (`avgADI`) expostos no grafo de padrões analíticos.

---

## 4. Relevância para a Fase F12

Com a introdução dos plugins de integração (incluindo o plugin do MuseScore), o consumo desses dados será ampliado:
1.  **Linter de Estabilidade**: Plugins de composição utilizarão o `cfs` e o `adi` para alertar compositores sobre trechos harmonicamente instáveis ou ambíguos durante o processo criativo.
2.  **Narrative Feed**: O gerador de explicações enriquecidas dependerá da consistência desses valores estarem preenchidos e não-nulos em todas as colunas de acordes, incluindo as tratadas por fallbacks.
