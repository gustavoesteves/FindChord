# F251 - Componente do mapa no braco

## Objetivo

Separar o painel instrumental de Materiais do acorde do componente principal.

## Alteracoes

- Criado `WriterMaterialFretboardPanel`.
- O componente concentra titulo do mapa, alternancia `Posicao/Notas`, filtros de categorias e renderizacao do braco.
- `ScaleOverlayPanel` passa apenas fonte ativa, acorde, afinacao, estado dos filtros e handlers.

## Resultado

`ScaleOverlayPanel` fica mais perto de uma camada de orquestracao. O mapa no braco passa a ter um ponto proprio para evoluir sem misturar UI de lista, leitura lateral e acao tocavel.
