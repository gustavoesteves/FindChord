# F129 - Semantica de passagem na bebop dominant

## Problema

A F128 adicionou `bebop dominant` ao vocabulario de dominantes naturais. Mas a
escala tem uma nota cromatica especifica que nao deve ser tratada como tensao
sustentavel.

Em `G bebop dominant`:

```text
G A B C D E F F#
```

O `F#` e nota de passagem cromatica entre `F` e `G`, nao uma tensao para
repousar.

## Decisao

Cada candidata contextual passa a separar:

- `supportedTensions`: tensoes que podem colorir a leitura;
- `passingNotes`: notas de passagem idiomaticas.

Para `bebop dominant`, a 7M cromatica entra em `passingNotes`.

## Efeito na UI

O detalhe `Ver leitura` agora mostra `Passagens` separado de `Tensoes`.

Isso evita uma leitura errada: a escala bebop nao aparece como autorizacao para
sustentar a 7M sobre um acorde dominante, mas como vocabulario linear.

## Proximo passo

O proximo refinamento natural e usar `passingNotes` para sugerir pequenos
fragmentos de aproximacao melodica, sem ainda gerar solos completos.
