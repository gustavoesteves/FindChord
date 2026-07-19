# F212 - Contrato das categorias visuais de notas

## Objetivo

Centralizar as categorias usadas no braço de `Escrever > Materiais do acorde`.

Antes, `ScaleOverlayPanel` mantinha manualmente:

- estado inicial de visibilidade;
- ordem da legenda;
- rótulos;
- classes visuais;
- categorias aceitas.

Isso duplicava informações que já pertencem à leitura de papéis de nota.

## Mudança

`localMaterialNoteRoles.ts` agora expõe:

```ts
LOCAL_MATERIAL_NOTE_CATEGORIES
defaultLocalMaterialNoteCategoryVisibility()
```

`ScaleOverlayPanel` renderiza a legenda a partir desse contrato, sem repetir cinco botões quase iguais.

## Por que isso importa

A UI passa a depender de uma lista única de categorias:

- tônica;
- nota do acorde;
- nota característica;
- tensão;
- avoid.

Isso reduz risco de divergência quando evoluirmos a leitura visual ou criarmos novas superfícies para materiais locais.
