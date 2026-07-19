# F214 - Geometria do braço em materiais locais

## Objetivo

Remover de `ScaleOverlayPanel` os números e fórmulas responsáveis pela geometria do braço SVG.

Antes, o componente calculava diretamente:

- largura;
- altura;
- quantidade de trastes;
- largura de cada traste;
- largura do nut;
- marcadores simples e duplos;
- posição de cada casa;
- posição e espessura das cordas.

## Mudança

Foi criado `localMaterialFretboardGeometry.ts`, com:

```ts
buildLocalMaterialFretboardGeometry(stringCount)
xForLocalMaterialFret(geometry, fret)
xForLocalMaterialFretLine(geometry, fret)
localMaterialStringGeometry(stringIndex)
```

O componente continua renderizando o SVG, mas consome um contrato geométrico pronto.

## Por que isso importa

Essa extração separa:

- geometria do braço;
- leitura musical da nota;
- renderização visual.

Com isso, futuras melhorias no braço do `Escrever` podem mexer em enquadramento, responsividade ou número de trastes sem atravessar a lógica musical.
