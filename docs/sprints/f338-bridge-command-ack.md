# F338 - ACK/NACK para comandos do bridge MuseScore

## Origem

A auditoria em `docs/auditoria.md` apontou que a UI tratava como sucesso um comando apenas aceito pelo WebSocket. Isso permitia perda silenciosa, aplicacao tardia e mutacoes em contexto errado.

## Objetivo

Fazer a insercao de cifra retornar sucesso somente quando o plugin MuseScore confirmar que tentou aplicar o comando.

## Implementacao

- `MutationCommand` passa a exigir:
  - `commandId`;
  - `expiresAt`.
- O protocolo passa a aceitar mensagens `ACK`.
- O transporte do dashboard possui `sendWithAck`.
- `sendChord` gera `commandId`, define expiracao e espera o ACK do plugin.
- O bridge descarta comandos expirados antes de entregar ao plugin.
- O plugin envia `COMMAND_ACK` para `/api/v1/ack` depois da tentativa de insercao.
- O bridge retransmite ACKs apenas para dashboards.

## Resultado

A UI deixa de considerar sucesso apenas porque o socket aceitou bytes. Para insercao de acorde, o sucesso agora depende de resposta do plugin.

## Limite conhecido

Este bloco ainda nao resolve totalmente:

- fila por score/documento;
- idempotencia real;
- retry;
- ACK depois de validar identidade do score ativo;
- erro visual detalhado na UI.

Esses pontos continuam no bloco seguinte de fila por sessao/score.

## Validacao

- `node --check scripts/musescore-bridge.cjs`
- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`
- `npm run build`
