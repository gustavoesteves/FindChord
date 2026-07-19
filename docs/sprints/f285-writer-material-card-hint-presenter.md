# F285 - Dica curta como apresentacao do card

## Objetivo

Remover `shortHint` do contrato da paleta em `Materiais do acorde`.

## Alteracoes

- `WriterMaterialPaletteItem` deixa de armazenar a dica curta derivada.
- `shortHintForWriterMaterialCard` passa a ser uma funcao exportada de apresentacao.
- `WriterMaterialIdeaCard` deriva a dica curta a partir de `item.subtitle`.
- Fixtures e testes foram atualizados para o contrato menor.

## Resultado

A paleta carrega o conteudo musical completo, enquanto o card decide como resumir esse conteudo visualmente.
