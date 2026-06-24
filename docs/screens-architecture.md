# Arquitetura de Telas: Analisar Partitura & Composer Mode

O Find Chord Suite (V1.0) consolida sua experiência em dois grandes "Domínios Principais", que podem ser alternados no cabeçalho superior (`SuiteApp.tsx`). Ambos os domínios reagem ao estado de conexão do MuseScore e compartilham acesso ao Fretboard/Chords através de stores do Zustand (`useChordStore` e `useOntologySessionStore`).

Abaixo está o detalhamento completo do que cada tela exibe e de quais painéis/componentes elas são formadas.

---

## 1. Domain: Escrever (Composer Mode)

**Responsabilidade:** Ser a prancheta principal de captação e input de acordes, pesquisa por "voicings" (shapes) e visualização de teoria estática para violão/guitarra.
**Componente Principal:** `<BuilderMVP />` (renderiza o `<BuilderContent />` encapsulado em um `<BuilderProvider />`).
**Layout:** Utiliza o `<StandardLayout />` que divide a tela em quatro abas principais (*tabs*).

### Abas de Navegação (Tabs)

#### Aba 1: Captura & Fretboard (Input)
- **Componente:** `<VirtualFretboard />`
- **Exibe:** O braço virtual do instrumento (violão/guitarra).
- **Como fazer:** Responde a cliques no braço do violão. O usuário capta os "shapes" e clica em notas no braço. Ele mapeia fisicamente onde o usuário põe os dedos. É aqui que os acordes são injetados inicialmente no *timeline* caso o usuário não os toque via MuseScore.

#### Aba 2: Teoria & Biblioteca (Translation)
- **Componente:** `<TranslationLayer />`
- **Exibe:** Tradução estática entre as notas pressionadas no *Fretboard* e a teoria clássica (ex: quais intervalos formam o acorde X). Provavelmente exibe a cifra e como as cordas soltas ou casas pressionadas formam a extensão do acorde (Tônica, 3ª, 5ª, 7ª, 9ª etc).
- **Como fazer:** Consome o array de notas/cordas atual e roda cálculos de teoria (`tonal` / teoria musical) para validar ou mostrar as tensões montadas pelo shape atual.

#### Aba 3: Shapes Alternativos (Voicings)
- **Componente:** `<VoicingSearchLayer />`
- **Exibe:** Catálogo de inversões e aberturas diferentes pelo braço do instrumento (Drop 2, Drop 3, aberturas abertas/fechadas).
- **Como fazer:** Recebe uma cifra base (ex: `Cmaj7`) e consulta a biblioteca/dicionário gerador de voicings do Find Chord, plotando botões/fretboards compactos sugerindo ao usuário onde mais ele pode tocar o mesmo acorde ao longo do braço para otimizar *voice leading*.

#### Aba 4: Escalas Compatíveis (Scales)
- **Componente:** `<ScaleOverlayPanel inline={true} />`
- **Exibe:** Sugestões de escalas que repousam em cima do acorde da vez (ex: Jônio, Lídio, Menor Harmônica).
- **Como fazer:** Pega o contexto da progressão ou apenas o acorde puro e retorna o "pool" de escalas. Geralmente joga "overlays" iluminados por cima do braço da guitarra para o usuário conseguir solar/improvisar.

---

## 2. Domain: Analisar Partitura

**Responsabilidade:** Receber o Score (partitura) exportado em XML via Bridge, derivar a **Ontologia Harmônica Inteira** da música e renderizar dashboards macro e micro de visualização analítica (F14 e F15).
**Componente Principal:** `<ScoreAnalysisDashboard />`
**Fonte de Dados:** `<useOntologySessionStore>` (onde ficam armazenados o `FunctionalAnalysis` e os `Indexes`).

Este domínio apresenta um menu em pílulas (*DashboardPanel*) composto por 5 painéis alternáveis:

### Painel 1: Narrativa (Visão Geral)
- **O que Exibe:** 
  - A historinha da música. Resumos textuais em linguagem natural gerados pelo `HarmonicNarrativeCompiler` (ex: "A música abre de maneira estável em Dó Maior e modula intensamente pro fim").
  - Centro tonal Global e fluxo de regiões macro (ex: `C M [1-4] -> G M [5-8]`).
  - Blocos dos acordes iluminados por Função e Intenção (`PROLONGATION`, `RESOLUTION`, etc).
- **Como fazer:** Percorre a prop `narrativeExplanation` do `FunctionalAnalysis` e gera blocos de `text-zinc-200`.

### Painel 2: Estrutura (Visão F14 / Árvore)
- **O que Exibe:** O grafo de hierarquia (`regionTree` e `Sections`). Expande de Macro seções (A, B, Chorus) para Frases -> Acordes.
- **Como fazer:** Renderiza árvores (node trees) ou listas indentadas demonstrando fisicamente como os pequenos blocos de acordes pertencem a blocos de transição maiores.

### Painel 3: Tensão (Curva de Intensidade)
- **O que Exibe:** O "Tension Array" ou "Mapa de Calor" dinâmico. Pinta os acordes na tela da cor Verde (Estável) ao Vermelho (Alta Tensão).
- **Como fazer:** Baseia-se no cálculo numérico de instabilidade e dissonância da `progressionAnalysis`. Renderiza chips/botões com legendas que variam (`<25%`, `25-50%`, `>75%`).

### Painel 4: Auditoria Técnica (Linter Harmônico)
- **Componente:** `<InspectorDashboard />`
- **O que Exibe:** Uma caixa de alertas (ShieldAlert) relatando "Violações" ou "Dissonâncias Semânticas". Funciona como o ESLint da harmonia. Exibe erros tipo "Acorde C6/9 caindo sem cadência em área de dominante".
- **Como fazer:** O `InspectorEngine` roda sob a ontologia e emite um array de "diagnostics". A tela renderiza uma lista apontando o erro, gravidade e a respectiva medida/compasso do incidente.

### Painel 5: Explainability (What / Why / How)
- **Sub-Componentes Envolvidos:** `<ExplainabilityTimeline />`, `<RegionExplainabilityPanel />`, `<DecisionTreeVisual />`, `<AttractorRadar />` e futuramente `<HarmonicCounterfactual />`.
- **O que Exibe:** Explica *exatamente por quê* a engine achou que um acorde é de Preparação ao invés de Resolução. Mostra a árvore de decisão visual e o radar de atractores magnéticos do acorde atual (gravidade Tonal vs Modal).
- **Como fazer:** Aciona os recém-criados `ExplainabilitySnapshots` pré-cacheados na `FunctionalAnalysis` (O(1)) e espalha em gráficos Spider (Radar) e caixas que desconstroem o Score Tonal (`deltaRole`, `deltaIntent`).

---

## Como a Ponte UI -> Engine Acontece

Sempre que a partitura atualiza no MuseScore, o plugin despacha as mudanças para o WebSocket no NodeJS, que repassa pro React, ativando:

```typescript
useOntologySessionStore.getState().loadScore(snapshot);
```
Que imediatamente roda a `analyzeProgression()` do zero (gerando o Hash determinístico do novo estado), recalcula as Regiões, engole os `ExplainabilitySnapshots` e joga nas telas que, de forma puramente reativa, redesenham todos os gráficos e narrativas.

---

## 3. Domain: Composer Mode

**Responsabilidade:** Ser o laboratório de experimentação e orquestração de hipóteses (Universos Contrafactuais). Onde o usuário aciona a MutationSandbox para explorar rotas alternativas para a mesma melodia.
**Componente Principal:** `<ComposerModeLayout />`
**Layout:** Composto por uma Sidebar Lateral (Esquerda) e uma Área Principal (Direita), encapsulado em `<StandardLayout />`.

### Painel 1: Controles & Contexto (Esquerda)
- **Componente:** `<ComposerControls />`
- **O que Exibe:** O painel de comando do orquestrador. Mostra a melodia extraída (notas isoladas que precisam ser harmonizadas) e permite configurar os "Harmonic Invariants" (ex: "Preservar a fundamental", "Fixar resolução em Cmaj7").
- **Como fazer:** Coleta parâmetros do usuário e prepara o DTO `GenerationContext` que será enviado para as engines de mutação.

### Painel 2: Trilha Histórica (Direita, Topo)
- **Componente:** `<ExplorationHistoryView />`
- **O que Exibe:** Uma interface estilo "commits" ou "breadcrumbs" com o histórico de bifurcações.
- **Como fazer:** Rastreia cada decisão ou mutação escolhida pelo usuário. Se o usuário estiver na mutação C, ele pode clicar na A para dar "rollback" da progressão.

### Painel 3: Rota Ativa (Direita, Meio)
- **Componente:** `<ActiveRoutePanel />`
- **O que Exibe:** Compara visualmente os acordes originais (`originalChords`) com a rota que o usuário está visualizando ou testando neste momento.
- **Como fazer:** Provavelmente será o principal cliente do `deltaRole`, `deltaIntent` e do painel comparativo da `MutationSandbox` para destacar o que mudou na função do acorde modificado.

### Painel 4: Feed de Hipóteses (Direita, Base)
- **Componente:** `<RouteFeed />`
- **O que Exibe:** O feed infinito ou lista de rotas contrafactuais sugeridas pelo orquestrador (F13).
- **Como fazer:** Lê do motor de Mutações (RouteMutationEngine) que injeta dezenas de sugestões. O usuário rola por elas, escuta o playback e escolhe uma para "aplicar" (tornando-a a nova Rota Ativa).
