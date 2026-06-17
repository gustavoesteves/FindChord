# RFC: F13-A1 — Harmonic Possibility Explorer
*De Analisador Harmônico para Laboratório Criativo Guiado por Melodia.*

## 1. O Ponto de Inflexão (A Mudança de Pergunta)
O sistema atingiu a maturidade máxima em sua capacidade de descrever o passado ("O que aconteceu?"). Empilhar novas abstrações de identidade ("Quem essa peça é?") torna-se secundário perante a dor principal de um compositor: **"Quais são as possibilidades escondidas dentro desta frase?"**

A F13-A1 opera a grande transição de um sistema *descritivo* para um sistema *generativo-criativo*, sem contudo tentar "corrigir" o usuário. O objetivo não é encontrar a versão "melhor", mas revelar **possibilidades harmônicas latentes** compatíveis com a mesma melodia.

## 2. Princípios Fundamentais
### 2.1 A Melodia é Soberana
Toda alternativa proposta deve respeitar notas estruturais, direção melódica e manter estabilidade mínima entre melodia e harmonia. A melodia é tratada como a restrição física principal.

### 2.2 O Sistema não Corrige, Revela
O motor não dita "Aqui deveria ser um Fmaj7". Ele afirma: "Esta frase admite outras leituras harmônicas", e apresenta vetores de exploração.

### 2.3 O Sistema não Fala sobre Gênero (Abolição de Rótulos Estilísticos)
Nenhuma sugestão utilizará conceitos culturais como "Jazz", "Rock", "Clássico" ou "Cinemático". Tais rótulos misturam harmonia com produção e estética. Toda a exploração permanecerá no rigoroso domínio da teoria musical (ex: *Mais Cromático*, *Mais Expansivo*).

### 2.4 A Harmonia Original é Válida
A rearmonização não pressupõe erro. A harmonia existente não é um "problema a ser consertado", mas sim o ponto de partida do mapa.

### 2.5 O Sistema Trabalha por Exploração Incremental
O objetivo não é entregar a "versão final perfeita" em um clique. O objetivo é apresentar o *próximo passo plausível* de exploração composicional. A ferramenta é um parceiro iterativo, não um oráculo.

## 3. A Nova Arquitetura de Motores (F13)

### 3.1 Melody Extraction Engine
Responsável por conectar-se à partitura, extrair a linha principal (lead) e gerar objetos `MelodicPhrase`.
Introduz o conceito de **Melodic Anchors**: o motor identifica notas estruturais e notas ornamentais.
- **Notas Estruturais:** Recebem prioridade máxima de compatibilidade (rejeitam fortes atritos harmônicos).
- **Notas Ornamentais:** Toleram maior grau de atrito harmônico (podem conflitar momentaneamente com a harmonia sem quebrar a restrição física).

### 3.2 Phrase Function Engine
Antes de sugerir alternativas, o sistema precisa entender a função estrutural: `Estabelecimento -> Prolongamento -> Dominante`.

### 3.3 Phrase Memory Engine & Preservation Contract
O compositor raramente quer apagar o passado; ele quer rearmonizar mantendo resquícios da intenção original. Este motor estabelece um **Contrato de Preservação** explícito antes de gerar rotas:
- **Preservar:** `[x] Melodia (Anchors)  [x] Função Cadencial  [x] Centro Tonal`
- **Permitir Alteração:** `[x] Densidade Harmônica  [x] Dominantes Secundárias`

Internamente, ele mede:
- `tonalMemory`: Grau de retenção do centro original.
- `cadentialMemory`: Retenção de peso resolutivo.
- `directionalMemory`: Retenção do vetor de tensão.
Isso permite ao usuário escolher o nível de exploração: **Conservadora, Moderada ou Radical**.

### 3.4 Harmonic Goal Engine (A Tradução Composicional)
*O elo entre desejo e restrição vetorial.* O compositor não trabalha apenas com "adjetivos" (mais tensão), mas com **objetivos** composicionais concretos:
- *Objetivo 1:* "Quero evitar que pareça uma resolução final."
- *Objetivo 2:* "Quero preparar uma modulação."
- *Objetivo 3:* "Quero aumentar a energia sem mudar a melodia."

### 3.5 Harmonic Constraint Engine (A Filtração Fina)
*O elo limitador.* Mesmo com um objetivo claro, o compositor possui restrições práticas intransponíveis para aquela frase:
- `Não alterar o baixo`
- `Limitar cromatismo`
- `Manter centro tonal original`
- `Evitar extensões complexas`
Este motor traduz restrições de "vida real" em filtros absolutos que vão barrar caminhos no Possibility Engine antes mesmo deles serem avaliados.

### 3.6 Harmonic Region Engine (A Unidade de Pensamento)
O compositor não pensa em acordes soltos, ele pensa em trechos. O sistema agrupará a frase em blocos funcionais (Regiões).
- **Região de Estabelecimento** (`C -> Am -> F`)
- **Região Predominante** (`Dm -> F`)
- **Região Dominante** (`G7 -> G7sus -> G13`)
- **Região Cadencial** (`ii -> V -> I`)
A substituição passará a ocorrer no nível da **Região**, não do acorde.

### 3.7 Harmonic Compatibility Engine
Valida a compatibilidade entre a melodia soberana (respeitando as `MelodicAnchors`) e a harmonia subjacente. Detecta atritos estruturais severos e pontua a tensão geral.

### 3.8 Harmonic Possibility Engine (As Rotas)
O motor atende aos objetivos (Goals) e respeita as restrições (Constraints), gerando **Rotas Harmônicas** (Caminhos). Em vez de "Sugestão 1", o sistema oferece "Rota de Deslocamento Tonal".

### 3.9 Exploration Delta (O Quão Diferente Ficou?)
Junto a cada rota, o sistema calcula um `Delta` (0 a 100) que quantifica a audácia da rearmonização:
- `Delta: 18` (Pequena variação, ex: adição de nonas).
- `Delta: 47` (Reinterpretação moderada, ex: substituição diatônica).
- `Delta: 83` (Releitura radical, ex: mudança de centro tonal e polo funcional).
Isso permite navegação visual rápida sem precisar ler as cifras.

### 3.10 Opportunity Engine (A Curadoria)
Se o sistema encontra 12 rotas, qual delas o compositor deveria olhar primeiro? Este motor mede a utilidade criativa da rota através de 4 eixos:
- `novelty`: O quão distante a rota está da solução original.
- `structuralImpact`: Quanto a percepção global da região muda.
- `melodicRisk`: Sensibilidade de atrito com a melodia.
- `reversibility`: O quão fácil é desfazer a mudança (ex: adicionar nonas é mais reversível do que mudar de tom).
O sistema deixa de jogar uma lista na tela e passa a classificar as rotas (ex: "Rota A - Baixo Risco, Alto Retorno").

### 3.11 Why Not? Engine (Explicabilidade Negativa)
Tão importante quanto saber *por que* algo foi sugerido, é saber *por que* algo foi descartado. Este motor fornece o racional de exclusão:
- *Não foi sugerido:* `C -> F -> G -> C`
- *Motivo:* "Produz uma cadência autêntica forte, contrariando o objetivo escolhido de 'evitar resolução'."

### 3.12 Why This? Engine (Explicabilidade Positiva)
O simétrico natural do *Why Not*. Explica de forma pragmática e amigável o que a rota selecionada realmente realiza:
- *Preservado:* Direção dominante.
- *Alterado:* Centro tonal percebido.
- *Resultado:* Maior ambiguidade antes da resolução.

### 3.13 Distance Metrics (Original vs Parent)
O `ExplorationDelta` mede a audácia absoluta. Porém, dentro de um grafo de exploração, a distância precisa ser contextualizada:
- **DistanceFromOriginal:** O quão longe a rota atual está da partitura raiz.
- **DistanceFromParent:** O quão longe a rota atual está da rota imediatamente anterior (útil ao gerar variações sucessivas de uma rota já alterada).

### 3.14 Exploration State Engine
A exploração na UI não será um processo linear ou "fogo-e-esquece", mas sim a navegação de um espaço de possibilidades. O sistema estrutura isso através de um **Grafo de Exploração (`ExplorationGraph`)**:
- O usuário gera `Rota A` e `Rota B`.
- Aceita a `Rota B`.
- Pede variações: nascem `B1`, `B2`.
- Volta para testar a `Rota A`.
O estado deixa de ser apenas uma lista de cifras e se consolida em nós (`ExplorationNode`), permitindo viagens entre realidades harmônicas sem perder o contexto de decisões passadas.

## 4. Histórico de Exploração e Sessão Iterativa
A composição é iterativa. O sistema rastreia as rotas aceitas e rejeitadas pelo usuário em uma `ExplorationSession` ligada ao `ExplorationGraph`. Sem "IA mágica", apenas memória de decisão. Se o usuário rejeitou 3 rotas cromáticas seguidas, o sistema ajusta a prioridade para rotas mais diatônicas ou estruturais.

## 5. Exploração Formal (F13-A3: Section Reharmonization)
Quando houver repetições formais (`A` e `A'`), o sistema analisa se a segunda ocorrência admite interpretação harmônica diferente mantendo a melodia intacta.
- Exemplo A: `C → Am → G7`
- Exemplo A': `Cmaj7 → Am9 → G13`

## 6. Redesenho da UI (ScoreAnalysisDashboard)
A UI foi fragmentada em três universos paralelos (Modos) para limpar a carga cognitiva:

### Modo 1: Composer Mode (O que essa frase pode ser?)
A interface de criação.
1. **Controles Independentes:**
   - **Exploração:** Baixa → Alta (O quanto inovar).
   - **Memória:** Baixa → Alta (O quanto respeitar o passado).
   *Isso permite (Exploração Alta + Memória Alta) para grandes rearmonizações estruturais que retêm a intenção, ou (Exploração Alta + Memória Baixa) para reinterpretações dramáticas totais.*
2. **Restrições Práticas (Constraints):** `[ ] Manter baixo  [ ] S/ empréstimos`
3. **Objetivo:** `[x] Quero evitar resolução final`
4. **Gerar Rotas Harmônicas:**
   - *Exibe as Rotas (ex: "Rota de Deslocamento Tonal") avaliadas pelo Opportunity Engine.*
   - *Inclui a aba "Why Not?" explicando os caminhos vetados.*

### Modo 2: Analysis Mode (O que essa frase está fazendo?)
Para estudo de obra existente.
1. **Narrativa Harmônica**
2. **Curva Dramática Visual**
3. **Estrutura Formal**

### Modo 3: Research / Developer Mode (Auditoria e Telemetria)
Escondido por padrão, para pesquisadores.
1. **Auditoria / Linter:** Caça às quintas e oitavas paralelas.
2. **Métricas Brutais:** ADI, ISS, CFS, Lakatos, Torneios Epistêmicos.

## 7. O Fluxo de Decisão (Resumo)
O sistema deixa de ser um analisador passivo e passa a operar o seguinte fluxo lógico cognitivo:
1. *O que esta frase está fazendo?* (Phrase Function / Region)
2. *O que eu quero que ela faça, e o que não pode mudar?* (Harmonic Goal / Constraint Engine / Phrase Memory)
3. *Quais rotas existem e quais são mais promissoras?* (Possibility Engine / Opportunity Engine)
4. *Por que algumas rotas foram descartadas?* (Why Not Engine)
