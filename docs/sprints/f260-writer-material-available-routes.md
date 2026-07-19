# F260 - Rotas disponiveis em Materiais do acorde

## Objetivo

Evitar que uma rota sem material real pareca clicavel em `Materiais do acorde`.

## Alteracoes

- Adicionado filtro de rotas visiveis com conteudo.
- O navegador de rotas passa a renderizar apenas rotas disponiveis para o acorde atual.
- Testes cobrem a filtragem e a preservacao da ordem musical das rotas.

## Resultado

`Tensionar` deixa de aparecer quando nao ha material de tensao para o acorde, evitando a sensacao de botao quebrado.
