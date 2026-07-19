# F308 - Ranking local por espectro musical

## Objetivo

Evitar que materiais locais mais densos aparecam antes dos apoios fundamentais no `Escrever`.

## Alteracoes

- `buildLocalChordMaterialReadings` passa a ordenar por intencao:
  - `inside`;
  - `functional`;
  - `tension`;
  - `outside`.
- Confianca e quantidade de materiais viram desempate dentro da mesma faixa.
- Teste garante que `side slip minor pentatonic` fica depois dos materiais internos e de tensao.

## Decisao

No vamp local, a ordem precisa representar navegacao musical. O usuario deve poder partir do acorde, abrir cor, tensionar e so entao sair para fora com retorno consciente.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-materials.spec.ts scripts/local-chord-vamp-materials.spec.ts scripts/writer-material-routes.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-palette.spec.ts`
- `npm run build`
