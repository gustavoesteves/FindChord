# F36.2 — Cobertura por Resolucao Melodica

## Objetivo

Evitar que toda dissonancia melodica seja tratada como erro de cobertura.

F36.1 passou a medir cobertura por peso melodico. F36.2 acrescenta comportamento melodico: uma nota fora do acorde pode receber credito parcial quando ela resolve musicalmente para uma nota sustentada pela harmonia.

## Problema

Harmonizacao real nao exige que toda nota melodica seja nota do acorde.

Algumas notas fora do acorde funcionam como:

- suspensao ou retardo;
- aproximacao cromatica;
- passagem por grau conjunto.

Sem essa camada, o sistema poderia penalizar uma dissonancia correta como se fosse incompatibilidade harmonica.

## Decisao teorica

Uma nota fora do acorde so recebe credito quando ha comportamento de resolucao.

O sistema diferencia:

```text
chord-tone              -> nota coberta pelo acorde
suspension-resolution   -> apoio estrutural resolve por grau conjunto em nota coberta
chromatic-approach      -> nota leve aproxima cromaticamente uma nota coberta
stepwise-passing        -> nota passa entre vizinhos cobertos por grau conjunto
unresolved              -> dissonancia sem resolucao reconhecida
```

Suspensao nao e apenas "uma nota a um semitom de distancia". Ela precisa resolver em uma nota com peso real. Isso evita aceitar uma nota longa descoberta apenas porque depois aparece um ornamento curto que pertence ao acorde.

## Comportamento implementado

A cobertura melodica agora gera entradas com:

- comportamento melodico;
- peso original;
- peso creditado.

Créditos:

- nota do acorde recebe credito integral;
- suspensao/retardo recebe credito parcial alto;
- aproximacao cromatica recebe credito parcial;
- passagem por grau conjunto recebe credito parcial menor;
- dissonancia nao resolvida nao recebe credito.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/MelodicCoverage.ts
src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts
src/utils/music/analysis/engines/GravityFieldManager.ts
```

Mudancas:

- criada camada `MelodicCoverage`;
- `noteCoveredByChord` passou a delegar para `noteCoveredByChordSymbol`;
- validadores usam `weightedMelodicCoverage`;
- o gate experimental usa a mesma cobertura por resolucao;
- testes cobrem suspensao, aproximacao cromatica, dissonancia nao resolvida e aceitacao de suspensao estrutural.

## Testes

Coberto por:

```text
scripts/melodic-anchor-classifier.spec.ts
scripts/harmonic-strategy-properties.spec.ts
```

## Fora do escopo

- Distinguir suspensao 4-3, 7-6, 9-8 por especie.
- Exigir direcao intervalar real com oitava.
- Projetar esse comportamento na UI.
- Gerar conducao de vozes interna.

## Seguimento implementado

F36.3 expos diagnosticos musicais de cobertura, como "apoio melodico descoberto", "suspensao resolvida" e "aproximacao cromatica aceita".

```text
docs/f36-3-melodic-coverage-diagnostics.md
```
