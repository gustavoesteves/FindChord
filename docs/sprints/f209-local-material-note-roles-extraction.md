# F209 - Extração dos papéis de nota no braço

## Objetivo

Remover de `ScaleOverlayPanel` a classificação musical das notas exibidas no braço.

Antes, o componente decidia diretamente se uma nota era:

- tônica;
- nota do acorde;
- nota característica;
- tensão;
- nota de evitar.

Essa lógica é musical, não visual, e pode ser reaproveitada por outras superfícies do `Escrever`.

## Mudança

Foi criado `localMaterialNoteRoles.ts`, com:

```ts
classifyLocalMaterialNote(noteName, chordRoot, chordNotes, sourceType)
```

A função retorna:

- categoria;
- rótulo curto;
- cor sugerida;
- tooltip.

`ScaleOverlayPanel` passou a chamar esse classificador em vez de carregar a regra internamente.

## Por que isso importa

O braço da guitarra passa a renderizar uma leitura já interpretada:

- o componente continua cuidando de SVG, clique e estado visual;
- a teoria de papéis de nota fica em uma camada testável;
- fica mais fácil melhorar a linguagem musical sem mexer no layout.

Essa é mais uma etapa para transformar `Materiais do acorde` em uma ferramenta de decisão musical, não apenas em um mapa escalar colorido.
