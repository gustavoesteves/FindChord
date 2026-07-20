# F346 - Mapa explicito de ticks por compasso

## Origem

A auditoria em `docs/auditoria.md` apontou que metrica e timeline ainda eram inferidas em varios pontos por eventos ou pelo fallback fixo de 1920 ticks por compasso.

## Objetivo

Fazer o parser MusicXML expor limites reais de cada compasso, permitindo que consumidores usem a timeline parseada antes de cair em heuristicas.

## Implementacao

- `ScoreSnapshot.metadata.measureTicks` passa a armazenar:
  - numero do compasso;
  - `startTick`;
  - `endTick`;
  - `timeSignature`.
- O parser captura `<time><beats>/<beat-type>`.
- `metadata.timeSignature` recebe a primeira formula de compasso encontrada.
- `useScoreSessionStore` usa `measureTicks` como fonte primaria em `buildMeasureBounds`.

## Resultado

Secoes inferidas passam a respeitar compassos 3/4, compassos vazios entre eventos e limites reais calculados pelo parser.

## Validacao

- Fixture MusicXML em 3/4 com quatro compassos mapeados como `[0,1440]`, `[1440,2880]`, `[2880,4320]`, `[4320,5760]`.
- Teste do store usando `measureTicks` mesmo com eventos apenas nos compassos 1 e 4.
- `npx vitest run --config vitest.curated.config.ts scripts/musicxml-parser-timeline.spec.ts scripts/score-ingestion-modes.spec.ts scripts/temporal-melody-window.spec.ts`
- `npm run build`
