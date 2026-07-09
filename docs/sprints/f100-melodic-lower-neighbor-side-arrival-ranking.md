# F100 - Chegada lateral cromatica com suporte melodico no ranking

## Contexto

A F99 mostrou que 4 dos 8 casos ainda `unresolved` envolvem chegada um semitom abaixo do alvo esperado da dominante.

Esse padrao nao deve virar resolucao funcional automatica. Em alguns casos, a melodia sustenta a propria dominante; em outros, sustenta a chegada lateral.

## Decisao

Adicionar uma regra conservadora apenas no ranking de propostas, onde existe acesso a `MelodicAnchor`.

A regra so entra quando:

- a dominante alterada continua `unresolved` no analisador harmonico;
- o primeiro acorde seguinte esta um semitom abaixo do alvo esperado;
- a melodia do compasso da dominante cobre pelo menos 60% das notas do acorde de chegada lateral;
- a melodia nao cobre a raiz do alvo funcional esperado.

## Efeito

A penalidade da dominante alterada nao desaparece. Ela e reduzida para uma penalidade pequena.

Isso evita tratar a chegada lateral como resolucao forte, mas tambem evita punir demais um gesto cromatico que a propria melodia esta sustentando.

## Exemplo

`G7alt -> Bmaj7`, no contexto de alvo esperado `C`, segue sendo harmonizacao arriscada.

Se a melodia no compasso da dominante contem `D#` e `F#`, a chegada lateral em `Bmaj7` ganha suporte melodico e a penalidade e suavizada.

## Limite

A regra nao altera `DominantResolutionAnalysis`, porque esse analisador nao conhece a melodia.

A leitura permanece dependente do ranking, onde ha acesso aos anchors melodicos.
