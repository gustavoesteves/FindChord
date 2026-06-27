# Find Chord

Find Chord e uma suite web para guitarra e harmonia aplicada. O sistema atual tem duas telas principais:

- **Escrever**: montar acordes no braco virtual, analisar a cifra detectada, explorar voicings e enviar acordes para o MuseScore.
- **Harmonizar**: sincronizar uma partitura do MuseScore, ler melodia e cifras existentes, analisar a referencia harmonica e propor harmonizacoes ou rearmonizacoes por estrategia.

## Rodando o Projeto

```bash
npm install
npm run dev
```

O app abre pela entrada unica `index.html`. O antigo `suite.html` foi removido na F27.

## Comandos de Validacao

```bash
npm run lint
npm run build
npm run test:curated
```

`test:curated` executa a regua musical ativa do projeto: benchmarks de ingestao MusicXML, deteccao de acordes no fretboard, propriedades de estrategia harmonica, baixo estrutural, ii-V funcional, funcao aparente e memoria temporal.

## MuseScore

A integracao com MuseScore usa o bridge local:

```bash
node scripts/musescore-bridge.cjs
```

O app se conecta ao WebSocket `ws://localhost:9000/dashboard`. A tela Harmonizar usa **Sincronizar Partitura** para receber snapshots do plugin, e a tela Escrever pode enviar um acorde selecionado de volta ao MuseScore.

## Arquitetura Atual

```text
src/domains/suite
  Casca da aplicacao, navegacao e conexao MuseScore.

src/domains/writer
  Tela Escrever.

src/domains/harmonizer
  Tela Harmonizar, hooks e servicos de proposta.

src/components
  Infraestrutura compartilhada entre dominios; hoje apenas layout comum.

src/utils/music
  Nucleo musical ativo: fretboard, voicings, analise de partitura,
  estrategias/validadores harmonicos e motores usados pelas propostas.
```

Mais detalhes estao em:

- `docs/f27-suite-refactor.md`
- `docs/screens-architecture.md`

## Estado da Refatoracao F27

A F27 removeu entradas, componentes, motores e documentos legados que nao alimentavam mais Escrever, Harmonizar ou a suite curada de testes. A historia permanece no Git; o codigo ativo agora deve refletir apenas o produto atual.
