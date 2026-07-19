# F187 - Lacunas residuais de materiais melodicos

## Objetivo

Reduzir os casos sem material melodico que restaram apos F186, especialmente acordes de tons inteiros/aumentados, menor-maior e add9 maior.

## Implementação

- `whole tone` em acordes aumentados recebe `tons inteiros / aumentado`.
- `melodic minor` e `harmonic minor` em `mMaj7` recebem materiais de menor-maior.
- `major` e `major pentatonic` em `add9` recebem `add9 maior / pentatônica`.
- `major pentatonic` e `minor pentatonic` em power chords recebem `power chord / pentatônica`.

## Exemplos

`G7(#5)`

```text
G-B-D#
G-A-B-D#
```

`AmM7`

```text
A-C-E-G#
F#-G#-A
```

`Bbadd9`

```text
Bb-C-D-F
Bb-C-D-F-G
```

`F#5`

```text
F#-C#-G#
F#-G#-C#-D#
```

## Critério musical

Esses materiais devem ser lidos como cor local. Eles completam o vocabulário do acorde isolado sem criar cadências artificiais nem importar tensão alterada onde ela não foi escrita.

## Efeito na auditoria F184

- Casos sem material caíram de 152 para 0.
- A auditoria agora mede qualidade de promoção/apresentação, não mais ausência bruta de vocabulário.
