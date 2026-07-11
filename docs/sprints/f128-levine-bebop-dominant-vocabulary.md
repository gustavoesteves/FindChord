# F128 - Vocabulario bebop dominant a partir de Levine

## Fonte

`docs/theory/levine mark - the jazz theory book.pdf`

O OCR direto do PDF ainda e ruidoso em algumas paginas, mas a leitura visual
por `pdftoppm + tesseract` ja permite consulta dirigida. O sumario confirma os
blocos relevantes para o nosso motor: chord/scale theory, bebop scales,
playing outside, pentatonic scales e reharmonization.

## Problema

O motor ja distinguia leitura interna, funcional e tensional, mas dominantes
naturais ainda tinham um vocabulario interno muito curto:

```text
mixolydian, lydian dominant, altered
```

Para improviso funcional, especialmente em linguagem bebop, falta a escala
bebop dominant: uma leitura interna que adiciona a setima maior cromatica como
nota de passagem.

## Decisao

Adicionar `bebop dominant` como escala customizada do Find Chord:

```text
1 2 3 4 5 6 b7 7
```

Exemplo em C:

```text
C D E F G A Bb B
```

Ela entra em dominantes naturais logo apos `mixolydian`, preservando a ordem:

```text
mixolydian -> bebop dominant -> lydian dominant -> altered
```

## Efeito musical

`bebop dominant` nao substitui a leitura funcional basica. Ela oferece uma
linha interna mais idiomatica para dominante, coerente com a ideia de conectar
acordes sem cair imediatamente em tensao alterada.

## Limite atual

A escala foi adicionada como vocabulario. Ainda nao ha geracao ritmica ou
colocacao de nota cromatica em tempo fraco, que seria uma etapa posterior de
fraseado bebop.
