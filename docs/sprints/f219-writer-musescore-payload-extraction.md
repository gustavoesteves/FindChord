# F219 - Extração do payload MuseScore no Escrever

## Objetivo

Remover de `VirtualFretboard` a montagem direta do `CanonicalChordEvent` usado pelo botão `Inserir no MuseScore`.

## Mudança

Foi criado `writerMuseScorePayload.ts`, com:

```ts
buildWriterMuseScoreChordEvent(input)
```

A função:

- retorna `null` sem acorde ativo;
- calcula notas MIDI a partir de afinação e trastes;
- ordena as notas MIDI;
- copia frets e tuning para o evento;
- preserva símbolo, inversão, tipo de voicing, tensão e `voiceLeadingScore`.

## Por que isso importa

O envio ao MuseScore é uma integração sensível. Tirar a montagem do payload do componente deixa essa fronteira testável sem mudar o botão nem o adaptador.

`VirtualFretboard` fica mais próximo de sua função principal:

- entrada física no braço;
- playback;
- renderização;
- acionamento da integração.
