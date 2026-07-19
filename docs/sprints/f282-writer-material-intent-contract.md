# F282 - Contrato de intencao da paleta

## Objetivo

Evitar que a classificacao de rotas dependa de strings soltas nos cards de `Materiais do acorde`.

## Alteracoes

- Criado `WriterMaterialIntentLabel` para os rotulos de intencao da paleta.
- `WriterMaterialPaletteItem.intentLabel` passa a usar esse contrato.
- `routeForWriterMaterialItem` passa a usar um mapa tipado entre intencao e rota.

## Resultado

Mudancas futuras nos materiais ficam mais seguras: se um novo rotulo de intencao aparecer, o TypeScript obriga a decidir em qual rota ele entra.
