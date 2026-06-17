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

## 3. A Nova Arquitetura de Motores (F13)

### 3.2 Phrase Function Engine
Antes de sugerir alternativas, o sistema precisa entender a função estrutural: `Estabelecimento -> Prolongamento -> Dominante`.

### 3.3 Phrase Memory Engine (O Fio Condutor)
O compositor raramente quer apagar o passado; ele quer rearmonizar mantendo resquícios da intenção original. Este motor mede:
- `tonalMemory`: Grau de retenção do centro original.
- `cadentialMemory`: Retenção de peso resolutivo.
- `directionalMemory`: Retenção do vetor de tensão.
Isso permite ao usuário escolher o nível de exploração: **Conservadora, Moderada ou Radical**.

### 3.4 Harmonic Intent Engine (A Intenção Oculta)
Mesmos acordes podem ter propósitos diferentes. Este motor infere o que a frase original tenta realizar.

### 3.5 Harmonic Goal Engine (A Tradução Composicional)
*O elo entre desejo e restrição matemática.* O compositor não trabalha apenas com "adjetivos" (mais tensão), mas com **objetivos** composicionais concretos:
- *Objetivo 1:* "Quero evitar que pareça uma resolução final." -> Restrição: Evitar cadência autêntica, favorecer prolongamentos ou cadência enganosa.
- *Objetivo 2:* "Quero preparar uma modulação."
- *Objetivo 3:* "Quero aumentar a energia sem mudar a melodia."
O motor transforma esses verbos/objetivos nas restrições vetoriais (adição de cromatismo, alteração de polo) que guiarão as substituições.

### 3.6 Harmonic Region Engine (A Unidade de Pensamento)
O compositor não pensa em acordes soltos, ele pensa em trechos. O sistema agrupará a frase em blocos funcionais (Regiões).
- **Região de Estabelecimento** (`C -> Am -> F`)
- **Região Predominante** (`Dm -> F`)
- **Região Dominante** (`G7 -> G7sus -> G13`)
- **Região Cadencial** (`ii -> V -> I`)
A substituição passará a ocorrer no nível da **Região**, não do acorde.

### 3.7 Harmonic Compatibility Engine
Valida a compatibilidade entre a melodia soberana e a harmonia subjacente. Detecta atritos estruturais severos e pontua a tensão geral.

### 3.8 Harmonic Possibility Engine (As Rotas)
O motor atende aos objetivos definidos gerando **Rotas Harmônicas** (Caminhos) e não apenas opções avulsas. Em vez de "Sugestão 1", o sistema oferece "Rota de Deslocamento Tonal".

### 3.9 Why Not? Engine (Explicabilidade Negativa)
Tão importante quanto saber *por que* algo foi sugerido, é saber *por que* algo foi descartado. Este motor fornece o racional de exclusão:
- *Não foi sugerido:* `C -> F -> G -> C`
- *Motivo:* "Produz uma cadência autêntica forte, contrariando o objetivo escolhido de 'evitar resolução'."

## 4. Exploração Formal (F13-A3: Section Reharmonization)
Quando houver repetições formais (`A` e `A'`), o sistema analisa se a segunda ocorrência admite interpretação harmônica diferente mantendo a melodia intacta.
- Exemplo A: `C → Am → G7`
- Exemplo A': `Cmaj7 → Am9 → G13`

## 5. Redesenho da UI (ScoreAnalysisDashboard)
A UI foi fragmentada em três universos paralelos (Modos) para limpar a carga cognitiva:

### Modo 1: Composer Mode (O que essa frase pode ser?)
A interface de criação.
1. **Intensidade:** `[ ] Conservadora  [ ] Moderada  [ ] Radical`
2. **Objetivo:** `[x] Quero evitar resolução final`
3. **Gerar Rotas Harmônicas:**
   - *Exibe as Rotas (ex: "Rota de Deslocamento Tonal") mostrando o que foi preservado, o que foi alterado e o resultado.*
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

## 6. O Fluxo de Decisão (Resumo)
O sistema deixa de ser um analisador passivo e passa a operar o seguinte fluxo lógico cognitivo:
1. *O que esta frase está fazendo?*
2. *O que eu quero que ela faça?*
3. *Quais rotas existem?*
4. *Por que algumas rotas foram descartadas?*
