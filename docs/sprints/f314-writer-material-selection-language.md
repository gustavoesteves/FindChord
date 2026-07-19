# F314 - Linguagem de selecao em materiais

## Objetivo

Alinhar o codigo de `Materiais do acorde` com o comportamento atual da UI: escolher uma ideia musical em foco.

## Alteracoes

- `localActiveSource` passa a ser `selectedMaterialSource`.
- O modelo da tela recebe `selectedMaterialSource`.
- O cabecalho passa a falar em selecao/destaque, nao em filtro.
- O botao de limpar selecao volta ao primeiro material da rota.

## Decisao

Depois da mudanca para selecao explicita, chamar o estado de filtro ou overlay ficou enganoso. A tela agora trata o material ativo como uma escolha musical temporaria.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-routes.spec.ts scripts/writer-material-palette.spec.ts`
- `npm run build`
