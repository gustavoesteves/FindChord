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

### 3.1 Melody Extraction Engine
Responsável por conectar-se à partitura, extrair a linha principal (lead), identificar notas estruturais vs. notas de passagem, e gerar objetos `MelodicPhrase`.

### 3.2 Harmonic Compatibility Engine
Valida a compatibilidade entre a melodia soberana e a harmonia subjacente. Detecta atritos estruturais severos (ex: b9 contra a melodia) e pontua a tensão/consonância geral.

### 3.3 Harmonic Possibility Engine
O novo motor principal. Ele consome a `MelodicPhrase`, a harmonia original e o contexto tonal para produzir leituras alternativas da mesma frase sob intenções puramente estruturais:
- **Mais Estável:** Reforça o centro tonal.
- **Mais Tenso:** Aumenta direcionamento e expectativa cadencial.
- **Mais Cromático:** Introduz deslocamentos externos ao campo principal.
- **Mais Modal:** Explora regiões e empréstimos modais relacionados.
- **Mais Ambíguo:** Reduz a percepção clara do centro tonal.
- **Mais Expansivo:** Amplia densidade funcional (tensões/extensões) sem alterar a identidade base.
- **Mais Econômico:** Simplifica o movimento harmônico (redução).

## 4. Exploração Formal (Section Reharmonization)
Quando houver repetições formais (`A` e `A'`), o sistema analisa se a segunda ocorrência admite interpretação harmônica diferente mantendo a melodia intacta.
- Exemplo A: `C → Am → G7`
- Exemplo A': `Cmaj7 → Am9 → G13`

## 5. Redesenho da UI (ScoreAnalysisDashboard)
A UI passa a focar no fluxo criativo e empurra ferramentas de "inspeção dura" para segundo plano.

### Núcleo Principal (Foco)
1. **Narrativa Harmônica:** Curta, direta ("Estabelece o centro tonal").
2. **Curva Dramática:** Substitui o antigo mapa de tensão matemático ("Compasso 3: Pico dramático da frase").
3. **Possibilidades Harmônicas:** O coração da aba, oferecendo as rotas do *Harmonic Possibility Engine*.

### Modo Avançado / Acadêmico (Oculto por Padrão)
1. **Estrutura Formal:** (Ex: "Período Autêntico").
2. **Auditoria / Linter:** Caça às quintas e oitavas paralelas.
3. **Métricas Acadêmicas e Epistêmicas.**

## 6. Critérios de Sucesso
1. **Frase simples:** O sistema produz múltiplas leituras harmônicas (Expansivas, Cromáticas, etc.) perfeitamente compatíveis com a melodia.
2. **Material repetido:** O sistema propõe de forma orgânica alternativas texturais para reapresentações (A').
3. **Restrição Física:** Nenhuma sugestão entra em conflito grave com a melodia estrutural analisada.
4. **Explicabilidade:** Todas as alternativas informam não apenas os novos acordes, mas *o que muda, por que muda, e qual efeito harmônico isso produz*.
