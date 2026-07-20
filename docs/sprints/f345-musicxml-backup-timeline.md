# F345 - Timeline MusicXML com backup multivoz

## Origem

A auditoria em `docs/auditoria.md` apontou que o parser MusicXML avancava o tick global pelo cursor final do compasso. Em compassos com `<backup>`, esse cursor pode terminar antes da maior duracao realmente alcancada pela voz principal.

## Problema

Em partituras multivoz, uma voz longa pode chegar ao fim do compasso, depois `<backup>` volta o cursor e uma segunda voz curta termina cedo. Se o parser usa esse cursor final, o proximo compasso comeca antes da hora.

## Implementacao

- O parser passa a rastrear `measureMaxCursor`.
- Notas, harmonias e `<forward>` atualizam o maior cursor alcancado no compasso.
- Ao fim do compasso, `currentTick` avanca por `measureMaxCursor`, nao pelo cursor final apos backups.

## Resultado

O compasso seguinte passa a comecar no tick correto mesmo quando ha vozes sobrepostas.

## Validacao

- Fixture MusicXML minima com:
  - voz 1 sustentando 1920 ticks;
  - `<backup>` de 1920;
  - voz 2 com 480 ticks;
  - compasso seguinte iniciando em 1920.
- `npx vitest run --config vitest.curated.config.ts scripts/musicxml-parser-timeline.spec.ts scripts/score-ingestion-modes.spec.ts`
- `npm run build`
