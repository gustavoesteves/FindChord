# F228 - Presenter do material ativo

## Objetivo

Reduzir a logica inline da lateral direita de `Materiais do acorde` e preparar a reorganizacao musical da tela.

## Alterações

- Criado `writerActiveMaterialPanel`.
- O presenter reune materiais melodicos, frase de estudo e mapa teorico do material ativo.
- `ScaleOverlayPanel` passou a consumir esse objeto em vez de montar cada secao a partir de funcoes soltas.

## Resultado

A UI ainda mostra as mesmas secoes, mas agora a hierarquia musical pode ser redesenhada em cima de um contrato claro para o material selecionado.
