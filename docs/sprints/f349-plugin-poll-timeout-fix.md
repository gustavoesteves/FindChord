# F349 - Hotfix do timeout falso no polling do plugin

## Origem

Ao rodar o plugin MuseScore, apareceu o log:

`[Find Chord Bridge] QML Log: Warning: request timeout fallback triggered`

## Causa

Depois do pareamento por token, `checkPendingEvents()` pode sair cedo quando o plugin ainda nao recebeu `bridgePluginToken`. Mesmo assim, o `pollTimer` armava `timeoutTimer` logo apos a chamada.

Isso criava um timeout sem haver uma requisicao `/api/v1/consume` realmente em voo.

## Correcao

- `checkPendingEvents()` passa a retornar `true` apenas quando enviou a requisicao `/consume`.
- O `pollTimer` so inicia `timeoutTimer` quando esse retorno e `true`.
- Em falha imediata de envio, o timeout e parado.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`
