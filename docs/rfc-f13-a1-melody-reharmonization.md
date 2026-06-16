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
Antes de sugerir alternativas, o sistema precisa entender a intenção: `Estabelecimento -> Prolongamento -> Dominante`. Isso garante que a rearmonização preserve o papel dramático.

### 3.3 Harmonic Region Engine (A Unidade de Pensamento)
O compositor não pensa em acordes soltos, ele pensa em trechos. O sistema agrupará a frase em blocos funcionais (Regiões).
- **Região de Estabelecimento** (`C -> Am -> F`)
- **Região Predominante** (`Dm -> F`)
- **Região Dominante** (`G7 -> G7sus -> G13`)
- **Região Cadencial** (`ii -> V -> I`)
A substituição passará a ocorrer no nível da **Região**, não do acorde.

### 3.4 Harmonic Compatibility Engine
Valida a compatibilidade entre a melodia soberana e a harmonia subjacente. Detecta atritos estruturais severos e pontua a tensão geral.

### 3.5 Harmonic Possibility Engine
O novo motor principal. Ele consome a `MelodicPhrase`, a harmonia original e o contexto tonal para produzir leituras alternativas da mesma frase sob intenções puramente estruturais:
- **Mais Estável:** Reforça o centro tonal.
- **Mais Tenso:** Aumenta direcionamento e expectativa cadencial.
- **Mais Cromático:** Introduz deslocamentos externos ao campo principal.
- **Mais Modal:** Explora regiões e empréstimos modais relacionados.
- **Mais Ambíguo:** Reduz a percepção clara do centro tonal.
- **Mais Expansivo:** Amplia densidade funcional (tensões/extensões) sem alterar a identidade base.
- **Mais Econômico:** Simplifica o movimento harmônico (redução).
- **Reinterpretação Funcional:** *Nova categoria.* Mesma melodia, mas habitando outro universo funcional. Ex: `C → Am → G7` vira `Em → A7 → D`. Transforma radicalmente a percepção sem quebrar a restrição física.

## 4. Exploração Formal (F13-A3: Section Reharmonization)
Quando houver repetições formais (`A` e `A'`), o sistema analisa se a segunda ocorrência admite interpretação harmônica diferente mantendo a melodia intacta.
- Exemplo A: `C → Am → G7`
- Exemplo A': `Cmaj7 → Am9 → G13`

## 5. Redesenho da UI (ScoreAnalysisDashboard)
A UI passa a focar no fluxo criativo e empurra ferramentas de "inspeção dura" para segundo plano.

### Núcleo Principal (Foco Invertido - Ação antes de Explicação)
1. **Explorar Alternativas:** O coração absoluto da aba. "Mostre-me algo útil antes de me explicar".
2. **Narrativa Harmônica:** Curta, direta ("Estabelece o centro tonal"). Serve para justificar a sugestão, não para antecedê-la.
3. **Curva Dramática:** Secundária. Gráfico simplificado. Continua sendo *observação*, perdendo o destaque.

### Modo Avançado / Acadêmico (Oculto por Padrão)
1. **Estrutura Formal:** (Ex: "Período Autêntico").
2. **Auditoria / Linter:** Caça às quintas e oitavas paralelas.
3. **Métricas Acadêmicas e Epistêmicas.**

## 6. Critérios de Sucesso e Explicabilidade
1. **Frase simples:** O sistema produz múltiplas leituras harmônicas (Expansivas, Cromáticas, etc.) perfeitamente compatíveis com a melodia.
2. **Explicabilidade baseada em Intenção:** Todas as alternativas justificam suas trocas sob o seguinte formato composicional:
   - *O que foi preservado* (ex: "direção para um ponto de resolução")
   - *O que foi alterado* (ex: "centro tonal percebido")
   - *Efeito produzido* (ex: "sensação de deslocamento e expansão")
3. **Material repetido:** O sistema propõe de forma orgânica alternativas texturais para reapresentações (A').
4. **Restrição Física:** Nenhuma sugestão entra em conflito com a melodia estrutural analisada.
