# F215 - Limpeza de legado no painel de materiais do Escrever

## Objetivo

Remover pequenos sinais de legado escalar em `ScaleOverlayPanel`, agora que o painel passou a consumir camadas material-first.

## Mudanças

- Removida uma guarda duplicada de `activeChord`.
- Removido o tipo local que apenas reembrulhava `LocalChordMaterialReading`.
- A tela passou a consumir `materialReadings` diretamente.
- `localActiveScale` foi renomeado para `localActiveSource`.
- `renderScaleFretboard` foi renomeado para `renderMaterialFretboard`.
- O rótulo do braço passou de "Mapa Harmônico da Escala" para "Mapa do Material".
- `activeScaleCandidate` foi renomeado para `activeMaterialCandidate`.

## Por que isso importa

Essa sprint não muda a teoria musical, mas reduz ruído conceitual no módulo mais legado do sistema.

O componente fica mais alinhado com o modelo atual:

- fonte de material;
- leitura local;
- material tocável;
- mapa de apoio.

Menos código pensa em "escala" como resposta final, e mais código passa a tratar escala como uma fonte possível para materiais.
