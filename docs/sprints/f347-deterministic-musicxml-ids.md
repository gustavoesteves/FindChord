# F347 - IDs deterministicos no parser MusicXML

## Origem

A auditoria em `docs/auditoria.md` apontou que IDs de secao baseados em `Math.random()` mudavam a cada sincronizacao. Isso invalida a selecao ativa e pode fazer a UI analisar temporariamente o score inteiro antes de cair novamente na primeira secao.

## Objetivo

Fazer a mesma partitura produzir os mesmos IDs de secao e nota a cada parse.

## Implementacao

- Secoes passam a usar ID estavel baseado em:
  - compasso;
  - tick;
  - label normalizado.
- Repeticoes identicas recebem sufixo deterministico.
- Notas passam a usar ID baseado em:
  - compasso;
  - tick;
  - voice;
  - staff;
  - pitch;
  - indice de parse.

## Resultado

Sincronizacoes repetidas do mesmo score deixam de trocar IDs arbitrariamente, preparando o terreno para preservar selecao ativa por chave estavel.

## Validacao

- Teste parseando o mesmo MusicXML duas vezes e comparando IDs de secoes/notas.
- `npx vitest run --config vitest.curated.config.ts scripts/musicxml-parser-timeline.spec.ts scripts/score-ingestion-modes.spec.ts`
- `npm run build`
