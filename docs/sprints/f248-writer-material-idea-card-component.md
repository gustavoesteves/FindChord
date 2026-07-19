# F248 - Componente de card de ideia musical

## Objetivo

Reduzir o peso visual e estrutural de `ScaleOverlayPanel`.

## Alteracoes

- Criado `WriterMaterialIdeaCard`.
- O card concentra renderizacao de acao, titulo, dica, celulas, estado ativo e fonte do mapa.
- `ScaleOverlayPanel` passa a renderizar a lista de ideias com um componente dedicado.

## Resultado

A tela fica mais facil de manter e preparada para novos refinamentos nos cards sem mexer na orquestracao geral dos materiais.
