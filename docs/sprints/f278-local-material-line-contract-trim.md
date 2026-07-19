# F278 - Enxugamento das linhas sugeridas

## Objetivo

Remover metadado sem uso das linhas sugeridas em `Materiais do acorde`.

## Alteracoes

- `LocalMaterialSuggestedLine` deixa de expor `school`.
- As linhas sugeridas mantem apenas nome, descricao teorica e intervalos.
- Fixtures de teste foram atualizados para o contrato menor.

## Resultado

As linhas sugeridas ficam mais alinhadas ao que a UI realmente usa: uma ideia tocavel, sua intencao e sua sequencia de notas.
