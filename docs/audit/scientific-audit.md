# Scientific Audit — F11-AUD
**Active Scientific Coverage, Influence Scores & Operational Engine Audit**

Este relatório apresenta a auditoria do núcleo científico do **Find Chord**, avaliando a integridade teórica dos modelos implementados e medindo o impacto prático dos componentes acadêmicos na execução em tempo real.

---

## 1. Active Scientific Coverage (ASC)

O indicador **Active Scientific Coverage (ASC)** mede a proporção de componentes científicos definidos na base de conhecimento que realmente participam das análises harmônicas executadas em runtime pelo motor principal.

### Inventário de Componentes Científicos

1. **Universal Laws (Leis Universais)**:
   * `parsimonious_voice_leading` (Vozes curtas)
   * `chromatic_attraction` (Atração cromática)
   * `functional_gravity` (Resolução diatônica)
   * `symmetry_seeking` (Caminhos Tonnetz)
   * `axis_system_substitution` (Substituições Bartók/Lendvai)
   * `functional_resolution` (Gravidade diatônica residual)
   * *Total: 6 leis.*

2. **Research Programs (Programas de Pesquisa)**:
   * `rp_functional` (Programa funcionalista)
   * `rp_symmetric` (Programa de eixos simétricos)
   * `rp_transformational` (Programa transformacional Neo-Riemanniano)
   * *Total: 3 programas.*

3. **MetaTheories (Metateorias)**:
   * `mt_traditional_functional_harmony` (Metateoria tonal padrão)
   * `mt_parsimonious_voice_leading_symmetry_seeking` (Metateoria harmônica unificada dinâmica)
   * *Total: 2 metateorias.*

**Total de Componentes Científicos Definidos = 11**

---

### Execução em Runtime (Ponto Crítico)

Durante a execução da função principal de análise harmônica [analyzeProgression](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/orchestrators/progressionAnalysis.ts):
* O motor de extração de leis universais (`UniversalLawExtractionEngine`) e o avaliador de cinturão protetor de programas (`LakatosResearchProgramEngine`) **nunca** são acionados no fluxo principal. Eles são executados apenas de forma isolada em scripts de benchmarks de teste.
* O orquestrador de síntese de metateorias (`MetaTheorySynthesisEngine`) não participa da análise regular. A propriedade `metaTheoryId` do contrato canônico é preenchida com valores fixos estáticos ou mocks no frontend.
* O único componente ativo no runtime regular é a modelagem de consenso local no **MIG** (`ConsensusModelingEngine`), que calcula o grafo de interpretações acadêmicas.

### Cálculo de ASC

$$ASC = \frac{|\text{Componentes utilizados em runtime}|}{|\text{Componentes científicos totais}|} = \frac{1\ (\text{MIG})}{11} = 0.0909\ (9.09\%)$$

> [!WARNING]
> **Diagnóstico (Criticidade: P1)**: O Find Chord carrega mais de 90% de sua infraestrutura científica como "peso morto" no código de produção. Essa complexidade acadêmica infla o volume de código e a sobrecarga de testes, mas não agrega valor na leitura final feita pelo usuário do Compose Suite ou do MuseScore.

---

## 2. Scientific Influence Score (SIS)

O **Scientific Influence Score (SIS)** quantifica o peso real de cada componente nas decisões de resolução de caminhos tomadas pelo algoritmo Viterbi:

| Componente Científico | Influência (SIS) | Justificativa Técnica | Criticidade |
| :--- | :---: | :--- | :---: |
| **Modelos de Transição (Gramática)** | **0.95** | A matriz de transição híbrida (`HybridTransitionModel`) pondera pesos entre regras teóricas clássicas e frequências empíricas de corpus, atuando diretamente nos scores do Viterbi Beam Search. | P3 (Ok) |
| **Priors Musicológicos** | **0.00** | O motor de prioridades clássicas (`MusicologicalPriorEngine`) é aplicado após a resolução do caminho ótimo pelo Viterbi, modificando as probabilidades do DTO apenas para fins de exibição gráfica. | **P1** |
| **Calibragem Bayesiana** | **0.00** | A atualização Bayesiana de verossimilhança harmônica é executada de forma pós-hoc, não alterando a escolha de tom do resolvedor Viterbi. | **P1** |
| **MIG / Grafo de Consenso** | **0.00** | O grafo de interpretações concilia visões pós-análise. Ele não retroalimenta o Beam Search. Se desativado, o caminho harmônico resultante é idêntico. | **P1** |
| **MetaTheory** | **0.00** | Nenhuma influência nas decisões analíticas; atua como camada de texto expositiva gerada após o fechamento da análise harmônica. | **P1** |

---

## 3. Auditoria de Operação do MIG (Musicological Interpretation Graph)

Para avaliar a necessidade do MIG, respondemos às seguintes perguntas de design de arquitetura:

* **Os paradigmas competem?** Sim. A modelagem no MIG contrapõe visões diatônicas (Funcionalismo/Jazz) com abordagens pós-tonais (Set Theory/Neo-Riemanniana) em acordes não-diatônicos complexos.
* **Os paradigmas divergem?** Sim. Em peças altamente cromáticas (como o acorde de Tristan ou ciclos octatônicos), as escolas atribuem probabilidades conflitantes, gerando nós de `ONTOLOGY_CONFLICT`.
* **O vencedor influencia o resultado da análise?** Não. O "vencedor" é determinado pela probabilidade de Viterbi computada independentemente do MIG. O MIG apenas organiza os nós e arestas de suporte para explicar a leitura obtida.
* **O resultado seria igual sem o MIG?** Sim. O caminho de acordes, os tons atribuídos e as cifragens canônicas exportadas para o MuseScore seriam rigorosamente idênticos sem a execução do MIG.

> [!IMPORTANT]
> **Conclusão**: O MIG funciona como um excelente **Explicador Pedagógico** para o painel visual do Compose Suite, mas é **nulo como Decisor Operacional**. Ele não deve ser tratado como um motor de inteligência ativa para resolução de ambiguidades.

---

## 4. Auditoria de Operação da MetaTheory

Realizamos o teste comparando a execução normal do pipeline do Find Chord com a supressão lógica da metateoria (`MetaTheoryEngine`):

* **Resultados de Notas/Vozes**: $0\%$ de alteração. As notas do resolvedor e do voice leading permanecem idênticas.
* **Tempo de Execução**: Redução irrisória de tempo (menos de $1\text{ ms}$ em progressões comuns), uma vez que a síntese de metateoria em si é apenas um cálculo de percursos em grafos estáticos executado uma única vez ao final.
* **Decisões de Modulação**: $0\%$ de impacto. As modulações mantêm-se alinhadas aos mesmos compassos.

> [!IMPORTANT]
> A metateoria é puramente uma **camada interpretativa/explicativa textual** para a narratividade final. Ela é um produto decorativo voltado à experiência do usuário no dashboard e não exerce influência operacional ou estrutural.

---

## 5. Auditoria de Lacunas de Telemetria

Ao inspecionar o arquivo [TheoryFrontierDetector.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/TheoryFrontierDetector.ts), identificamos o seguinte fluxo:
```typescript
    const adi = state.adi ?? 0;
    const cfs = state.cfs ?? 0;
```
* **Diagnóstico**: As métricas `adi` (Academic Disaccord) e `cfs` (Consensus Fragility Score) são computadas no Viterbi pós-hoc chamando `computeConsensus`. No entanto, em trechos onde a análise Viterbi recorre a fallbacks de colunas por falta de hipóteses qualificadas, essas métricas são inicializadas como `undefined`. O detector de fronteiras contorna isso aplicando silenciamento para zero (`?? 0`), ocultando potenciais falhas de amostragem científica nos logs operacionais. O Compose Suite também não expõe essas métricas aos usuários finais, tornando-as variáveis zumbis.
