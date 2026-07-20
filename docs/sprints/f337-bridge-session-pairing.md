# F337 - Pareamento local do bridge MuseScore

## Origem

A auditoria em `docs/auditoria.md` apontou que o bridge ainda operava como um canal local aberto demais, mesmo apos a contencao inicial da F336.

## Objetivo

Adicionar uma sessao efemera em memoria para separar dashboard e plugin antes de avancarmos para ACK/NACK e fila por score.

## Implementacao

- O bridge gera, ao iniciar:
  - `sessionId`;
  - `dashboardToken`;
  - `pluginToken`.
- O dashboard busca `/api/v1/session` com Origin local autorizado e recebe o endpoint WebSocket pareado.
- O plugin busca `/api/v1/plugin-session` e passa a enviar `X-FindChord-Plugin-Token` nos endpoints HTTP.
- WebSockets de dashboard e plugin exigem `session` e `token` na URL.
- Endpoints HTTP de dashboard exigem `X-FindChord-Session` ou token de query, com excecao do handshake de sessao.
- Endpoints HTTP de plugin passam a exigir `X-FindChord-Plugin-Token` depois do handshake.

## Limite conhecido

Esse pareamento ainda nao substitui um modelo completo de confianca. Como a integracao e local, um processo local malicioso ainda pode tentar interagir com o bridge. A melhora principal e:

- reduzir exposicao acidental;
- separar papeis;
- preparar o contrato para comandos por sessao, TTL e ACK/NACK.

## Validacao

- `node --check scripts/musescore-bridge.cjs`
- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`
- `npm run build`

## Proximo passo

Implementar command ID, TTL e ACK/NACK para que a UI nao trate como sucesso uma mutacao apenas enfileirada ou enviada pelo WebSocket.
