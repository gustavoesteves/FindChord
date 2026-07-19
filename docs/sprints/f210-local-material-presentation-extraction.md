# F210 - Extração da apresentação dos materiais locais

## Objetivo

Remover de `ScaleOverlayPanel` o bloco de descrições pedagógicas e frases de estudo das fontes de material.

Esse conteúdo não é layout. Ele pertence à camada de apresentação musical do módulo `Escrever`.

## Mudança

Foi criado `localMaterialPresentation.ts`, com:

```ts
describeLocalMaterialSource(sourceType)
suggestedLineForLocalMaterial(sourceType)
```

O componente passou a consumir essas funções em vez de carregar:

- descrições de escalas/fonte;
- texto de cor;
- dica de uso;
- frase de estudo;
- escola associada;
- intervalos para playback.

## Por que isso importa

`ScaleOverlayPanel` fica mais próximo de uma tela pura:

- estado visual;
- seleção;
- renderização do braço;
- botões e playback.

A linguagem musical fica testável e evoluível fora da UI.

Isso também prepara uma revisão futura do conteúdo pedagógico, trocando descrições ainda muito escalares por textos centrados em material, função local e gesto composicional.
