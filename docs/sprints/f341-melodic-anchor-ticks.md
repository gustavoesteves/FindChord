# F341 - Preservacao temporal dos anchors melodicos

## Origem

A auditoria em `docs/auditoria.md` apontou que `selectMelodicAnchors` descartava `tickStart` e `tickEnd` ao converter `ScoreNoteEvent` em `MelodicAnchor`.

## Problema

Sem ticks nos anchors, motores temporais podiam cair em defaults como `0`, `anchors.length * 1920` ou non-null assertions. Isso afetava:

- regioes harmonicas;
- selecao de notas sobrepostas a uma cifra;
- slots temporais;
- compatibilidade melodica;
- propostas geradas longe do compasso real.

Tambem havia perda de spelling para acidentes duplos, pois apenas `alter === 1` e `alter === -1` eram tratados.

## Implementacao

- `selectMelodicAnchors` passa a preservar:
  - `startTick`;
  - `endTick`;
  - `duration`.
- Notas sem ticks finitos ou com `tickEnd <= tickStart` sao descartadas na conversao de anchors.
- Spelling passa a aceitar qualquer magnitude de `alter`:
  - `alter = 2` vira `##`;
  - `alter = -2` vira `bb`.

## Validacao

- Teste cobrindo `Bbb` em compasso tardio.
- Teste cobrindo anchors iniciando no compasso 5 sem voltarem para a origem temporal.
- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts scripts/score-ingestion-modes.spec.ts scripts/harmonizer-controlled-proposals.spec.ts`
- `npm run build`

## Proximo passo

Atacar a selecao estrutural da melodia: o limite de 32 notas ainda pode produzir falso final de frase quando uma nota curta anterior substitui a cadencia real.
