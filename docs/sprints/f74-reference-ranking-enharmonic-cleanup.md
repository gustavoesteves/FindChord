# F74 - Ranking funcional e limpeza enarmonica

## Objetivo

Resolver o refinamento que apareceu depois da F73: `After you` estava funcionalmente correto, mas a proposta exibia `Bdim7/Cb`.

Ao limpar a grafia, surgiu outro problema: o ranking passou a preferir uma proposta com mesma raiz da referencia, mas funcao divergente. A correcao desta sprint foi tratar alinhamento funcional com a referencia como criterio forte de ranking.

## Mudancas

- O realizador de acordes compara baixo e raiz por classe cromatica, nao por string literal.
- Baixos como `Cb` sao simplificados antes da montagem da cifra.
- Se o baixo sugerido e enarmonico da raiz, o slash e omitido.
- Propostas alinhadas funcionalmente com a harmonia de referencia recebem bonus de ranking.

## Caso calibrado

`a-010-After you.musicxml`

Antes:

- `Bb6 / Bdim7/Cb / C7 / F7`

Depois:

- `Bb6 / Bdim7 / C7 / F7`

## Resultado no lote F72

- Base aprovada: 5
- Revisao musical: 1
- Trabalho de motor: 0

## Proxima atencao

O corpus amplo ainda tem grafias enarmonicas duras em propostas cromaticas, como baixos `B#`, `F##`, `Gb` ou diminutos com slash pouco idiomatico. Essas grafias devem virar um passe proprio de apresentacao de cifras, sem alterar a funcao harmonica ja validada.
