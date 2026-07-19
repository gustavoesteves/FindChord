# F225 - Materiais do acorde no renderer comum

## Objetivo

Remover o segundo SVG de fretboard da tela `Materiais do acorde`, usando o mesmo renderer criado para o `Braço`.

## Alterações

- `FretboardRenderer` passou a aceitar clique em nota e pequenos ajustes de estilo por nota.
- `ScaleOverlayPanel` agora monta notas visiveis do material e delega o desenho para `FretboardRenderer`.
- A interacao de clicar na nota para ouvir foi preservada.

## Resultado

`Braço` e `Materiais do acorde` agora compartilham o mesmo renderer de fretboard. A diferenca entre as telas passa a ser o view model musical e o tema visual, nao uma duplicacao completa de SVG.

## Proximo passo

Extrair a montagem das notas de `Materiais do acorde` para um serviço proprio, do mesmo modo que fizemos com `writerInputFretboardNotes`.
