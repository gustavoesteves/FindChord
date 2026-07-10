# F112 - Agrupamento de rotas locais repetidas

## Objetivo

Evitar que janelas locais vizinhas apresentem a mesma sequencia de cifras em
cards independentes.

## Regra

Rotas locais com a mesma sequencia normalizada e o mesmo centro sao reunidas em
um card. Cada ocorrencia conserva seu proprio trecho e sua propria acao de
aplicacao.

## Resultado esperado

O musico ve uma ideia local uma vez e pode escolher em qual dos locais
encontrados deseja aplica-la. Mudancas de centro, sequencia, inversao ou
densidade continuam separadas.
