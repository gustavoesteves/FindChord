# F287 - Presenter de rota por intencao

## Objetivo

Tornar testavel o mapeamento entre intencao musical e rota em `Materiais do acorde`.

## Alteracoes

- `routeForWriterMaterialIntent` passa a ser exportado.
- `routeForWriterMaterialItem` delega para esse presenter.
- Teste cobre todas as intencoes: dentro, funcional, cor, tensao e fora.

## Resultado

A decisao de rota fica explicita e protegida por teste, sem depender apenas da montagem completa de um card.
