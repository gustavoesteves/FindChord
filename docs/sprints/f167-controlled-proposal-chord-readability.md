# F167 - Legibilidade das cifras em propostas controladas

## Objetivo

Melhorar a leitura das cifras geradas por propostas controladas de referencia, especialmente em janelas densas com acordes suspensos, slash chords e multiplas cifras no mesmo compasso.

## Problema

Algumas cifras importadas do MusicXML apareciam no relatorio em forma crua:

```text
Asus4(7,9,11,13)
Bsus4(7)
```

E compassos com varias cifras eram exibidos usando `/` como separador interno:

```text
B7sus4/C#7sus4/Bb/Dm7/A/Cmaj7
```

Isso misturava duas leituras diferentes:

- `/` como baixo invertido;
- `/` como separador de eventos harmonicos.

## Mudancas

As propostas controladas agora canonicalizam cifras com `ChordSymbolResolver` antes de exibir:

```text
Asus4(7,9,11,13) -> A13sus4
Bsus4(7) -> B7sus4
```

A F39 tambem passou a separar multiplas cifras do mesmo compasso com virgula:

```text
12:B7sus4, C#7sus4/Bb, Dm7/A, Cmaj7
```

Assim, `/` volta a significar apenas baixo/inversao dentro da cifra.

## Resultado musical

O motor nao mudou a funcao harmonica nem o ranking. O ganho e de leitura para compositor/arranjador:

- cifra menos crua;
- slash chord menos ambiguo;
- compassos densos mais escaneaveis;
- relatorio mais proximo da linguagem musical esperada.

## Validacao

Foi adicionado teste para garantir que propostas controladas normalizam cifras suspensas importadas em formato cru.
