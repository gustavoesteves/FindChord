# F146 - Mistura modal densa

## Objetivo

Separar mistura modal densa de simples cor cromatica isolada.

O alvo foi o exemplo `j` do Almada, que combina emprestimo modal, mediantes e retorno funcional:

`Ab7M -> C7M -> F#m7(b5) -> Fm7 -> Em7 -> G7 -> C7M`

## Problema

Antes desta sprint, a auditoria reconhecia essa familia apenas como alvo futuro. O motor ate tinha cores modais pontuais (`bVI`, `bVII`, `iv`) e rotas cromaticas, mas nao tinha uma proposta que tratasse a mistura modal como percurso dirigido.

Isso fazia o exemplo `j` ser comparado com alternativas genericas, como contraponto de baixo.

## Alteracao

Foi adicionada a proposta:

`Estratégia — Mistura modal densa`

Em tom maior, a regra e intervalar:

`bVImaj7 -> Imaj7 -> #IVø -> ivm7 -> iii7 -> V7 -> Imaj7`

No exemplo em C:

`Abmaj7 -> Cmaj7 -> F#m7b5 -> Fm7 -> Em7 -> G7 -> Cmaj7`

O ranker ainda pode sugerir inversoes para conduzir melhor o baixo, por exemplo:

`Abmaj7 -> Cmaj7/G -> F#m7b5 -> Fm7 -> Em7 -> G7/F -> Cmaj7`

## Criterios

- so entra em modo maior;
- exige frase de quatro compassos;
- exige cobertura melodica alta;
- exige chegada final sustentada por `Imaj7`;
- fica no caminho progressivo, porque usa cromatismo denso e mediantes.

## Resultado no Almada

`docs/reports/f79-almada-example-comparison.md` foi atualizado:

- Propostas geradas: 17
- Exemplos cobertos: 5
- Familias parcialmente contempladas: 7
- Lacunas praticas de vocabulario: 0

O exemplo `j` passou a ser coberto com 100% de sobreposicao de cifras, recursos e afinidade.

## Proximo refinamento

As proximas lacunas ja nao sao de vocabulario isolado. O foco deve ser graduar densidade e risco:

- quando uma rota cromatica densa deve ser alternativa exploratoria;
- quando a referencia do autor deve autorizar maior densidade;
- quando mediantes funcionam como regiao momentanea;
- como explicar esses caminhos em linguagem de compositor, sem expor metrica interna.
