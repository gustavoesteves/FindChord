# F211 - Notas de frase local para playback e exibicao

## Objetivo

Remover de `ScaleOverlayPanel` a transposição direta de intervalos para notas nas frases de estudo.

## Mudança

`localMaterialPresentation.ts` agora expõe:

```ts
notesForLocalMaterialLine(root, intervals)
```

A UI usa essa função tanto para:

- tocar a frase de estudo;
- exibir as notas calculadas na tela.

## Por que isso importa

Intervalos, transposição e grafia de notas pertencem à camada musical, não ao componente React.

Com essa extração, o componente continua responsável pelo clique e pela renderização, enquanto a camada de apresentação local decide quais notas representam a frase sobre uma raiz.
