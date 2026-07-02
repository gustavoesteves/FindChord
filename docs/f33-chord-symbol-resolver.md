# F33 — Resolvedor de Cifras

## Objetivo

Criar uma camada propria para resolver cifras antes de depender do Tonal.

O Tonal continua sendo util para notas, intervalos, transposicao e escalas. Mas a cifragem real de jazz/MPB/software tem dialetos que precisam ser tratados como contrato do Find Chord.

## Fonte do contrato

A base da F33 e:

- `docs/theory/chord_symbol_dictionary.md`
- `docs/references/chord_symbol_sources.md`

Esses documentos definem:

- aliases aceitos;
- forma interna canonica;
- forma de exibicao por perfil;
- notas essenciais;
- ambiguidades perigosas;
- relacao com MusicXML e softwares reais.

## Implementacao inicial

Novo resolvedor:

```ts
src/utils/music/theory/ChordSymbolResolver.ts
```

Funcoes principais:

```ts
resolveChordSymbol(raw, profile)
chordPitchClasses(chord)
chordRoot(chord)
```

Contratos importantes:

- `Cm7(b5)`, `Cm7b5`, `Cø`, `Cø7`, `C0` resolvem para `Cm7b5`;
- `CΔ`, `CΔ7`, `C^`, `CM7`, `C7M` resolvem para `Cmaj7`;
- `Calt` resolve para `C7alt`;
- `C7sus` resolve para `C7sus4`;
- `C69` resolve para `C6/9`;
- `N.C.` nao entra como acorde funcional.

## Primeira integracao

`noteCoveredByChord` agora usa `chordPitchClasses`.

Isso corrige um risco central: uma cifra musicalmente valida, mas nao reconhecida pelo Tonal, nao deve zerar cobertura melodica.

Exemplo:

```text
Bm7(b5)
```

Agora cobre:

```text
B D F A
```

Com isso, a estrategia menor funcional pode voltar a exibir:

```text
Bm7(b5)
```

em vez de usar apenas a grafia interna compacta `Bm7b5`.

## Ambiguidade protegida

`C7+` foi tratado como caso dependente de perfil:

- em `br`: alias legado de `C7M`, com aviso;
- em `ireal`: `C7(#5)`.

O sistema nao deve exibir `7+` como forma canonica.

## Fora do escopo

- Substituir todas as chamadas diretas a `Chord.get`.
- Exportar MusicXML semantico.
- Resolver polychords.
- Resolver toda a semantica de alterados.
- Criar UI de perfil de cifragem.

## Testes

Coberto por:

- `scripts/chord-symbol-resolver.spec.ts`
- `scripts/minor-functional-strategy.spec.ts`

Os testes verificam:

- matriz inicial do dicionario de cifras;
- pitch classes de aliases que o Tonal nao resolve diretamente;
- diferenca entre maior e menor simples;
- ambiguidade `7+`;
- cobertura melodica de `Bm7(b5)`.

## Proxima fatia

F33.1 migra os primeiros pontos de analise sensiveis para o resolvedor:

1. `HarmonicIdiomClassifier`;
2. `IiVFunctionalGrammar`;
3. `StructuralBassGrammar`.

A migracao deve ser gradual, com teste por familia de cifra.

Implementado em `docs/f33-1-chord-resolver-analysis-migration.md`.
