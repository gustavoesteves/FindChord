# F143 - Cadeia SubV no caminho progressivo

## Objetivo

Refinar o caminho progressivo do Harmonizar usando o exemplo de rearmonizacao do Almada como lente, especialmente a familia de substituicoes por tritono.

## Problema

O motor ja gerava `SubV funcional`, mas pulava a preparacao cromatica de `G7` quando ela vinha depois de `Bm7b5`. A regra bloqueava qualquer acorde anterior contendo `7`, tratando `Bm7b5` como se fosse uma dominante anterior.

Musicalmente isso impedia a cadeia:

- `Gb7 -> F`
- `Ab7 -> G7`
- `Db7 -> C`

## Alteracao

O bloqueio agora considera apenas dominante anterior real, via `analyzeDominantTension`, em vez de qualquer cifra que contenha `7`.

Com isso, o motor pode inserir `Ab7` antes de `G7` quando o trecho sustenta a leitura por SubV.

## Resultado no Almada

`docs/reports/f79-almada-example-comparison.md` foi atualizado:

- Propostas geradas: 14
- Exemplos cobertos: 2
- Familias parcialmente contempladas: 9
- Lacunas praticas: 1

A familia `h` passou a reconhecer `Estratégia — SubV funcional` como melhor proposta parcial, com `Gb7/Bb`, `Ab7/C` e `Db7`.

## Observacao

Essa proposta agora aparece como `adventurous`, o que e adequado: ela pertence ao caminho progressivo, nao ao fundamento harmonico.

## Proximo refinamento

Atacar a lacuna restante do exemplo `m`: deslocamento tonal e chegada deceptiva. Esse caso exige movimento por mediantes, cromatismo direcional e chegada fora do repouso esperado, com controle melodico mais forte.
