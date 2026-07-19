# F218 - Remoção do activeScale legado

## Diagnóstico

O store global `useChordStore` ainda mantinha:

```ts
activeScale
setActiveScale
```

Esse estado era lido apenas por `VirtualFretboard`, para desenhar um overlay antigo de escala no braço principal.

Depois da evolução de `Escrever > Materiais do acorde`, essa responsabilidade passou para o painel próprio de materiais, com:

- fonte local;
- material tocável;
- classificação de nota;
- geometria própria do braço de material.

Ninguém mais chamava `setActiveScale`.

## Mudança

Foram removidos:

- `activeScale` do store;
- `setActiveScale`;
- resets de `activeScale`;
- leitura direta de `useChordStore` dentro de `VirtualFretboard`;
- ramo `MODO SCALE OVERLAY`;
- helper `getDegreeLabel`.

## Por que isso importa

O braço principal volta a ter uma responsabilidade clara:

- receber entrada física do usuário;
- mostrar as notas tocadas;
- tocar o acorde;
- enviar o acorde ao MuseScore.

O estudo de materiais agora vive no painel apropriado, sem estado global legado conectando telas de forma invisível.
