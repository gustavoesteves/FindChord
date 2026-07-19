# F249 - Componente do bloco Tocar agora

## Objetivo

Reduzir o JSX de `ScaleOverlayPanel` e isolar a apresentacao da acao tocavel do material.

## Alteracoes

- Criado `WriterMaterialActionBlock`.
- O bloco concentra titulo, escola, descricao, notas exibidas e botao de audio.
- `ScaleOverlayPanel` passa a renderizar o bloco com `action` e `onPlay`.

## Resultado

O fluxo de `Tocar agora` fica separado em duas camadas: presenter musical em `writerMaterialAction` e componente visual em `WriterMaterialActionBlock`.
