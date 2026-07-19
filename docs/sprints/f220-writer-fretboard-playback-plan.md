# F220 - Plano de playback do braço no Escrever

## Objetivo

Remover de `VirtualFretboard` o cálculo direto da sequência de notas do botão `Tocar acorde`.

## Mudança

Foi criado `writerFretboardPlayback.ts`, com:

```ts
buildWriterFretboardPlaybackSteps(selectedFrets, tuning, stepDelayMs)
```

A função retorna uma lista de passos:

- índice da corda;
- nota calculada;
- atraso em milissegundos.

O componente continua responsável por:

- chamar o sintetizador;
- acionar a animação da corda;
- agendar os `setTimeout`.

Também foi ajustada a atualização de `vibratingStrings` para usar `setState` funcional, evitando sobrescrever animações em dedilhados rápidos.

## Por que isso importa

O playback do braço passa a ter uma regra testável, sem ficar escondido no JSX.

Isso deixa o `VirtualFretboard` mais limpo e preserva o comportamento atual do botão.
