# F343 - Selecao da linha melodica primaria

## Origem

A auditoria em `docs/auditoria.md` apontou que todas as vozes e staves eram convertidos em uma unica melodia. Isso fazia baixo, acompanhamento ou contracanto contaminarem centro tonal, cadencia, compatibilidade melodica e propostas de harmonizacao.

## Objetivo

Antes de alimentar o Harmonizar, escolher uma linha melodica primaria de forma deterministica e conservadora.

## Implementacao

- `selectMelodicAnchors` agrupa notas por `staff:voice`.
- Quando ha mais de uma linha, seleciona a linha com prioridade:
  - menor `staff`;
  - menor `voice`;
  - maior cobertura de compassos;
  - maior duracao total.
- A linha selecionada e entao convertida em anchors com ticks e spelling preservados.

## Resultado

Por padrao, o Harmonizar deixa de misturar melodia principal com baixo/acompanhamento em partituras multi-voz ou multi-staff.

## Limite conhecido

Essa ainda e uma heuristica. O proximo nivel seria expor/armazenar uma escolha explicita de parte/staff/voz ou inferir a linha por registro/continuidade quando o score nao segue a convencao `staff 1 / voice 1`.

## Validacao

- Teste com `staff 1 voice 1`, `staff 1 voice 2` e `staff 2 voice 1`, garantindo que apenas a linha primaria entra nos anchors.
- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts scripts/score-ingestion-modes.spec.ts scripts/harmonization-density-audit.spec.ts`
- `npm run build`
