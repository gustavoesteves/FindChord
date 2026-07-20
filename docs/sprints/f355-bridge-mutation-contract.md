# F355 - Contrato de mutacao do bridge alinhado ao plugin

## Contexto

A auditoria tecnica marcou que o contrato TypeScript prometia `INSERT_CHORD`, `REPLACE_CHORD` e `DELETE_CHORD`, mas o plugin QML tratava toda mutacao como insercao. Isso podia fazer um caller tipado pedir delete/replace e receber uma insercao silenciosa.

## Alteracoes

- `MutationCommand.action` agora declara apenas `INSERT_CHORD`, que e a unica acao implementada.
- `isBridgeMessage` valida versao `1.0` e tipos de mensagem conhecidos antes do frontend propagar mensagens.
- O transporte rejeita mensagens fora do contrato antes de enviar.
- O bridge nao enfileira mutacoes com acao nao suportada.
- O plugin QML rejeita mutacoes que nao sejam `INSERT_CHORD` com ACK `rejected`.
- A spec de seguranca cobre o contrato e a rejeicao de versao/tipo invalidos.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`
- `npm run lint`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`

