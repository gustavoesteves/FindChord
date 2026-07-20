# F339 - Endurecimento do caminho de sincronizacao MusicXML

## Origem

A auditoria em `docs/auditoria.md` apontou que `/api/v1/score` aceitava `payload.path` e fazia leitura direta no filesystem. Isso permitia leitura arbitraria de arquivo local e bloqueio do event loop por arquivo grande.

## Objetivo

Eliminar a leitura livre de caminhos informados pelo cliente sem quebrar o fluxo atual do plugin MuseScore, que exporta MusicXML via `writeScore`.

## Implementacao

- O bridge cria um diretorio temporario controlado com `fs.mkdtempSync`.
- O bridge gera um unico `scoreUploadPath` por sessao.
- O plugin recebe `scoreUploadPath` no handshake `/api/v1/plugin-session`.
- O plugin deixa de escrever em caminho absoluto dentro de `dist`.
- `/api/v1/score` aceita leitura por caminho apenas quando:
  - o caminho resolve exatamente para o arquivo temporario permitido;
  - o alvo existe;
  - o alvo e arquivo regular;
  - o tamanho esta abaixo de `MAX_SCORE_BODY_BYTES`.
- O bridge tambem aceita `payload.xml` para uma futura migracao a upload direto em bytes.

## Resultado

O bridge deixa de aceitar caminhos arbitrarios vindos do cliente e o fluxo fica mais portavel, porque o caminho de exportacao passa a ser gerado pelo proprio bridge local.

## Limite conhecido

Ainda existe arquivo intermediario porque o plugin QML usa `writeScore`. O caminho seguro atual prepara uma migracao futura para upload direto se encontrarmos uma API QML confiavel para ler o MusicXML em memoria.

## Validacao

- `node --check scripts/musescore-bridge.cjs`
- `npx vitest run --config vitest.curated.config.ts scripts/musescore-insertion-safety.spec.ts`
