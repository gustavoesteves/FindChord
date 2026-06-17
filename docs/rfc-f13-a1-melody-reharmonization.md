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

### 3.3 Harmonic Intent Engine (A Intenção Oculta)
Mesmos acordes podem ter propósitos diferentes. Este motor infere o que a frase original tenta realizar.

### 3.4 Harmonic Goal Engine (A Tradução Composicional)
*O elo entre desejo e restrição matemática.* O compositor não trabalha apenas com "adjetivos" (mais tensão), mas com **objetivos** composicionais concretos:
- *Objetivo 1:* "Quero evitar que pareça uma resolução final." -> Restrição: Evitar cadência autêntica, favorecer prolongamentos ou cadência enganosa.
- *Objetivo 2:* "Quero preparar uma modulação."
- *Objetivo 3:* "Quero aumentar a energia sem mudar a melodia."
O motor transforma esses verbos/objetivos nas restrições vetoriais (adição de cromatismo, alteração de polo) que guiarão as substituições.

### 3.5 Harmonic Region Engine (A Unidade de Pensamento)
O compositor não pensa em acordes soltos, ele pensa em trechos. O sistema agrupará a frase em blocos funcionais (Regiões).
- **Região de Estabelecimento** (`C -> Am -> F`)
- **Região Predominante** (`Dm -> F`)
- **Região Dominante** (`G7 -> G7sus -> G13`)
- **Região Cadencial** (`ii -> V -> I`)
A substituição passará a ocorrer no nível da **Região**, não do acorde.

### 3.6 Harmonic Compatibility Engine
Valida a compatibilidade entre a melodia soberana e a harmonia subjacente. Detecta atritos estruturais severos e pontua a tensão geral.

### 3.7 Harmonic Possibility Engine
O novo motor principal. Ele consome a `MelodicPhrase`, a harmonia original, as Regiões e o `HarmonicGoal` para gerar leituras alternativas da frase (como Reinterpretação Funcional ou Expansão). O motor atende aos objetivos definidos no passo anterior.

## 4. Exploração Formal (F13-A3: Section Reharmonization)
Quando houver repetições formais (`A` e `A'`), o sistema analisa se a segunda ocorrência admite interpretação harmônica diferente mantendo a melodia intacta.
- Exemplo A: `C → Am → G7`
- Exemplo A': `Cmaj7 → Am9 → G13`

## 5. Redesenho da UI (ScoreAnalysisDashboard)
A UI foi fragmentada em três universos paralelos (Modos) para limpar a carga cognitiva e alinhar-se à expectativa do usuário:

### Modo 1: Composer Mode (Ação: "O que essa frase pode ser?")
A interface de criação.
1. **Painel de Objetivos (Goal Selection):**
   - `[ ] Quero evitar resolução final`
   - `[ ] Quero aumentar a energia direcional`
   - `[ ] Quero desestabilizar o centro tonal`
   - `[ ] Quero preparar modulação`
2. **Explorar Alternativas:** O resultado. "Aqui estão 3 caminhos." (Explicando o que foi preservado e alterado).

### Modo 2: Analyst Mode (Observação: "O que essa frase está fazendo?")
Para estudo de obra.
1. **Narrativa Harmônica:** "Estabelece o centro tonal e cria expectativa de resolução."
2. **Curva Dramática Visual:** Gráficos simplificados de flutuação de tensão.
3. **Estrutura Formal:** Divisão em Frases e Períodos (Autêntico, etc.).

### Modo 3: Academic / Developer Mode (Telemetria e Linter)
Escondido por padrão, para os cientistas e nerds de teoria.
1. **Auditoria / Linter:** Caça às quintas e oitavas paralelas.
2. **Métricas Brutais:** ADI, ISS, CFS, Estabilidade Interpretativa.
3. **Conflitos Epistêmicos:** Torneios das IAs metateóricas, Lakatos.

## 6. Critérios de Sucesso e Explicabilidade
1. **Frase simples:** O sistema produz múltiplas leituras harmônicas (Expansivas, Cromáticas, etc.) perfeitamente compatíveis com a melodia.
2. **Explicabilidade baseada em Intenção:** Todas as alternativas justificam suas trocas sob o seguinte formato composicional:
   - *O que foi preservado* (ex: "direção para um ponto de resolução")
   - *O que foi alterado* (ex: "centro tonal percebido")
   - *Efeito produzido* (ex: "sensação de deslocamento e expansão")
3. **Material repetido:** O sistema propõe de forma orgânica alternativas texturais para reapresentações (A').
4. **Restrição Física:** Nenhuma sugestão entra em conflito com a melodia estrutural analisada.
