# Arquitetura de Telas: Escrever & Harmonizar

O Find Chord Suite consolida sua experiência em dois domínios principais:

- **Escrever**: criação, captura e edição de acordes no braço virtual.
- **Harmonizar**: leitura de partitura, análise de harmonia existente, harmonização e rearmonização.

Ambos os domínios são montados pela casca da suíte (`App.tsx`) e compartilham a conexão com o MuseScore por meio de `src/domains/suite`.

## Casca da Suíte

`src/domains/suite/SuiteDomain.ts`

Define os ids oficiais das abas principais:

- `escrever`
- `harmonizar`

`src/domains/suite/SuiteShell.tsx`

Centraliza a navegação principal, o cabeçalho, a área de conteúdo ativo e o rodapé. `App.tsx` apenas monta essa casca.

`src/domains/suite/useMuseScoreConnection.ts`

Centraliza o ciclo de conexão com o MuseScore.

`src/domains/suite/components/MuseScoreConnectionBadge.tsx`

Renderiza o estado visual da conexão.

`src/domains/suite/components/SuiteHeader.tsx`

Renderiza a marca, subtítulo, conexão MuseScore e controles globais do instrumento.

`src/domains/suite/components/TuningSettings.tsx`

Monta os controles globais de instrumento, afinação e estilo de cifragem.

`src/domains/suite/components/SuiteDomainSwitcher.tsx`

Renderiza os botões de alternância entre **Escrever** e **Harmonizar**.

`src/domains/suite/components/SuiteDomainOutlet.tsx`

Renderiza o domínio ativo e conecta a navegação do Harmonizar de volta para Escrever.

`src/domains/suite/components/SuiteFooter.tsx`

Renderiza o rodapé global da aplicação.

`src/domains/suite/components/StandardLayout.tsx`

Renderiza o layout compartilhado usado pelas superfícies **Escrever** e **Harmonizar**. A aplicação não mantém mais componentes de produto em `src/components`.

## Escrever

`src/domains/writer/WriterScreen.tsx`

Tela canônica do domínio Escrever. Instala o `WriterProvider` e delega a superfície visual para `WriterTabSurface`.

`src/domains/writer/components/WriterTabSurface.tsx`

Renderiza as quatro abas internas:

- **Captura & Fretboard**: braço virtual e captura de shapes.
- **Teoria & Biblioteca**: tradução do shape em cifra, intervalos e estrutura.
- **Shapes Alternativos**: busca de voicings alternativos.
- **Escalas Compatíveis**: overlays de escala no braço.

`src/domains/writer/context/WriterContext.tsx`

Expõe estado e ações internas da tela Escrever para o braço, a tradução/biblioteca, a busca de voicings e os overlays de escala.

## Harmonizar

`src/domains/harmonizer/HarmonizerScreen.tsx`

Tela canônica do domínio Harmonizar. Coordena sincronização, seção ativa, propostas e aplicação em Escrever.

`src/store/useScoreSessionStore.ts`

Guarda a partitura sincronizada do MuseScore, as seções formais disponíveis e o cursor atual.

### Componentes

`src/domains/harmonizer/components/HarmonizerHeader.tsx`

Renderiza contexto, centro detectado e botão de sincronização da partitura.

`src/domains/harmonizer/components/HarmonizerSectionSelector.tsx`

Renderiza a seleção de seções formais importadas ou inferidas.

`src/domains/harmonizer/components/MelodicAnchorLimitNotice.tsx`

Exibe o aviso de limite de âncoras melódicas por performance.

`src/domains/harmonizer/components/HarmonizerProposalList.tsx`

Renderiza estados vazios, lista colapsada/expandida e controles de visualização.

`src/domains/harmonizer/components/HarmonizationProposalCard.tsx`

Renderiza cada proposta: referência harmônica, harmonização ou rearmonização.

### Hooks

`src/domains/harmonizer/hooks/useScoreSync.ts`

Controla a sincronização da partitura com o MuseScore.

`src/domains/harmonizer/hooks/useActiveSection.ts`

Mantém a seção ativa válida.

`src/domains/harmonizer/hooks/useHarmonizerProposals.ts`

Monta o pacote de propostas exibidas na tela.

`src/domains/harmonizer/hooks/useApplyProposalToWriter.ts`

Aplica uma proposta no domínio Escrever.

### Serviço

`src/domains/harmonizer/services/harmonizerService.ts`

Agrupa lógica de seleção de âncoras, harmonias por seção, referência da partitura, rearmonizações controladas e conversão de proposta em progressão.

## Regra de Direção

```text
App
  ↓
domains/*
  ↓
utils/music/*
```

Novos fluxos de produto devem entrar pelos domínios. A pasta `src/components` foi eliminada da superfície atual; componentes compartilhados da suíte vivem em `src/domains/suite/components`.

Essa regra é validada por `scripts/suite-boundary.spec.ts`, executado em `npm run test:curated`.

## Contratos Musicais

Tipos musicais compartilhados vivem em `src/utils/music/models`. O store da tela Escrever consome esses contratos, mas analisadores e teoria musical não importam mais de `useChordStore`.

O catálogo de instrumentos e presets de afinação também vive em `src/utils/music/models/InstrumentTuning.ts`, não no store.
