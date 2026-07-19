# F254 - Header e estados vazios dos materiais

## Objetivo

Reduzir o ruido visual restante em `ScaleOverlayPanel`.

## Alteracoes

- Criado `WriterMaterialPanelHeader`.
- Criados `WriterMaterialNoChordState` e `WriterMaterialNoMaterialsState`.
- O painel principal passa a renderizar esses estados por componentes dedicados.

## Resultado

Mensagens de estado e cabecalho deixam de competir com a orquestracao da tela. `ScaleOverlayPanel` fica mais focado em conectar store, modelo e blocos visuais.
