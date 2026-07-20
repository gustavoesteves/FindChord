# F340 - Ciclo real de sincronizacao de score

## Origem

A auditoria em `docs/auditoria.md` apontou que a UI encerrava o estado de sincronizacao por timeout fixo, ignorando se o plugin realmente devolveu um snapshot novo.

## Objetivo

Fazer o dashboard tratar sincronizacao como um ciclo rastreavel:

1. pedido enviado;
2. plugin exporta o MusicXML;
3. bridge parseia e devolve o snapshot;
4. UI encerra o estado de sincronizacao apenas ao receber o snapshot correspondente ou ao expirar.

## Implementacao

- `requestScoreSync` gera um `requestId`.
- O dashboard envia `request_score` com esse `requestId`.
- O plugin repassa o `requestId` em `/api/v1/score`.
- O bridge retransmite `SCORE_SNAPSHOT` preservando o `requestId`.
- O adapter espera o snapshot correspondente antes de retornar sucesso.
- `useScoreSync` remove o encerramento artificial por `setTimeout`.

## Resultado

A UI deixa de sugerir que a sincronizacao terminou apenas porque passou um pequeno intervalo. O estado agora acompanha uma resposta real do bridge/plugin ou um timeout controlado no adapter.

## Limite conhecido

Ainda falta associar a resposta a uma identidade de score/documento. Esse sera o proximo passo para evitar respostas tardias de outro documento ativo.

## Validacao

- `node --check scripts/musescore-bridge.cjs`
- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`
- `npm run build`
