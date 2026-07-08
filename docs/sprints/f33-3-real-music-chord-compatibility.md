# F33.3 — Compatibilidade de Cifras em Repertorio Real

## Objetivo

Validar o `ChordSymbolResolver` contra as cifras reais importadas dos MusicXML em `docs/musics`.

Essa fatia fecha o primeiro ciclo da F33: depois de criar o contrato e migrar analisadores centrais, o resolvedor precisa provar que entende o repertorio real que usamos nos diagnosticos.

## Corpus analisado

Arquivos lidos:

- `Bright Size Life.musicxml`
- `Esse caminhar.musicxml`
- `asa branca.musicxml`
- `autum leaves.musicxml`
- `depois de muito discutir.musicxml`
- `exemplo.musicxml`
- `palhaco.musicxml`
- `teste2.musicxml`

O corpus atual contem 44 cifras unicas.

## Resultado da primeira auditoria

O teste inicial encontrou apenas uma familia nao coberta:

```text
Am11
Dm9
Gm11
```

Ou seja, o contrato entendia `m7`, `m6`, `m7(b5)` etc., mas ainda nao modelava extensoes menores `m9` e `m11`.

## Contrato ampliado

Foram adicionadas duas qualidades internas:

```ts
m9
m11
```

Com notas essenciais:

```text
m9  = 1 b3 5 b7 9
m11 = 1 b3 5 b7 9 11
```

Aliases aceitos:

```text
Cm9, Cmin9, Cmi9, C-9
Cm11, Cmin11, Cmi11, C-11
```

## Garantia nova

Novo teste:

```text
scripts/chord-symbol-real-music-compatibility.spec.ts
```

Ele extrai todas as harmonias dos MusicXML reais e falha se qualquer cifra:

- ficar `ambiguous`;
- ou resolver como acorde sem notas, exceto `N.C.`.

## Cifras reais cobertas

Exemplos do corpus atual:

```text
A7
A7(b13)
Bb(add9)/C
Bb7(#11)
B7(b13)
Db7(#9)
Dm9
F#m7(b5)
Gm11
G/A
Gbdim7
```

## Fora do escopo

- Exportar MusicXML semantico.
- Validar polychords.
- Validar cifras digitadas manualmente fora do corpus.
- Resolver todos os dialetos possiveis de softwares externos.

## Proxima fatia

F33.4 ataca importacao/exportacao semantica:

1. mapear `ResolvedChordSymbol` para `MusicXML kind + degree[]`;
2. preservar `display` como `kind text` quando necessario;
3. garantir round-trip basico para as cifras do corpus real.

Implementado em `docs/f33-4-musicxml-semantic-chord-mapping.md` para a primeira projecao semantica.
