# F213 - Builder de notas do braço para materiais locais

## Objetivo

Remover de `ScaleOverlayPanel` a decisão por casa do braço:

- calcular a nota da casa;
- verificar se a nota pertence à fonte de material;
- classificar seu papel local;
- aplicar filtro de visibilidade;
- escolher rótulo exibido;
- montar tooltip.

## Mudança

Foi criado `localMaterialFretboardNotes.ts`, com:

```ts
buildLocalMaterialFretboardNote(input)
```

A função retorna uma nota pronta para renderização ou `null` quando a casa não deve aparecer.

## Por que isso importa

O SVG continua no componente, mas a leitura musical de cada ponto do braço passa a ser testável fora da UI.

Isso facilita evoluir o braço para mostrar outros tipos de material sem espalhar novas regras dentro do JSX.
