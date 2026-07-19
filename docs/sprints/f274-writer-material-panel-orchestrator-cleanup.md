# F274 - Limpeza do orquestrador de Materiais do acorde

## Objetivo

Simplificar `ScaleOverlayPanel` depois das extracoes de componentes e services.

## Alteracoes

- Removida a variavel intermediaria `sharedContent`.
- Removidos comentarios herdados que ja nao explicavam uma decisao relevante.
- `labelMode` passa a usar `LocalMaterialFretboardLabelMode`.

## Resultado

O orquestrador fica mais direto e alinhado aos contratos extraidos do painel de materiais.
