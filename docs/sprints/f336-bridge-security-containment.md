# F336 - Contencao inicial do bridge MuseScore

## Origem

A auditoria em `docs/auditoria.md` apontou riscos P1 no bridge local e no plugin MuseScore:

- execucao dinamica de JavaScript via evento `EVAL`;
- servidor HTTP escutando sem bind explicito em loopback;
- WebSocket aceitando caminhos por `includes('/plugin')`;
- endpoints de dashboard aceitando chamadas sem `Origin`;
- retransmissao ampla entre clientes sem papel claro.

## Decisao

Aplicar uma primeira camada de contencao sem redesenhar ainda o protocolo completo de sessao/ACK.

Essa etapa nao resolve todo o contrato de seguranca do bridge, mas remove o caminho mais perigoso e reduz a superficie exposta durante o desenvolvimento local.

## Implementacao

- Removido o tratamento de `EVAL` no plugin QML.
- Bridge passa a escutar explicitamente em `127.0.0.1`.
- WebSocket aceita apenas caminhos exatos:
  - `/dashboard`
  - `/plugin`
- Dashboard WebSocket exige `Origin` local autorizado.
- Plugin WebSocket aceita ausencia de `Origin`, mas nao aceita Origins externos.
- Fan-out WebSocket passa a respeitar papel:
  - dashboard envia para plugin;
  - plugin envia para dashboard.
- Mensagens de score vindas do plugin sao retransmitidas apenas para dashboards.
- Endpoints HTTP de dashboard sem `Origin` passam a ser rejeitados.
- Payload maximo de WebSocket reduzido.

## Validacao

- `node --check scripts/musescore-bridge.cjs`
- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`

## Proximos passos

Ainda falta resolver o desenho completo apontado pela auditoria:

- token efemero de pareamento;
- fila por sessao/score;
- command ID, TTL e ACK/NACK;
- schemas runtime para HTTP e WebSocket;
- restricao segura do fluxo de MusicXML;
- testes HTTP/WS em porta efemera.
