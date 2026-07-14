# F148 - Cromatismo de vizinhanca

## Objetivo

Atacar o exemplo `k` do Almada, que ainda estava apenas parcialmente contemplado.

O alvo teorico-pratico e uma familia de cromatismo denso, mas legivel:

`C -> Cº -> C -> C#º -> F -> Eb7 -> Dm7(b5) -> Ab7M -> Db7 -> Db7M -> C7M`

## Problema

O motor ja tinha diminutos, SubV, mistura modal densa e chegada deceptiva, mas o exemplo `k` combina esses recursos em outro desenho:

- vizinhanca diminuta ao redor da tonica;
- abertura para subdominante;
- regiao cromatica por bIII7, iiø e bVImaj7;
- fechamento pela regiao napolitana bII7/bIImaj7 antes de voltar a Imaj7.

Sem uma familia propria, a auditoria aproximava o exemplo por `SubV funcional`, que capturava parte do vocabulario, mas nao o gesto formal.

## Alteracao

Foi adicionada a proposta:

`Estratégia — Cromatismo de vizinhança`

Em tom maior, a regra intervalar e:

`I -> Iº -> I -> bIIº -> IV -> bIII7 -> iiø -> bVImaj7 -> bII7 -> bIImaj7 -> Imaj7`

No exemplo em C:

`C -> Cdim7 -> C -> Dbdim7 -> F -> Eb7 -> Dm7b5 -> Abmaj7 -> Db7 -> Dbmaj7 -> Cmaj7`

O ranker pode sugerir inversoes para suavizar a linha de baixo:

`F/C`, `Eb7/Db`, `Abmaj7/Eb`.

## Resultado no Almada

`docs/reports/f79-almada-example-comparison.md` foi atualizado:

- Propostas geradas: 18
- Exemplos cobertos: 6
- Familias parcialmente contempladas: 6
- Lacunas praticas de vocabulario: 0

O exemplo `k` passou a ser coberto:

- 82% de sobreposicao de cifras;
- 100% de recursos harmonicos;
- 90% de afinidade geral.

## Observacao

A grafia `Dbdim7` foi preferida pelo motor por coerencia com a regiao `bII`. A referencia do Almada usa `C#º`; nesta familia, elas funcionam como leituras enharmonicas do mesmo vizinho cromatico.

## Proximo refinamento

O vocabulario do exemplo Almada esta bem mais coberto. O proximo passo deve ser menos "adicionar familias" e mais "calibrar experiencia":

- quantas propostas progressivas devem aparecer ao mesmo tempo;
- como agrupar variantes cromaticas proximas;
- como explicar cromatismo denso sem poluir o card;
- quando a UI deve destacar fundamento, leitura da obra e rearmonizacoes progressivas.
