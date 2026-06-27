# F27 — Suite Refactor Boundary Map

## Objetivo

O Find Chord agora tem duas frentes de produto estáveis:

- **Escrever**: fretboard, captura de shapes, voicings, timeline e envio para MuseScore.
- **Harmonizar**: leitura de partitura, análise de harmonia existente, harmonização e rearmonização.

A refatoração F27 organiza essas frentes como domínios explícitos sem fazer uma migração grande e arriscada de uma vez.

## Fronteiras Criadas

```text
src/domains/suite
  Identidade das abas/domínios principais da suíte e componentes/serviços da casca global.

src/domains/writer
  Fachada pública da tela Escrever.

src/domains/harmonizer
  Fachada pública da tela Harmonizar e serviços de domínio.
```

## Tela Canônica

`src/domains/harmonizer/HarmonizerScreen.tsx`

É a implementação canônica da tela Harmonizar. A F27 removeu o adaptador legado `src/components/explorer/HarmonicSpaceExplorer.tsx`; novos imports devem apontar diretamente para o domínio harmonizer.

`src/domains/writer/WriterScreen.tsx`

É a implementação canônica da tela Escrever. Ela instala o contexto do writer e delega a superfície de abas para componentes do domínio writer. A F27 removeu o adaptador legado `BuilderMVP`; novos imports devem apontar diretamente para o domínio writer.

`src/components/deprecated/DiatonicFieldOverlayPanel.tsx`

Removido na F27 por não possuir consumidores no app atual.

`src/domains/writer/components/WriterTabSurface.tsx`

Responsável por renderizar as abas internas da tela Escrever: fretboard, tradução/biblioteca, voicings alternativos e escalas compatíveis.

`src/domains/writer/context/WriterContext.tsx`

Responsável por expor o estado operacional da tela Escrever para fretboard, tradução/biblioteca e busca de voicings. A F27 removeu a pasta antiga `src/components/builder`.

`src/domains/writer/components/ScaleOverlayPanel.tsx`

Responsável pelos overlays de escala do Escrever. A F27 moveu esse painel para o domínio writer porque ele depende diretamente do acorde ativo no braço.

## Regra de Direção

```text
App
  ↓
domains/*
  ↓
components/*
  ↓
utils/music/*
```

A UI pode continuar usando componentes existentes por enquanto, mas novos fluxos de produto devem preferir entrar pelos domínios.

## Primeiro Serviço Extraído

`src/domains/harmonizer/services/harmonizerService.ts`

Responsável por:

- selecionar âncoras melódicas por seção;
- selecionar harmonias da seção ativa;
- criar a proposta de referência da partitura;
- criar propostas de rearmonização controlada;
- achatar uma proposta antes de aplicar em Escrever.

Isso remove lógica musical/estrutural da tela e deixa `HarmonizerScreen.tsx` mais próximo de uma camada de apresentação.

## Componentes de Domínio

`src/domains/harmonizer/components/HarmonizationProposalCard.tsx`

Responsável por renderizar uma proposta de harmonização/rearmonização e expor a ação de aplicar em Escrever. `HarmonizerScreen.tsx` decide quais propostas aparecem, mas não precisa mais conhecer a marcação interna de cada card.

`src/domains/harmonizer/components/HarmonizerHeader.tsx`

Responsável por renderizar o cabeçalho da tela Harmonizar: texto de contexto, centro detectado e botão de sincronização da partitura.

`src/domains/harmonizer/components/HarmonizerSectionSelector.tsx`

Responsável por renderizar a seleção de seções formais da partitura. O hook `useActiveSection` mantém a validade da seleção; este componente cuida apenas da apresentação e da ação de seleção.

`src/domains/harmonizer/components/HarmonizerProposalList.tsx`

Responsável por renderizar a lista de propostas, controlar a visualização colapsada/expandida e mostrar os estados vazios da tela.

`src/domains/harmonizer/components/MelodicAnchorLimitNotice.tsx`

Responsável por renderizar o aviso de limite de âncoras melódicas quando a seção ativa ultrapassa a fatia analisada por performance.

## Hooks de Domínio

`src/domains/harmonizer/hooks/useScoreSync.ts`

Responsável pelo fluxo de sincronização da partitura dentro do Harmonizar. A tela não deve assinar `musescoreAdapter` diretamente para controlar o botão de sync.

`src/store/useScoreSessionStore.ts`

Responsável por armazenar o snapshot de partitura vindo do MuseScore, as seções formais e o cursor. A F27 substituiu a nomenclatura antiga de sessão ontológica por sessão de partitura.

`src/domains/harmonizer/hooks/useActiveSection.ts`

Responsável por manter a seção ativa válida. Se a seção selecionada não existe mais, o hook seleciona a primeira seção disponível; se não há seções, limpa a seleção.

`src/domains/harmonizer/hooks/useHarmonizerProposals.ts`

Responsável por montar o pacote de propostas exibidas pela tela: âncoras melódicas, contexto de frase, referência harmônica da partitura, rearmonizações controladas e propostas geradas.

`src/domains/harmonizer/hooks/useApplyProposalToWriter.ts`

Responsável por aplicar uma proposta de harmonização no domínio Escrever, atualizando a progressão e navegando de volta para o writer quando solicitado.

## Nomenclatura Normalizada

A F27 também normalizou nomes internos que ainda carregavam fases antigas:

- `useOntologySessionStore` virou `useScoreSessionStore`;
- comandos de renderização ontológica foram removidos do protocolo da ponte MuseScore;
- `notationJazz` virou `notationInternational`, preservando a cifragem internacional (`Cmaj7`, `m7`, `7b9`) sem tratar isso como categoria de gênero.
- a análise funcional antiga baseada em `functionalClassifier`, `tonalCenter`, `modalTheory` e contratos `FunctionalAnalysis` foi removida; a tela Harmonizar usa `PhraseAnalysisEngine` e validadores de estratégia curados.

## Casca da Suíte

`src/domains/suite/SuiteShell.tsx`

Responsável pela casca oficial da aplicação: navegação entre Escrever/Harmonizar, cabeçalho, conteúdo ativo, ação de voltar para Escrever e rodapé. A F27 removeu o entrypoint legado `suite.html`/`SuiteApp.tsx`; `index.html` e `App.tsx` são a porta única da interface.

`src/domains/suite/useMuseScoreConnection.ts`

Responsável por conectar/desconectar o adapter do MuseScore e expor o estado da conexão.

`src/domains/suite/components/MuseScoreConnectionBadge.tsx`

Responsável por renderizar o estado visual da conexão. `App.tsx` não deve implementar essa lógica diretamente.

`src/domains/suite/components/SuiteHeader.tsx`

Responsável pelo cabeçalho da suíte: marca, subtítulo, conexão MuseScore e controles globais do instrumento.

`src/domains/suite/components/TuningSettings.tsx`

Responsável pelos controles globais de instrumento, afinação e estilo de cifragem. A F27 moveu esse componente para a casca da suíte.

`src/domains/suite/components/SuiteDomainSwitcher.tsx`

Responsável por renderizar a alternância entre Escrever e Harmonizar.

`src/domains/suite/components/SuiteDomainOutlet.tsx`

Responsável por renderizar o domínio ativo e expor a navegação de volta para Escrever quando uma proposta é aplicada a partir do Harmonizar.

`src/domains/suite/components/SuiteFooter.tsx`

Responsável pelo rodapé global da aplicação.

`src/domains/suite/components/StandardLayout.tsx`

Responsável pelo layout compartilhado das superfícies Escrever e Harmonizar. A F27 moveu essa peça para a suíte e eliminou o último arquivo remanescente em `src/components`.

## Componentes Legados Removidos

A F27 removeu componentes que não pertenciam mais às telas atuais Escrever/Harmonizar:

- `src/components/HarmonicNarrativeOverlayPanel.tsx`
- `src/components/VoiceLeadingPanel.tsx`
- `src/components/VoicingSelector.tsx`
- `src/components/Fretboard.tsx`
- `src/components/ChordList.tsx`
- `src/components/Header.tsx`
- `src/components/Explorer.tsx`
- `src/components/InspectorDashboard.tsx`
- `src/components/builder/*`
- `src/components/composer/HarmonicDiffView.tsx`
- `src/components/composer/MelodicAnchorInspector.tsx`
- `src/components/explainability/AttractorRadar.tsx`
- `src/components/explainability/DecisionTreeVisual.tsx`
- `src/components/explainability/ExplainabilityTimeline.tsx`
- `src/components/explainability/GlobalProgression.tsx`
- `src/components/explainability/HarmonicCounterfactual.tsx`
- `src/components/explainability/MusicalObservationsPanel.tsx`
- `src/components/explainability/RegionExplainabilityPanel.tsx`
- `src/App.css`
- `src/assets/hero.png`
- `src/assets/react.svg`
- `src/assets/vite.svg`
- `src/components/ui/StandardLayout.tsx` movido para `src/domains/suite/components/StandardLayout.tsx`
- scripts experimentais fora da régua `npm run test:curated`
- pacote legado de timeline/export/realização: `harmonyEngine`, `midi`, `musicxml`, `realization`, `runtime` e modelos exclusivos desse fluxo

## Pacotes Musicais Legados Removidos

A segunda etapa da F27 removeu ilhas técnicas que não alimentavam mais Escrever, Harmonizar ou a suíte curada de validação:

- análise narrativa/ontológica antiga: `analysis/narrative`, `analysis/regions`, `analysis/orchestrators`, `analysis/facade`
- laboratório científico/calibração/similaridade: `analysis/calibration`, `analysis/similarity`, `analysis/_experimental`
- inspector e diagnósticos antigos: `analysis/inspector`, `analysis/mutations`
- resolvedores históricos: `pathResolver`, `viterbi`, `cadenceDetector`, `modalAxisSolver`, `secondaryAnalysis`, `secondaryLeadingTone`, `chromaticAnalysis`
- geração ontológica/experimental: `generation/engines`, `generation/models`, `routeExplorerOrchestrator`, `shapeFinder`
- apresentação e voice-leading legados não usados pela UI atual: `music/presentation`, `music/voiceLeading`
- contratos DTO que só existiam para os pacotes removidos

O núcleo preservado em `utils/music` agora se concentra em:

- detecção/cifragem e voicings do braço;
- leitura e análise de partitura para Harmonizar;
- estratégias e validadores harmônicos curados;
- GravityField/HSMK e dependências diretas usadas nas propostas visíveis;
- ponte MuseScore ativa: conexão, sincronização de partitura e envio de acorde.

`src/components` não possui mais arquivos de produto. As superfícies visíveis estão concentradas em `src/domains`.

Essa fronteira é protegida por `scripts/suite-boundary.spec.ts`: a suíte curada falha se `src/components` voltar a existir ou se algum arquivo `src` importar da antiga camada genérica de componentes.

## Contratos Musicais Desacoplados

A F27 também separou contratos musicais do store React/Zustand:

- `src/utils/music/models/FretPosition.ts`
- `src/utils/music/models/ChordCandidate.ts`
- `src/utils/music/models/VoicingAcoustics.ts`
- `src/utils/music/models/InstrumentTuning.ts`

Com isso, analisadores, cifragem e voicings deixam de importar tipos de `useChordStore`. O store passa a consumir o núcleo musical, não a defini-lo.

O catálogo de instrumentos/afinações também saiu do store e passou para `InstrumentTuning.ts`, mantendo `useChordStore` focado em estado e ações da tela Escrever.

Wrappers sem comportamento próprio também foram removidos:

- `src/domains/suite/components/SuiteInstrumentSettings.tsx`
- `src/domains/writer/WriterWorkspace.tsx`
- `src/domains/harmonizer/HarmonizerWorkspace.tsx`

`SuiteDomainOutlet` renderiza diretamente as telas canônicas `WriterScreen` e `HarmonizerScreen`.

## Superfície Pública Reduzida

A F27 internalizou helpers que só eram usados no próprio arquivo:

- classificação CAGED interna do gerador de voicings;
- cálculo de distribuição acústica interno do scorer;
- penalidade de qualidade exótica interna do analisador de acordes;
- conversão de nota para frequência interna do sintetizador.

Também foram removidos exports/contratos que não tinham consumidor atual:

- wrapper `AnalyzedVoicing`;
- constante runtime `CageShape`;
- comandos antigos de sessão da ponte MuseScore;
- interface genérica `PluginTransport`;
- funções antigas de áudio para acorde/metrônomo.

A superfície de estado e de proposta também foi reduzida:

- `ReharmonizationProposal` não carrega mais contexto de frase nem motivos legados; a UI recebe somente medidas, baixo e explicação;
- `HarmonicPathway` mantém apenas pontuação total e perfil de tensão necessários para a realização atual;
- `HarmonicSeed` deixou de expor id/tipo/cadência e campos de baixo que não eram lidos pelo resolver;
- `NarrativeState` não guarda mais dados de evento sem leitura posterior, nem pressão de resolução não usada na pontuação;
- `useChordStore` não armazena mais `selectedVoicing`; carregar um voicing agora apenas atualiza o braço e recalcula acordes.
- helpers de estratégia, tipos locais do Writer e contratos internos do Harmonizar foram internalizados para reduzir imports possíveis fora dos domínios;
- o HSMK mantém apenas o contrato de função harmônica ainda usado pelo teste temporal;
- helpers sem consumidores em MIDI/enarmonia foram removidos ou internalizados;
- `qualityHelpers.ts` e `HarmonicWorld.ts` foram removidos por não terem consumidor no app nem na suíte curada.

## Próximas Fases

1. Isolar `GravityField`/HSMK atrás de interfaces de estratégia mais explícitas.
2. Extrair um `writerService` para timeline, voicing e envio de acorde.
3. Tornar a compressão visual de compassos no Harmonizar explícita na UI.

## Testes Curados

O comando oficial de regressão da suíte é:

```bash
npm run test:curated
```

Ele usa `vitest.curated.config.ts` e executa apenas specs que têm contrato Vitest real (`describe`/`it`) e protegem comportamento atual de produto.

Arquivos históricos em `scripts/` que imprimem resultado no console, dependem de módulos removidos, ou representam experimentos antigos não fazem parte dessa régua.
