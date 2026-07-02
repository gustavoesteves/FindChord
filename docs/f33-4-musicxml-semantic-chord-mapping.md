# F33.4 — Mapeamento Semantico de Cifras para MusicXML

## Objetivo

Criar a primeira projecao semantica do contrato de cifras para MusicXML.

A F33.3 garantiu que o resolvedor entende as cifras reais em `docs/musics`. A F33.4 transforma esse resultado em uma estrutura que pode ser exportada como:

```text
kind + degree[]
```

sem depender apenas da string exibida.

## Implementacao

Novo arquivo:

```text
src/utils/music/theory/MusicXmlChordSymbolMapper.ts
```

Funcao principal:

```ts
toMusicXmlHarmony(rawChord)
```

Retorna:

```ts
{
  root,
  bass,
  kind,
  kindText,
  degrees,
  display,
  normalized,
  warnings
}
```

## Decisoes

### `kind` carrega a familia base

Exemplos:

```text
C       -> major
Cm      -> minor
C7M     -> major-seventh
Cm7(b5) -> half-diminished
C°7     -> diminished-seventh
```

### `degree[]` carrega adicoes e alteracoes

Exemplos:

```text
C6/9       -> kind major-sixth + add 9
Bb7(#11)   -> kind dominant + add #11
Db7(#9,b13)-> kind dominant + add #9 + add b13
```

### `sus` dominante usa `kindText`

Exemplos:

```text
C7sus  -> kind suspended-fourth + add b7, kindText 7sus4
C13sus -> kind suspended-fourth + add b7/9/13, kindText 13sus4
```

### `alt` nao e expandido prematuramente

`Calt` vira:

```text
kind: dominant
kindText: 7alt
degree[]: []
```

Isso preserva `alt` como classe idiomatica, em vez de inventar uma combinacao especifica de alteracoes.

## Garantia sobre repertorio real

`scripts/chord-symbol-real-music-compatibility.spec.ts` agora valida duas coisas:

1. toda cifra real resolve pelo `ChordSymbolResolver`;
2. toda cifra real vira uma forma semantica MusicXML com raiz e `kind`.

## Testes

Coberto por:

- `scripts/musicxml-chord-symbol-mapper.spec.ts`
- `scripts/chord-symbol-real-music-compatibility.spec.ts`
- `scripts/chord-symbol-resolver.spec.ts`

## Fora do escopo

- Escrever XML final.
- Fazer round-trip completo import -> resolver -> export -> import.
- Polychords.
- Perfil de exibicao configuravel pela UI.

## Proxima fatia

F33.5 implementa o renderizador XML minimo:

1. converter `MusicXmlHarmonyMapping` em bloco `<harmony>`;
2. testar round-trip com `parseXMLHarmonyBlock`;
3. preservar `kind text` quando a grafia exibida importa.

Implementado em `docs/f33-5-musicxml-harmony-renderer-roundtrip.md`.
