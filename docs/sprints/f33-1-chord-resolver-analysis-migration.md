# F33.1 — Migracao Inicial dos Analisadores para o Resolvedor

## Objetivo

Fazer o contrato de cifras sair do isolamento e passar a proteger analises reais.

A F33 criou `ChordSymbolResolver` e integrou cobertura melodica. A F33.1 migra os primeiros analisadores que mais dependem de grafias corretas:

- classificador de idioma;
- detector ii-V;
- gramatica de baixo estrutural.

## Migracoes feitas

### HarmonicIdiomClassifier

Agora usa o resolvedor para:

- raiz;
- qualidade menor;
- dominante;
- diminuto;
- meio-diminuto;
- pitch classes internas.

Casos protegidos:

```text
Bø
Bm7(b5)
E7(b13)
C7M
C^
CΔ
```

### IiVFunctionalGrammar

Agora usa o resolvedor para classificar:

- `m7`;
- `m7b5` / `ø`;
- dominantes alterados;
- tonicas maiores por `maj7`, `7M`, `^`;
- tonicas menores por `m6`, `m7`, `mMaj7`.

Exemplos reconhecidos:

```text
D-7 -> G7 -> C7M
Bø -> E7alt -> Am6
```

### StructuralBassGrammar

Agora usa o resolvedor para diferenciar inversao real de baixo independente.

Exemplos:

```text
C7M/E  -> inversao trivial
Cø/Eb  -> inversao trivial
F/G    -> baixo independente
```

## Fora do escopo

- Migrar `ApparentFunctionAnalysis`.
- Migrar `VoiceLeadingTransitionEvaluator`.
- Migrar todos os usos de `Chord.get` no harmonizador.
- Exportacao MusicXML semantica.

## Testes

Coberto por:

- `scripts/harmonic-idiom-classifier.spec.ts`
- `scripts/ii-v-functional-grammar.spec.ts`
- `scripts/structural-bass-grammar.spec.ts`
- `scripts/chord-symbol-resolver.spec.ts`

Os testes verificam:

- aliases de maior com setima maior;
- aliases meio-diminutos;
- dominantes alterados;
- inversoes com dialeto brasileiro/jazz;
- preservacao dos comportamentos anteriores.

## Proxima fatia

F33.2 migra:

1. `ApparentFunctionAnalysis`;
2. `VoiceLeadingTransitionEvaluator`;
3. pontos internos de `StrategyGuidedHarmonizer` que ainda leem raiz/notas diretamente do Tonal.

A regra permanece: migrar por familia de comportamento, sempre com teste de cifra real.

Implementado em `docs/f33-2-chord-resolver-apparent-voiceleading-migration.md`.
