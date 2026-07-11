# F134 - Ranking melodico das leituras por acorde

## Problema

A F133 priorizou `linearRoutes` apoiadas pela melodia, mas a escolha da leitura
principal por acorde ainda dependia apenas do score contextual anterior.

Isso deixava um caso importante sem tratamento: quando uma escala tem uma
passagem idiomatica que explica uma nota real da melodia, essa leitura deve
ganhar prioridade moderada.

## Decisao

Cada `ContextualScaleCandidate` passa a expor `melodicFit`:

- `aligned`: a leitura conversa diretamente com a melodia;
- `neutral`: a leitura nao conflita, mas tambem nao ganha apoio claro;
- `caution`: a melodia sugere cuidado, por baixa cobertura ou nota de evitar.

O `rankingEvidence` tambem registra `melodicFitAdjustment`, para manter a
decisao auditavel.

## Efeito musical

Em `G7 -> C`, se a melodia traz `F#`, a `bebop dominant` pode subir porque
interpreta `F#` como passagem cromatica:

```text
F-F#-G
```

A ideia nao e transformar a passagem em tensao sustentavel, mas reconhecer que a
melodia ja esta usando esse vocabulario linear.

## Limite

O ajuste e deliberadamente pequeno. A compatibilidade harmonica, a funcao e a
cobertura da melodia continuam sendo a base do ranking.

## Proximo passo

O proximo refinamento pode expor `melodicFit` tambem no detalhe de cada leitura
por acorde, nao apenas nas rotas lineares agregadas.
