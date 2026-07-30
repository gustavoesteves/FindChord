# F360 — Roadmap de improvisação em duas superfícies

**Status:** em andamento
**Base auditada:** `baaace5`
**Data da linha de base:** 30/07/2026

## Objetivo

Evoluir a camada de improvisação sem confundir as duas perguntas musicais que o
produto responde:

- **Escrever:** o que pode ser explorado sobre o acorde atualmente desenhado no
  fretboard?
- **Harmonizar:** o que pode ser tocado através da harmonia lida da partitura ou
  deduzida a partir da melodia?

O épico deve transformar materiais já disponíveis em ideias mais musicais,
tocáveis e explicáveis. O foco deixa de ser aumentar listas de escalas e passa a
ser:

- preservar integralmente a cifra e seus graus;
- representar células com semântica explícita;
- desenvolver motivo, ritmo, contorno e registro;
- ouvir tensão e repouso contra uma referência harmônica;
- usar melodia, timeline e acorde seguinte somente quando o contexto realmente
  existe;
- validar o vocabulário por casos musicais e repertório.

Este documento é um roadmap. Cada fatia `F360.x` deve ganhar seu próprio arquivo
quando entrar em implementação.

## Invariante arquitetural

### Escrever: acorde isolado / vamp local

A exploração de materiais do `Escrever` recebe exclusivamente:

- o acorde detectado no shape;
- as notas efetivamente desenhadas;
- a fórmula estrutural da cifra;
- afinação e posições no braço;
- a intenção local escolhida pelo usuário;
- a célula, transformação, ritmo e realização selecionados.

O domínio `Escrever` pode armazenar `progressionItems`, acordes e timings para
edição e handoff de uma proposta aplicada. Esse estado **não entra** no
orquestrador de `Materiais do acorde`.

A exploração local **não recebe e não deve inferir**:

- acorde anterior;
- próximo acorde;
- centro tonal da música;
- melodia da partitura;
- função dentro de uma progressão;
- alvo de resolução funcional;
- duração real do acorde na partitura.

Nesse domínio, `resolver`, `voltar` ou `repousar` significam retornar a um apoio
do **mesmo acorde**. A referência auditiva é um vamp do shape atual.

Fluxo pretendido:

```text
shape/acorde
  -> rota local
  -> material
  -> célula
  -> transformação motívica
  -> ritmo local
  -> realização no braço
  -> escuta sobre o mesmo acorde
  -> rascunho local
```

### Harmonizar: melodia + progressão + tempo + contexto

O `Harmonizar` conhece, conforme o modo de entrada:

- harmonia escrita na partitura ou proposta deduzida;
- acorde anterior, histórico e acorde seguinte;
- melodia e sua janela temporal;
- centro tonal e função local;
- compasso, beat, ticks e duração;
- alvo harmônico e notas-guia;
- proposta/variante que está sendo avaliada.

Somente esse domínio pode afirmar condução para o próximo acorde ou construir
uma frase horizontal sobre vários eventos.

Fluxo pretendido:

```text
melodia + timeline + harmonia avaliada
  -> material contextual
  -> célula ranqueada
  -> notas-guia e alvo
  -> conexão entre eventos
  -> frase temporal
  -> escuta sobre a progressão
  -> plano contextual salvo
```

### Regra de dependência

A direção continua:

```text
App
  -> domains/*
  -> utils/music/*
```

Podem ser compartilhados:

- identidade harmônica exata;
- papéis intervalares;
- contrato de célula;
- contrato simbólico de frase em beats;
- transformações puras;
- primitivas de áudio e transporte;
- vocabulários e proveniência.

No contrato compartilhado, `beat` significa sempre **uma semínima**:
`onsetBeats = 1` equivale a um quarto de nota. A pulsação percebida de uma
métrica composta é modelada separadamente; em 6/8, por exemplo, uma semínima
pontuada corresponde a `1.5` beats do contrato. Essa unidade canônica impede
que `Escrever` e `Harmonizar` atribuam durações diferentes ao mesmo objeto.

Não podem ser compartilhados como se fossem o mesmo serviço:

- ranking local e ranking contextual;
- estado de seleção do `Escrever` e do `Harmonizar`;
- retorno local e chegada ao acorde seguinte;
- playback de vamp e playback de progressão;
- rascunho local e plano contextual.

O catálogo local só entra no `Harmonizar` depois do adaptador contextual,
conforme as decisões de
[`F304`](./f304-writer-local-vamp-materials.md) e
[`F326`](./f326-shared-vamp-catalog-contextual-materials.md).

Neste documento, `Escrever` e `Harmonizar` nomeiam as superfícies de produto.
`Writer` e `Harmonizer` ficam reservados a tipos, módulos e paths do código.

## Estado atual confirmado

Na linha de base auditada:

- as 33 qualidades da DSL do `Escrever` possuem ao menos um núcleo local;
- existem 188 ocorrências qualidade-candidato;
- 143 possuem `melodicMaterials`;
- 45 ainda chegam sem célula estruturada;
- existem 402 células/gestos no conjunto atual;
- o `Escrever` possui as rotas `inside`, `color`, `tension` e `outside`;
- o `Escrever` realiza uma célula perto do shape, desenha o caminho e reproduz a
  linha;
- o `Escrever` possui três arquétipos rítmicos fixos em milissegundos;
- o `Harmonizar` já passa acorde anterior, histórico, próximo acorde, centro,
  melodia e alvo para `buildContextualMaterialCandidates`;
- `SectionMaterialSuggestion` suporta `eventId`, `beat`, `tickStart`,
  `tickEnd` e `durationTicks`, mas hoje somente o caminho de propostas preenche
  integralmente esses dados; o caminho da harmonia de referência ainda os
  perde;
- `SectionLinearRoute` ainda agrega fragmentos textuais; não é uma frase
  temporal;
- o painel contextual ainda escolhe implicitamente
  `candidate.melodicMaterials[0]`;
- não há playback de progressão nem persistência de planos de improvisação no
  `Harmonizar`.

Baseline de regressão executada durante a auditoria:

```text
21 specs focadas
283 testes aprovados
```

## Problemas que motivam o roadmap

### Integridade musical

- cifras compostas aceitas pelo resolvedor são reduzidas antes de chegar ao
  catálogo de materiais;
- `#9`, `#11` e `b13` podem receber nomes enarmônicos inadequados e linguagem
  de apoio estável;
- uma célula que contém apenas notas escritas na cifra pode ser classificada
  como `support`, mesmo quando a cifra escreveu uma alteração tensional;
- o ranking contextual pode apresentar a mesma nota em `Tensões` e `Evitar`;
- o ranking contextual avalia a coleção da fonte, mas não a célula que a UI
  apresenta.

### Produto

- 45 candidatos ainda usam coleção de notas como substituto de uma ideia;
- célula, ação, mapa e explicação nem sempre compartilham uma identidade única;
- o `Escrever` demonstra uma célula, mas ainda não a desenvolve como motivo;
- o ritmo local é um preset de áudio, não um contrato musical;
- tensão e outside são ouvidos sem o acorde de referência;
- os caminhos contextuais do `Harmonizar` ainda são strings agregadas, sem onset,
  duração ou vínculo forte ao evento harmônico;
- nenhuma das superfícies permite guardar uma descoberta de improvisação em um
  contrato próprio.

## Fora de escopo do épico

- fornecer contexto de progressão ao painel de materiais do `Escrever`;
- inferir no `Escrever` para onde a música irá;
- transformar o `Escrever` em uma versão reduzida do `Harmonizar`;
- gerar um solo completo ou substituir decisão artística;
- entrada por microfone, MIDI ou avaliação automática da execução;
- busca combinatória ilimitada no thread principal;
- inserir uma frase melódica no MuseScore.

A inserção de frase no MuseScore exige outro épico. O protocolo atual cobre
`INSERT_CHORD`; notas exigiriam contrato de staff/voice/tick/duração, nova ação
de bridge/QML, ACK, idempotência, retry e validação no MuseScore real.

## Sequência resumida

| Fatia | Superfície | Entrega | Depende de |
|---|---|---|---|
| F360.1 | Compartilhada | Identidade harmônica e papéis exatos | concluida |
| F360.2 | Compartilhada | Célula estruturada e semântica por gesto | entregue como contrato inicial |
| F360.3 | Escrever | Remoção de pseudoideias sem célula | iniciado |
| F360.4 | Escrever | Identidade única entre gesto, ação e mapa | F360.2, F360.3 |
| F360.5 | Escrever | Ritmo local simbólico em beats | F360.2 |
| F360.6 | Escrever | Desenvolvimento motívico sobre vamp | F360.4, F360.5 |
| F360.7 | Escrever | Playback harmônico e alternativas físicas | F360.6 |
| F360.8 | Escrever | Rascunhos locais versionados | F360.6 |
| F360.9 | Harmonizar | Coerência entre tensão, passagem e avoid | F360.1 |
| F360.10 | Harmonizar | Ranking material-first e cell-first | F360.2, F360.9 |
| F360.11 | Harmonizar | Evidência temporal e melódica por evento | F360.10 |
| F360.12 | Harmonizar | Frase contextual entre acordes | F360.11 |
| F360.13a | Harmonizar | Seleção e plano contextual de sessão | F360.12 |
| F360.13b | Harmonizar | Playback sincronizado da progressão | F360.12, F360.13a |
| F360.14.x | Compartilhada | Vocabulário linear e packs idiomáticos | F360.6, F360.7, F360.12, F360.13b |
| F360.15 | Compartilhada | Auditoria musical e fechamento | F360.8, F360.13a, F360.13b, F360.14.1, F360.14.3 |

Após F360.2, as trilhas do `Escrever` e do `Harmonizar` podem avançar em
paralelo.

---

## F360.1 — Identidade harmônica e papéis exatos

**Superfície:** compartilhada
**Tamanho:** L
**Prioridade:** bloqueadora

### Objetivo

Preservar a cifra aceita pelo resolvedor até a classificação das notas,
materiais e células, sem reconstruí-la apenas a partir de uma qualidade
reduzida.

### Escopo técnico

- Criar uma projeção harmônica imutável para materiais, sem introduzir um
  terceiro parser/canonicalizador.
- Criar dois adapters explícitos:
  - `materialChordIdentityFromResolvedSymbol(ResolvedChordSymbol)`, usado pelo
    `Harmonizar`;
  - `materialChordIdentityFromChordCandidate(ChordCandidate)`, usado pelo
    `Escrever`.
- O adapter do `Escrever` não faz round-trip pelo `ChordSymbolResolver`.
- A projeção deve preservar:
  - origem estrutural `symbol` ou `shape`;
  - proveniência opcional `score-written`, `harmonizer-inferred`,
    `harmonizer-proposal` ou `shape-inferred`;
  - símbolo bruto opcional e símbolo normalizado;
  - raiz e baixo;
  - qualidade base;
  - notas estruturais;
  - notas efetivamente soando no shape;
  - intervalos/graus escritos;
  - tensões, adições e omissões;
  - confiança e evidência disponíveis na origem;
  - grafia e aliases relevantes.
- `rawSymbol`, display e aliases são proveniência, não participam sozinhos da
  igualdade musical.
- Fazer o catálogo receber a identidade completa, mantendo a qualidade reduzida
  apenas como índice de família.
- Separar:
  - apoio estrutural;
  - tensão escrita;
  - cor disponível;
  - nota de passagem;
  - alteração do voicing.
- Entregar uma semântica pura `acorde + fonte/material + grau -> papel` e
  remover inferência de `characteristic` por substring de nomes como `lydian`
  ou `dorian`. F360.2 incorporará esses papéis aos eventos estruturados.
- Tornar a classificação de nota dependente do acorde e do grau escrito, não
  apenas da distância em pitch class.
- Preservar compatibilidade com shapes incompletos por meio da distinção entre
  `soundingNotes` e `structuralNotes`.

### Arquivos e símbolos prováveis

- `src/utils/music/theory/ChordSymbolResolver.ts`
- `src/utils/music/theory/contextualMaterialChordContext.ts`
  - `resolveMaterialChordQuality`
- `src/utils/music/models/ChordCandidate.ts`
- `src/utils/music/theory/localChordVampMaterialCatalog.ts`
  - `LocalChordVampMaterialCatalogEntry.build`
  - `candidateBase`
  - `chordToneCoreCandidate`
  - `writtenAlteredDominantResolutionCandidate`
- `src/utils/music/theory/localChordVampMaterials.ts`
  - `buildLocalChordVampMaterialCandidates`
- `src/utils/music/theory/localMaterialNoteRoles.ts`
  - `classifyLocalMaterialNote`
- `src/utils/music/theory/localMaterialFretboardNotes.ts`
  - `buildLocalMaterialFretboardNote`
- `src/domains/writer/services/writerMaterialImprovisationMoves.ts`
  - `moveKind`
- `src/domains/writer/services/writerMaterialScreenModel.ts`
  - `buildWriterMaterialScreenModel`

Novo módulo puro sugerido:

- `src/utils/music/theory/materialChordIdentity.ts`

### Casos musicais obrigatórios

| Origem | Caso | Comportamento esperado |
|---|---|---|
| Símbolo escrito / Harmonizar | `C7(#9,b13)` | preservar `#9` e `b13` |
| Símbolo escrito / Harmonizar | `C13(b9,#11)` | preservar `b9`, `#11` e `13` |
| Símbolo escrito / Harmonizar | `Cm6/9` | preservar `6` e `9` |
| Shape inferido / Escrever | `quality=dominant7#9`, tensão `#9` e D#/Eb soando | rotular funcionalmente como `#9` |
| Shape inferido / Escrever | `quality=dominant7#11`, tensão `#11` e F# soando | rotular como `#11` |
| Shape inferido / Escrever | `quality=dominant7b13`, tensão `b13` e Ab/G# soando | rotular funcionalmente como `b13` |
| Ambas | `Caug` / `quality=augmented` | `#5` continua estrutural |
| Ambas | `C7b5` / `quality=dominant7b5` | `b5` continua alteração estrutural |
| Ambas | `Csus4` / `quality=sus4` | `4` continua suspensão estrutural |
| Shape inferido / Escrever | `ChordCandidate` maj7 com `omissions: ["5"]` | quinta estrutural omitida não vira cor externa |

### Critérios de aceitação

- entrada `origin=symbol` preserva todos os graus reconhecidos pelo resolvedor;
- entrada `origin=shape` preserva estrutura interpretada, notas soando,
  omissões, adições, tensões e confiança, sem alegar que o grau foi escrito;
- `#9`, `#11` e `b13` não recebem tooltip de ponto estável;
- uma célula de alteração escrita não vira `support` apenas por estar contida
  nas notas resolvidas da cifra;
- a UI mantém grafia coerente com a cifra sempre que o resolvedor a conhece;
- acorde estrutural e shape soando ficam disponíveis simultaneamente, sem
  sobrescrever um ao outro;
- cifras simples preservam o comportamento atual.

### Validação

- ampliar:
  - `scripts/chord-symbol-resolver.spec.ts`;
  - `scripts/contextual-material-chord-context.spec.ts`;
  - `scripts/local-material-note-roles.spec.ts`;
  - `scripts/local-material-fretboard-notes.spec.ts`;
  - `scripts/writer-material-improvisation-moves.spec.ts`;
  - `scripts/local-chord-vamp-materials.spec.ts`;
- criar `scripts/material-chord-integrity.spec.ts`;
- adicionar a nova spec a `vitest.curated.config.ts`;
- executar `npm run lint` e `npm run build`.

---

## F360.2 — Célula estruturada e semântica por gesto

**Superfície:** compartilhada
**Tamanho:** L
**Depende de:** F360.1
**Status:** entregue como contrato inicial em
[`f360-2-melodic-cell-contract.md`](./f360-2-melodic-cell-contract.md)

### Objetivo

Substituir a semântica implícita de `cells: string[]` por uma identidade estável
e metadados no nível de cada gesto.

### Escopo técnico

Adicionar ID estável também a `ContextualMelodicMaterial` e introduzir um
contrato de célula cuja fonte canônica sejam eventos estruturados, não arrays
paralelos ou a string de notação:

```ts
interface MelodicCellEvent {
  note: string;
  intervalDegree: string;
  harmonicRole: "support" | "color" | "tension" | "outside";
  gestureRole: "cell" | "return";
}

interface BaseMelodicCell {
  id: string;
  events: MelodicCellEvent[];
  intent: "inside" | "functional" | "tension" | "outside";
  direction: "ascending" | "descending" | "mixed" | "static";
  contour: "original" | "ascending" | "descending" | "arch";
  resolutionScope: "none" | "local-return";
  localReturnDegrees: string[];
  preferredRhythmArchetype?: ContextualMaterialRhythmArchetype;
}

interface ContextualCellSelection {
  cell: BaseMelodicCell;
  resolutionScope: "contextual-arrival";
  targetEventId: string;
  targetDegrees: string[];
}
```

O desenho final pode ajustar nomes, mas deve preservar:

- ID estável para material e célula, independente de índice e label;
- intenção no nível da célula;
- eventos e papéis por nota/grau;
- direção e contorno pretendidos;
- necessidade de retorno;
- escopo da resolução.

O catálogo compartilhado declara apenas `BaseMelodicCell`, portanto o
`Escrever` não consegue representar uma chegada contextual nem mesmo em
compile-time. O adaptador do `Harmonizar` é quem cria
`ContextualCellSelection` depois de conhecer o evento-alvo.

Nesta fatia também deve nascer o contrato simbólico mínimo compartilhado de
frase em `src/utils/music/models/ImprovisationPhrase.ts`. Ele representa eventos
em beats de semínima e sua proveniência; F360.5 acrescenta a política rítmica local e
F360.12 cria o wrapper absoluto em ticks. Assim, nenhuma trilha passa a depender
do modelo da outra.

### Arquivos e símbolos prováveis

- `src/utils/music/theory/contextualMaterialTypes.ts`
  - `ContextualMelodicMaterial`
- `src/utils/music/theory/contextualMelodicMaterials.ts`
- `src/utils/music/theory/localChordVampMaterialCatalog.ts`
- `src/domains/writer/services/writerMaterialImprovisationMoves.ts`
- `src/domains/writer/services/writerMaterialCellRealization.ts`

Novo modelo sugerido:

- `src/utils/music/models/MelodicCell.ts`
- `src/utils/music/models/ImprovisationPhrase.ts`

### Critérios de aceitação

- a primeira pentatônica interna de um side-slip não é rotulada como outside;
- células internas e externas do mesmo material podem ter intenções diferentes;
- a célula reversa do núcleo carrega direção descendente explícita;
- cada material e célula possuem IDs determinísticos;
- `preferredCellId` fica disponível e `preferredCellIndex` é marcado como
  legado;
- o `Escrever` não recebe células com `contextual-arrival`;
- o contrato oferece identidade suficiente para os consumidores abandonarem
  `[0]`; o adaptador legado permanece temporariamente;
- material e célula continuam serializáveis e testáveis sem React.

### Migração

- oferecer adaptador temporário de `string[]` para células estruturadas;
- migrar o catálogo por famílias;
- remover `preferredCellIndex`, o adapter e os consumers por posição somente
  quando F360.3 e F360.10 estiverem concluídas;
- não persistir IDs baseados em índice durante a transição.

### Validação

- ampliar:
  - `scripts/contextual-melodic-materials.spec.ts`;
  - `scripts/local-chord-vamp-material-catalog.spec.ts`;
  - `scripts/writer-material-improvisation-moves.spec.ts`;
  - `scripts/writer-material-cell-realization.spec.ts`;
- criar `scripts/melodic-cell-contract.spec.ts`;
- testar unicidade de IDs e intenções por célula;
- executar `npm run lint` e `npm run build`.

---

## F360.3 — Escrever sem pseudoideias escalares

**Superfície:** Escrever
**Tamanho:** M
**Depende de:** F360.2
**Status:** iniciado em
[`f360-3-writer-playable-ideas.md`](./f360-3-writer-playable-ideas.md)

### Objetivo

Garantir que toda opção apresentada como ideia tocável possua célula curada e
rastreável. A realização física pode ficar indisponível para um shape
específico, mas essa indisponibilidade precisa ser explícita.

### Escopo técnico

- Remover os fallbacks que usam `source.notes` como se fossem uma frase.
- Separar claramente:
  - `Ideia`: possui célula estruturada e ação;
  - `Mapa`: fonte de notas disponível como referência;
  - `Indisponível`: célula conhecida, mas não realizável no contexto físico
    atual.
- Curar as fontes prioritárias entre as 45 ocorrências sem célula.
- Rebaixar as demais para o mapa de apoio até receberem vocabulário real.
- Deduplicar células pela sequência ordenada de graus/pitch classes, direção e
  `resolutionScope`; não usar apenas conjunto de notas, para não colapsar uma
  célula reversa ou um retorno dirigido.
- Impedir que mixolídio seja apresentado como leitura interna completa de uma
  dominante alterada se não preservar a alteração escrita.

### Arquivos e símbolos prováveis

- `src/utils/music/theory/localChordMaterials.ts`
  - `buildLocalChordMaterialReadings`
- `src/domains/writer/services/writerMaterialPalette.ts`
  - `buildWriterMaterialPalette`
- `src/domains/writer/services/writerActiveMaterialPanel.ts`
  - `playableShapeMaterialLine`
  - `buildWriterActiveMaterialPanel`
- `src/domains/writer/services/writerMaterialAction.ts`
  - `buildWriterMaterialAction`
- `src/utils/music/theory/localMaterialPresentation.ts`
  - `suggestedLineForLocalMaterial`
  - `notesForLocalMaterialLine`
- `src/utils/music/theory/localChordVampMaterialCatalog.ts`
- `src/domains/writer/components/WriterMaterialEmptyStates.tsx`

### Critérios de aceitação

- 100% dos itens de `routedMaterialPalette` possuem ao menos uma célula;
- 100% das ações tocáveis referenciam uma célula e uma realização;
- nenhuma ação usa `focusedSource.notes` como fallback;
- as 33 qualidades continuam com ao menos uma ideia tocável;
- fonte sem célula pode aparecer em `Mapa`, mas não com botão `Ouvir ideia`;
- falha de realização produz estado explícito, sem trocar silenciosamente por
  outra linha;
- o relatório de cobertura distingue `ideia estruturada` de `mapa disponível`.

### Validação

- inverter/remover as expectativas de fallback em:
  - `scripts/writer-material-palette.spec.ts`;
  - `scripts/writer-material-action.spec.ts`;
- ampliar:
  - `scripts/writer-active-material-panel.spec.ts`;
  - `scripts/writer-material-screen-model.spec.ts`;
  - `scripts/local-chord-vamp-material-catalog.spec.ts`;
  - `scripts/melodic-materials-audit.spec.ts`;
- adicionar qualquer spec nova desta fatia a `vitest.curated.config.ts`;
- gate quantitativo: zero pseudoideias tocáveis sem célula;
- executar `npm run lint` e `npm run build`.

---

## F360.4 — Identidade única entre gesto, ação e mapa

**Superfície:** Escrever
**Tamanho:** M
**Depende de:** F360.2, F360.3

### Objetivo

Fazer célula selecionada, explicação, caminho numerado, playback e mapa do braço
representarem sempre a mesma decisão.

### Escopo técnico

- Expor no screen model um `focusedCell` estável.
- Fazer todos os consumidores receberem a mesma identidade:
  - material;
  - célula;
  - notação;
  - intenção;
  - realização;
  - ritmo.
- Atualizar o mapa para:
  - continuar mostrando o braço inteiro;
  - destacar fortemente a célula selecionada;
  - manter as demais notas do material como contexto secundário;
  - não transformar todas as células do side-slip em um mapa cromático de igual
    importância.
- Consumir os papéis semânticos produzidos por F360.1; esta fatia não deve
  recalculá-los na apresentação.
- Transformar a janela de shape em metadado de ênfase/região sugerida, não em
  filtro de visibilidade.
- Cancelar playback e limpar apenas identidades realmente inválidas ao trocar
  acorde, shape, rota ou fonte.

### Arquivos e símbolos prováveis

- `src/domains/writer/services/writerMaterialScreenModel.ts`
- `src/domains/writer/services/writerMaterialImprovisationMoves.ts`
- `src/domains/writer/services/writerMaterialCellRealization.ts`
- `src/domains/writer/services/writerMaterialFretboardView.ts`
  - `isFretVisibleInWindow`
- `src/domains/writer/services/writerMaterialFretWindow.ts`
- `src/domains/writer/components/WriterMaterialPanel.tsx`
- `src/domains/writer/components/WriterMaterialActionBlock.tsx`
- `src/domains/writer/components/WriterMaterialFretboardPanel.tsx`
- `src/domains/writer/components/WriterMaterialInsightPanel.tsx`

### Critérios de aceitação

- selecionar qualquer gesto atualiza simultaneamente título, notação,
  explicação, passos, números no braço e playback;
- nenhuma superfície mantém a célula anterior;
- o mapa mostra de 0 até `geometry.fretCount` — atualmente 24 — sem recorte por
  shape;
- a célula ativa é distinguível das notas de apoio sem ocultar o braço completo;
- side-slip evidencia a pentatônica selecionada, não todas as 12 classes como
  equivalentes;
- troca de shape cancela áudio e invalida a realização física; `focusedCell`
  permanece selecionada quando ainda pertence ao mesmo acorde/material;
- IDs permanecem determinísticos após reordenação visual.

### Validação

- ampliar:
  - `scripts/writer-material-screen-model.spec.ts`;
  - `scripts/writer-material-cell-realization.spec.ts`;
  - `scripts/writer-material-fretboard-view.spec.ts`;
  - `scripts/writer-material-action-block.spec.ts`;
- inverter a regressão atual que limita o mapa à janela do shape;
- adicionar teste de render estático do insight da célula ativa;
- adicionar regressão do side-slip;
- adicionar qualquer spec nova desta fatia a `vitest.curated.config.ts`;
- executar `npm run lint` e `npm run build`.

---

## F360.5 — Ritmo local simbólico em beats

**Superfície:** Escrever
**Tamanho:** M
**Depende de:** F360.2

### Objetivo

Transformar ritmo de preset fixo de áudio em uma decisão musical local,
independente da timeline da partitura.

### Escopo técnico

- Trocar o contrato interno de `onsetMs/durationMs` por
  `onsetBeats/durationBeats`.
- Manter frase e ação musicais em beats de semínima; o BPM local também é
  semínimas por minuto.
- Criar uma borda explícita
  `writerMaterialPlaybackPlan.ts::materialPhraseToPlaybackSteps`, que converte
  beats + BPM no DTO de transporte em milissegundos.
- O playback controller continua consumindo DTO temporal; ele não passa a
  conhecer semântica musical ou BPM.
- Manter os três arquétipos atuais como primeira família:
  - pulso reto;
  - síncope curta;
  - espaço e resposta.
- Tornar a escolha explícita para o usuário.
- Adicionar BPM local validado e duração de ciclo local.
- Preservar a preferência curada como default, nunca como trava.
- Não importar métrica ou duração da partitura para o `Escrever`.

### Arquivos e símbolos prováveis

- `src/domains/writer/services/writerMaterialRhythm.ts`
  - `WriterMaterialRhythmPlan`
  - `buildWriterMaterialRhythm`
- `src/domains/writer/services/writerMaterialAction.ts`
- `src/domains/writer/services/writerMaterialPlaybackController.ts`
- novo `src/domains/writer/services/writerMaterialPlaybackPlan.ts`
- `src/domains/writer/components/WriterMaterialActionBlock.tsx`
- `src/domains/writer/components/WriterMaterialPanel.tsx`

O modelo simbólico compartilhado vem de F360.2; esta fatia define somente a
política local e sua projeção de transporte.

### Critérios de aceitação

- mudar BPM não altera notas, papéis ou ordem;
- escolha do usuário prevalece sobre o arquétipo preferido;
- todos os eventos cabem no ciclo declarado;
- zero passos produz duração zero;
- BPM inválido é rejeitado ou limitado de forma explícita;
- trocar ritmo ou BPM durante playback cancela o ciclo anterior;
- os testes não dependem de relógio real.

### Validação

- ampliar:
  - `scripts/writer-material-rhythm.spec.ts`;
  - `scripts/writer-material-action.spec.ts`;
  - `scripts/writer-material-playback-controller.spec.ts`;
  - `scripts/writer-material-action-block.spec.ts`;
- criar regressões de equivalência musical em BPMs diferentes;
- executar `npm run lint` e `npm run build`.

---

## F360.6 — Desenvolvimento motívico local sobre vamp

**Superfície:** Escrever
**Tamanho:** L
**Depende de:** F360.4, F360.5

### Objetivo

Transformar uma célula correta em poucas variações composicionais sobre o mesmo
acorde, sem inventar contexto funcional.

### Primeira família de operações

- **Afirmar:** célula original;
- **Repetir e variar:** repetição com final ou acento alternativo;
- **Sequenciar:** transportar o desenho dentro da fonte permitida;
- **Deslocar:** preservar alturas e mudar posição rítmica;
- **Pergunta e resposta:** repetir/variar e retornar ao acorde atual;
- **Tensionar e voltar:** usar tensão ou outside declarado e repousar localmente.

### Contorno e registro

- contorno original;
- ascendente;
- descendente;
- arco;
- perto do shape;
- região abaixo;
- região acima.

O braço completo continua visível. Registro altera a realização escolhida, não
o enquadramento do mapa.

### Arquivos e módulos sugeridos

- `src/domains/writer/services/writerMaterialPhrase.ts`
- `src/domains/writer/services/writerMaterialPhraseTransformations.ts`
- `src/domains/writer/services/writerMaterialPhraseRealization.ts`
- integração com:
  - `writerMaterialCellRealization.ts`;
  - `writerMaterialScreenModel.ts`;
  - `WriterMaterialActionBlock.tsx`;
  - `WriterMaterialFretboardPanel.tsx`.

### Guardrails

- transformações devem ser determinísticas;
- `Afirmar` preserva a célula exata;
- `Sequenciar` pode trocar notas, mas preserva o padrão dentro da coleção
  autorizada;
- qualquer auxiliar cromática precisa estar declarada pelo gesto; nota fora
  desse envelope exige intenção outside explícita;
- retorno local deve terminar em apoio do acorde atual;
- nenhuma copy pode mencionar próximo acorde, centro ou função na música;
- impossibilidade de realização deve retornar resultado tipado, nunca fallback
  silencioso;
- esta fatia gera uma realização por `registerPreference`; F360.7 é responsável
  por expor e comparar realizações físicas alternativas;
- limitar o MVP a no máximo quatro variantes deduplicadas por célula para evitar
  busca combinatória no render.

### Critérios de aceitação

- a assinatura motívica — sequência de intervalos direcionais e padrão rítmico
  normalizado — permanece rastreável, exceto no final alternativo explicitamente
  marcado;
- uma célula descendente realiza contorno descendente de fato;
- sequência respeita a coleção autorizada;
- variante `voltar` termina em apoio local;
- preferência de registro sem caminho retorna motivo tipado
  `register-unavailable`;
- resultados iguais são deduplicados;
- o usuário consegue comparar no máximo três ou quatro variantes claras, sem
  uma lista explosiva.

### Validação

- criar:
  - `scripts/writer-material-phrase-transformations.spec.ts`;
  - `scripts/writer-material-phrase-realization.spec.ts`;
- adicionar as novas specs a `vitest.curated.config.ts`;
- ampliar:
  - `scripts/writer-material-cell-realization.spec.ts`;
  - `scripts/writer-material-screen-model.spec.ts`;
  - `scripts/writer-material-fretboard-view.spec.ts`;
- usar tabelas para maior, menor, dominante natural, dominante alterado, sus,
  diminuto e outside;
- executar `npm run lint` e `npm run build`.

---

## F360.7 — Playback harmônico e alternativas físicas

**Superfície:** Escrever
**Tamanho:** L
**Depende de:** F360.6

### Objetivo

Permitir que o compositor ouça apoio, cor, tensão e outside contra o acorde
desenhado, além de comparar realizações físicas da mesma frase.

### Escopo técnico

- Criar um plano de audição com:
  - passos da frase;
  - backing do shape;
  - duração do ciclo;
  - volumes separados.
- Oferecer:
  - `Linha`;
  - `Com acorde`.
- Tocar o shape atual sustentado ou repicado a cada ciclo.
- Fazer controller e transporte possuírem todas as vozes e timers.
- Adiar count-in/metrônomo até existir uma primitiva de click explícita; o
  `audioSynth` atual oferece somente notas.
- Oferecer duas ou três realizações quando existirem:
  - perto do shape;
  - região abaixo;
  - região acima.
- Adiar técnicas específicas como bend e slide até o contrato de articulação de
  F360.14.

### Arquivos e módulos prováveis

- `src/utils/audioSynth.ts`
- `src/domains/writer/services/writerMaterialPlaybackController.ts`
- `src/domains/writer/services/writerFretboardPlayback.ts`
- `src/domains/writer/services/writerMaterialCellRealization.ts`
  - `physicalPositions`
  - `realizeOrderedNotes`
- `src/domains/writer/services/writerMaterialFretWindow.ts`
- novo `src/domains/writer/services/writerMaterialHarmonicPlayback.ts`
- `src/domains/writer/components/WriterMaterialPanel.tsx`
- `src/domains/writer/components/WriterMaterialActionBlock.tsx`

### Critérios de aceitação

- no plano, `Com acorde` sobrepõe a frase às notas exatas do shape selecionado,
  com backing em volume reduzido;
- a avaliação de tensão e outside contra o vamp entra também na rubrica de
  escuta manual de F360.15;
- modo `Linha` preserva o comportamento monofônico;
- stop, troca de acorde, troca de frase, unmount e dispose encerram timers e
  vozes;
- loop não sobrepõe backing de ciclos consecutivos;
- o estado de playback distingue falha da linha, do backing e
  `audio-unavailable`;
- apenas um plano de audição fica ativo.

### Validação

- criar `scripts/writer-material-harmonic-playback.spec.ts`;
- adicionar a nova spec a `vitest.curated.config.ts`;
- ampliar:
  - `scripts/writer-material-playback-controller.spec.ts`;
  - `scripts/writer-fretboard-playback.spec.ts`;
  - `scripts/writer-material-action-block.spec.ts`;
- usar relógio falso para cancelamento, loop e troca de identidade;
- executar `npm run lint` e `npm run build`.

---

## F360.8 — Rascunhos locais versionados

**Superfície:** Escrever
**Tamanho:** M
**Depende de:** F360.6

Pode avançar em paralelo com F360.7. O rascunho não persiste backing, count-in
ou estado transitório de audição.

### Objetivo

Permitir que uma descoberta local seja guardada e recuperada sem introduzir
progressão ou contexto do `Harmonizar`.

### Contrato mínimo

Um rascunho deve guardar:

- ID e versão;
- data de criação;
- snapshot da identidade do acorde/shape;
- afinação;
- fonte, material e célula por IDs estáveis;
- transformação;
- ritmo em beats e BPM local;
- contorno e registro;
- frase simbólica;
- snapshot/cache dos eventos realizados.

A frase simbólica é a fonte de verdade. Eventos físicos são cache descartável e
podem ser recalculados.

Não deve guardar:

- `previousChord`;
- `nextChord`;
- `tonalCenter`;
- melodia;
- proposta de harmonização;
- alvo contextual.

### Módulos sugeridos

- `src/domains/writer/models/WriterMaterialDraft.ts`
- `src/domains/writer/services/writerMaterialDrafts.ts`
- `src/domains/writer/services/writerMaterialDraftCodec.ts`
- `src/domains/writer/services/writerMaterialDraftRepository.ts`
- `src/store/useWriterMaterialDraftStore.ts`
- `src/domains/writer/components/WriterMaterialDraftsPanel.tsx`

O store deve ser dedicado, embora permaneça em `src/store` para seguir a
convenção atual. Codec e repositório ficam puros; relógio e storage são
injetáveis. Não adicionar rascunhos ao contrato geral de `useChordStore`.

Restaurar abre o rascunho sem alterar silenciosamente o fretboard atual:

- com tuning/shape compatível, a frase pode ser re-realizada;
- com tuning incompatível, o snapshot abre em modo de leitura;
- `Adaptar ao shape atual` é uma ação explícita;
- carregar automaticamente um shape salvo fica fora da primeira fatia.

### Critérios de aceitação

- salvar e restaurar preserva a mesma frase simbólica;
- rascunhos sobrevivem a reload;
- troca de acorde não apaga rascunhos;
- duplicação é detectada por identidade musical, não por label;
- tuning incompatível abre em modo de leitura e só tenta nova realização após
  ação explícita;
- payload inválido ou versão desconhecida é ignorado com segurança;
- exclusão afeta somente o ID escolhido;
- restauração nunca injeta contexto harmônico inexistente;
- fingerprint de deduplicação exclui label e `createdAt`, mas inclui acorde e
  graus, `cellId`, transformação, ritmo, contorno/registro e tuning quando ele
  participa da realização.

### Validação

- criar:
  - `scripts/writer-material-drafts.spec.ts`;
  - `scripts/writer-material-draft-store.spec.ts`;
- adicionar as novas specs a `vitest.curated.config.ts`;
- adicionar teste de render estático do painel;
- testar migração de versão e payload inválido;
- executar `npm run lint` e `npm run build`.

---

## F360.9 — Semântica contextual coerente por nota

**Superfície:** Harmonizar
**Tamanho:** M
**Depende de:** F360.1

### Objetivo

Produzir semântica contextual em camadas antes de ranquear materiais.

### Escopo técnico

- Separar:
  - papel harmônico primário: apoio, tensão escrita, tensão disponível ou
    avoid/cuidado;
  - papel linear: passagem, aproximação ou enclosure;
  - flags temporais/contextuais: nota-guia, alvo, chegada e âncora melódica.
- Papel linear e flags podem coexistir com o papel harmônico. Uma terça do
  próximo acorde, por exemplo, pode ser simultaneamente chord tone e alvo.
- Passar o `MaterialChordIdentity` completo de F360.1 para o ranking.
- Usar o perfil do material e a função, não apenas proximidade cromática com
  qualquer nota do acorde.
- Garantir disjunção somente entre categorias incompatíveis, especialmente
  tensão disponível e avoid.
- Manter `caution` quando a melodia sustenta uma fricção realmente problemática.

### Arquivos e símbolos prováveis

- `src/utils/music/theory/contextualMaterialRanking.ts`
  - `scoreMaterialCandidate`
- `src/utils/music/theory/contextualMaterialCandidates.ts`
  - `buildRankedMaterialCandidate`
- `src/utils/music/theory/contextualMaterialTypes.ts`
- novo `src/utils/music/theory/contextualMaterialNoteSemantics.ts`
- `src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx`

### Casos obrigatórios

- Cmaj7 Lydian: F# é `#11` disponível, não avoid;
- Cm7 Dorian: D e A são 9 e 13 disponíveis, não avoid;
- Cmaj7 Ionian: F natural sustentado continua delicado;
- alteração escrita não é automaticamente avoid;
- uma avoid sustentada pela melodia produz `caution`;
- a mesma nota nunca aparece simultaneamente em `Tensões` e `Evitar`.

### Critérios de aceitação

- `supportedTensions` e `avoidNotes` são disjuntos;
- a UI respeita a semântica calculada e não a recalcula;
- explicação e score usam a mesma classificação;
- candidatos locais adaptados recebem a semântica contextual sem alterar o
  catálogo original;
- regressões de dominante, SubV, meio-diminuto e diminuto permanecem verdes.

### Validação

- criar `scripts/contextual-material-note-semantics.spec.ts`;
- ampliar:
  - `scripts/contextual-material-ranking.spec.ts`;
  - `scripts/contextual-material-candidate-behavior.spec.ts`;
  - `scripts/contextual-material-presentation.spec.ts`;
- adicionar a nova spec à suíte curada;
- executar `npm run lint` e `npm run build`.

---

## F360.10 — Ranking contextual por material e célula

**Superfície:** Harmonizar
**Tamanho:** L
**Depende de:** F360.2, F360.9

### Objetivo

Fazer o ranking escolher a célula que a interface realmente apresenta, em vez
de pontuar somente a união de notas da fonte.

### Escopo técnico

- Avaliar cada célula individualmente.
- Gerar evidência por célula:
  - cobertura da melodia;
  - notas do acorde;
  - tensões;
  - notas-guia;
  - alvo;
  - necessidade de resolução;
  - custo/risco.
- Fazer o score agregado do candidato depender da melhor célula elegível.
- Expor explicitamente:
  - `primaryMaterialId`;
  - `primaryCellId`;
  - alternativas ranqueadas;
  - motivo da escolha.
- Remover usos implícitos de `melodicMaterials[0]`.
- Substituir `melodyMatches: string[]` por evidências tipadas contendo:
  - `kind`;
  - `materialId`;
  - `cellId` quando aplicável;
  - notas correspondentes;
  - contribuição ao score.
- Impedir que fontes compostas, como side-slip, ganhem cobertura artificial pela
  união de células incompatíveis.

### Arquivos e módulos prováveis

- `src/utils/music/theory/contextualMaterialTypes.ts`
- `src/utils/music/theory/contextualMaterialCandidates.ts`
- `src/utils/music/theory/contextualMaterialRanking.ts`
- novo `src/utils/music/theory/contextualMaterialCellRanking.ts`
- `src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx`

### Critérios de aceitação

- D–F#–A sobre Cmaj7 seleciona a célula correspondente;
- melodias diferentes podem selecionar células diferentes da mesma fonte;
- `melodyMatches` distingue célula, fragmento e nota isolada;
- side-slip não recebe cobertura total por agregar suas três pentatônicas;
- células vazias ou inválidas não participam;
- empate possui desempate determinístico;
- a UI mostra a célula escolhida, não necessariamente a primeira cadastrada;
- nenhum consumer contextual escolhe material/célula por `[0]`;
- IDs e seleção sobrevivem à reordenação do ranking.

### Validação

- criar `scripts/contextual-material-cell-ranking.spec.ts`;
- adicionar a nova spec a `vitest.curated.config.ts`;
- ampliar:
  - `scripts/contextual-material-candidates.spec.ts`;
  - `scripts/contextual-material-candidate-behavior.spec.ts`;
  - `scripts/contextual-material-presentation.spec.ts`;
- adicionar casos de side-slip e estrutura superior;
- executar `npm run lint` e `npm run build`.

---

## F360.11 — Evidência temporal e melódica por evento

**Superfície:** Harmonizar
**Tamanho:** L
**Depende de:** F360.10

### Objetivo

Fazer duração, sobreposição, posição métrica e chegada ao acorde seguinte
participarem da escolha contextual.

### Escopo técnico

- Enriquecer `WeightedMelodyNote` com:
  - `startTick` e `endTick`;
  - `overlapStartTick` e `overlapEndTick`;
  - `overlapDurationTicks`;
  - `metricalWeight`;
  - `evidenceSource`;
  - `timingSource` e `timingConfidence`.
- Recortar cada nota ao intervalo temporal real do acorde.
- Passar ao contexto:
  - `eventId`;
  - `tickStart`;
  - `tickEnd`;
  - `durationTicks`;
  - métrica/timeline disponível;
  - `measureTicks`;
  - evento seguinte.
- Resolver tonalidade e métrica no tick de cada evento, não apenas no início da
  seção.
- Estender `ScoreSnapshot.metadata` com `ticksPerQuarter` e tornar esse campo
  obrigatório para qualquer recurso que afirme timing contextual:
  - o parser MusicXML, que hoje normaliza durações internamente para 480 ticks
    por semínima, deve publicar explicitamente `ticksPerQuarter: 480`;
  - snapshots recebidos por qualquer via devem validar PPQ finito e positivo no
    ingresso;
  - ausência ou contradição de PPQ mantém a leitura material não temporal, mas
    marca frase contextual e playback como indisponíveis;
  - nenhum consumidor pode assumir `480` quando o campo estiver ausente.
- Atribuir identidade estável aos eventos de harmonia de referência, que hoje
  não possuem `eventId`.
- Fazer `buildSectionMaterialSuggestions` preservar os mesmos campos temporais
  do caminho de propostas.
- Pontuar nota-guia considerando saída e chegada.
- Para snapshot sem ticks confiáveis ou proposta que cai no fallback atual de
  ticks zero:
  - continuar oferecendo ranking material não temporal;
  - marcar `timingSource: unavailable`;
  - não gerar frase contextual nem playback.
- Timing só pode ser sintetizado quando `measureTicks`, beat e métrica permitem
  uma projeção verificável; nesse caso, registrar a origem inferida.

### Arquivos e símbolos prováveis

- `src/utils/music/theory/contextualMaterialTypes.ts`
  - `MaterialContext`
  - `WeightedMelodyNote`
- `src/utils/music/theory/contextualMaterialChordContext.ts`
  - `weightedMelodyNotesFromContext`
- `src/domains/harmonizer/services/harmonizerService.ts`
  - `selectMelodyForHarmony`
  - `buildSectionMaterialSuggestions`
  - `buildProposalMaterialSuggestions`
  - `buildProposalMaterialSuggestionSets`
- `src/domains/harmonizer/hooks/useHarmonizerProposals.ts`
- `src/utils/music/analysis/models/ScoreSnapshot.ts`
- `src/utils/music/analysis/scoreTimelineContext.ts`
  - resolver de contexto no tick do evento
- `scripts/musicxml-parser.cjs`
- `scripts/musescore-bridge.cjs`
- `src/store/useScoreSessionStore.ts`

### Critérios de aceitação

- nota longa sobreposta pesa mais que passagem breve;
- trecho fora do intervalo do acorde não influencia seu ranking;
- nota sustentada através da fronteira é creditada proporcionalmente;
- chegada à nota-guia do próximo acorde é reconhecida;
- dois acordes no mesmo compasso preservam janelas independentes;
- 3/4, mudanças métricas e eventos densos usam timeline real;
- o parser publica PPQ 480 após normalizar `divisions`, inclusive quando
  `divisions` muda no meio da partitura;
- snapshots sem ticks ou sem PPQ confiável continuam produzindo leitura
  material não temporal, mas frase e playback ficam explicitamente
  indisponíveis com razão tipada;
- nenhum evento com ticks zero fabricados é tratado como evidência temporal;
- ranking em ticks não depende de BPM.

### Validação

- ampliar:
  - `scripts/temporal-melody-window.spec.ts`;
  - `scripts/contextual-material-ranking.spec.ts`;
  - `scripts/score-timeline-context.spec.ts`;
  - `scripts/musicxml-parser-timeline.spec.ts`;
- criar `scripts/contextual-material-temporal-evidence.spec.ts`;
- adicionar a nova spec a `vitest.curated.config.ts`;
- manter regressões de overlap, mesma medida, fallback e mudança métrica;
- executar `npm run lint` e `npm run build`.

---

## F360.12 — Espinha melódica contextual entre eventos

**Superfície:** Harmonizar
**Tamanho:** L
**Depende de:** F360.2, F360.11

### Objetivo

Substituir `SectionLinearRoute` como simples agregação de strings por uma
espinha melódica temporal de dois a quatro acordes.

### Modelo mínimo

Cada evento da frase deve referenciar:

- `eventId`;
- acorde e proposta/variante;
- intervalo em ticks;
- candidate, material e célula por IDs;
- notas simbólicas ordenadas: pitch class, grau e papel;
- timing relativo em beats de semínima; em 6/8, uma pulsação de semínima
  pontuada ocupa `1.5` beats;
- projeção absoluta em ticks;
- realização auditiva separada, com oitava ou MIDI;
- papel de cada nota;
- alvo e justificativa.

Cada transição deve registrar:

- nota comum;
- nota-guia;
- aproximação;
- direção;
- custo de movimento;
- tipo de chegada;
- confiança.

### Escopo técnico

- Criar serviço contextual próprio.
- Escolher uma célula por evento a partir de F360.10.
- Conectar a célula atual a um alvo real do evento seguinte.
- Manter motif/contorno quando isso não contradiz melodia e função.
- Emitir no máximo três variantes, cada uma com dois a quatro eventos
  harmônicos; não gerar um solo completo.
- Calcular a unidade métrica sem ambiguidade:
  - `beatUnitTicks = ticksPerQuarter * 4 / beatType`, isto é, a unidade escrita
    pelo denominador;
  - `pulseTicks = beatUnitTicks` em métricas simples;
  - `pulseTicks = 3 * beatUnitTicks` em métricas compostas regulares com
    numerador 6, 9 ou 12; por exemplo, a pulsação de 6/8 é a semínima pontuada,
    não a colcheia;
  - usar a assinatura vigente no fim do evento de partida e não atravessar uma
    mudança métrica sem recalcular o limite.
- Encerrar a rota quando a lacuna até o próximo evento superar `pulseTicks`,
  quando o PPQ/meter necessário não for confiável ou quando não houver
  evidência de transição.
- Projetar a realização auditiva em registro limitado e declaradamente
  independente de fretboard.

### Arquivos e módulos prováveis

- `src/domains/harmonizer/services/harmonizerService.ts`
  - `SectionLinearRoute`
  - `buildMaterialLinearRoutes`
- novo:
  - `src/domains/harmonizer/services/contextualImprovisationPhrase.ts`;
  - `src/domains/harmonizer/models/HarmonizerImprovisationPhrase.ts`.
- compartilhar apenas o modelo simbólico básico de
  `src/utils/music/models/ImprovisationPhrase.ts`, criado em F360.2.

### Casos obrigatórios

- Dm7–G7–Cmaj7;
- iiø–V7alt–i;
- SubV resolvendo por semitom;
- dominante que resolve em alvo menor;
- dois acordes dentro do mesmo compasso;
- acorde repetido/prolongado;
- terminal sem próximo acorde;
- variante de proposta diferente da proposta-base.

### Critérios de aceitação

- eventos ficam ordenados por ticks e IDs;
- cada nota vem da célula escolhida ou é alvo explicitamente justificado;
- dominante alterado resolve de acordo com o alvo real;
- proposta e variante nunca compartilham eventos por engano;
- rota segura vence alternativa com cautela quando o restante é equivalente;
- terminal sem próximo acorde não inventa resolução;
- uma região estável não é convertida automaticamente em “solo pronto”;
- saída é determinística, com no máximo três variantes de dois a quatro eventos;
- lacuna acima de uma pulsação métrica encerra a rota;
- em 4/4, com PPQ 480, o limite é 480 ticks; em 6/8, com o mesmo PPQ, é
  720 ticks;
- mudança de 4/4 para 6/8 usa a assinatura vigente em cada transição e nunca
  herda silenciosamente o limite anterior;
- toda frase emitida possui timing confiável e realização auditiva com
  oitava/MIDI, sem alterar a identidade simbólica.

### Validação

- criar `scripts/contextual-improvisation-phrase.spec.ts`;
- adicionar a nova spec a `vitest.curated.config.ts`;
- ampliar:
  - `scripts/temporal-melody-window.spec.ts`;
  - `scripts/contextual-material-candidate-behavior.spec.ts`;
- adicionar testes de isolamento entre propostas e variantes;
- executar `npm run lint` e `npm run build`.

---

## F360.13a — Seleção e plano contextual de sessão

**Superfície:** Harmonizar
**Tamanho:** M
**Depende de:** F360.12

### Objetivo

Permitir selecionar e comparar uma espinha melódica sem depender de labels,
índices ou estado local do componente.

### Escopo técnico

- Criar estado próprio do `Harmonizar`.
- Definir `HarmonizerImprovisationPlan` com schema versionado.
- Separar identidade musical estável de execução efêmera. A chave estável do
  plano usa:
  - `scoreId`, quando existir, como namespace de origem;
  - fingerprint musical determinístico **sempre**, inclusive quando houver
    `scoreId`, para distinguir edições da mesma partitura;
  - seção;
  - novo `analysisContractVersion` estável para algoritmos e contratos;
  - proposal/variant;
  - event;
  - candidate/material/cell;
  - phrase.
- Manter `analysisRunId`, identidade efêmera já existente no score session
  store, apenas como token da execução ativa e de cancelamento de resultados
  assíncronos. Ele não participa da chave estável nem do round-trip persistido.
- O fingerprint deve excluir `timestamp`, UUIDs de execução e outros campos
  voláteis e incluir conteúdo musical relevante: harmonias, notas, ticks,
  métricas, tonalidades e limites de seção. Assim, sincronizar o mesmo conteúdo
  preserva a identidade, mas editar a mesma `scoreId` produz outra.
- Manter apenas persistência de sessão nesta entrega.
- Manter um mapa de planos pela identidade composta. Trocar seção,
  proposta/variante ou rota:
  - muda apenas a chave ativa;
  - interrompe o playback corrente;
  - preserva os demais planos da sessão para comparação e retorno.
- Invalidar de forma destrutiva somente planos cujo score/fingerprint mudou ou
  cujo `analysisContractVersion`/schema seja incompatível. Um novo
  `analysisRunId` isoladamente apenas cancela resultados da execução anterior;
  ele não apaga um plano cujo fingerprint musical permaneceu igual.
- Não escrever materiais contextuais em `useChordStore`.

### Arquivos e módulos sugeridos

- `src/domains/harmonizer/models/HarmonizerImprovisationPlan.ts`
- `src/store/useHarmonizerImprovisationStore.ts`
- `src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx`
- `src/domains/harmonizer/hooks/useHarmonizerProposals.ts`

### Critérios de aceitação

- seleção sobrevive a recolher o painel e trocar de aba durante a sessão;
- labels ou índices não participam da identidade;
- troca de seção ou proposta interrompe o playback e troca a chave ativa, mas o
  retorno restaura o plano anterior da mesma sessão;
- mudança real de score/fingerprint ou versão contratual incompatível invalida
  o plano antigo;
- score com ou sem `scoreId` usa fingerprint musical determinístico; editar o
  conteúdo sob a mesma `scoreId` não restaura plano obsoleto;
- novo `analysisRunId` com fingerprint idêntico rejeita resultados assíncronos
  antigos sem perder a seleção válida;
- round-trip do plano preserva IDs e frase;
- reload não é prometido por esta fatia;
- nada é escrito em `useChordStore`.

### Validação

- criar `scripts/harmonizer-improvisation-plan.spec.ts`;
- adicionar a nova spec a `vitest.curated.config.ts`;
- ampliar testes do painel contextual;
- testar score sem ID, mesma `scoreId` com conteúdo editado, novo
  `analysisRunId` com conteúdo idêntico, mudança de versão, proposta e variante;
- executar `npm run lint` e `npm run build`.

---

## F360.13b — Playback sincronizado sobre a progressão

**Superfície:** Harmonizar
**Tamanho:** L
**Depende de:** F360.12, F360.13a

### Objetivo

Ouvir a espinha selecionada sobre uma referência harmônica derivada da
progressão avaliada, com transporte cancelável e timing verificável.

### Contratos prévios

- Consumir `metadata.ticksPerQuarter`, já tornado explícito e validado em
  F360.11; esta fatia não introduz nem infere o contrato de PPQ.
- Estender `ScoreSnapshot` com:
  - `ScoreTempoTimelineEntry { tick, quarterBpm, source }`;
  - `metadata.tempoTimeline`, ordenada e sem entradas redundantes;
  - `metadata.tempo` mantido apenas como fallback legado de tempo constante,
    sempre definido como **semínimas por minuto**, independentemente da unidade
    exibida no metrônomo da partitura.
- Extrair marcações MusicXML de `<sound tempo>` e `<metronome>`, normalizando
  beat-unit/dots para `quarterBpm`. Se houver mais de uma mudança, preservá-las
  em `tempoTimeline`; jamais reduzir silenciosamente a primeira ou a última a
  um tempo constante.
- Converter ticks em tempo integrando cada segmento de `tempoTimeline`. Na
  ausência de timeline, `metadata.tempo` pode alimentar um único segmento
  constante.
- Exigir cobertura de tempo desde o tick inicial da frase. Se a primeira
  marcação ocorrer depois dele e não houver tempo constante anterior, o prefixo
  fica indisponível para sincronização; o sistema não retroage a primeira
  marcação. O usuário ainda pode escolher BPM de preview para toda a frase,
  explicitamente fora do modo sincronizado.
- Quando não houver tempo:
  - permitir BPM de preview escolhido pelo usuário;
  - marcar `tempoSource: user-preview`;
  - não alegar sincronização com a partitura.
- Realizar a frase simbólica em oitava/MIDI antes de entregá-la ao synth.
- Derivar a referência harmônica como root + até duas notas estruturais/guia em
  registro médio e volume reduzido, respeitando sus, omissões e alterações
  escritas.
- Remover do caminho sincronizado o piso atual de 80 ms de
  `playGuitarNote`:
  - a primitiva deve adaptar ataque e release à duração disponível e encerrar a
    voz até o tick final convertido;
  - um evento menor que o envelope mínimo seguro não deve vazar para o próximo
    evento: o plano o omite com razão tipada `event-too-short`;
  - chamadas existentes sem duração explícita mantêm o comportamento padrão,
    para não regredir o preview do `Escrever`.

### Escopo técnico

- Criar scheduler próprio do `Harmonizar`.
- Sincronizar:
  - referência harmônica;
  - frase;
  - destaque do acorde/evento atual.
- Cancelar tudo ao trocar:
  - proposta;
  - rota;
  - seção;
  - score;
  - aba;
  - componente.
- Não importar `writerMaterialPlaybackController`.

### Arquivos e módulos sugeridos

- `src/utils/music/analysis/models/ScoreSnapshot.ts`
- `scripts/musicxml-parser.cjs`
- `src/utils/audioSynth.ts`
- `src/domains/harmonizer/services/contextualMaterialPlaybackPlan.ts`
- `src/domains/harmonizer/services/contextualMaterialPlaybackController.ts`
- `src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx`
- `src/domains/harmonizer/HarmonizerScreen.tsx`
- `src/domains/harmonizer/hooks/useHarmonizerProposals.ts`
- possível scheduler puro em `src/utils/music/playback/`

### Critérios de aceitação

- com PPQ 480 e 120 BPM, 480 ticks equivalem a 500 ms;
- o parser publica explicitamente PPQ 480 depois de normalizar `divisions`;
- uma marcação de colcheia = 120 é normalizada para 60 semínimas por minuto;
- duas mudanças de tempo geram dois segmentos e preservam continuidade no
  instante da mudança;
- PPQ ausente/inválido preserva sugestões não temporais, mas impede frase
  contextual e modo sincronizado com razão tipada;
- timeline cuja primeira marcação é posterior ao início não empresta esse BPM
  ao prefixo; oferece somente preview não sincronizado;
- base e frase permanecem sincronizadas;
- nenhuma voz ultrapassa a janela do evento; evento curto demais é omitido com
  `event-too-short`, nunca alongado silenciosamente para 80 ms;
- apenas uma frase toca por vez;
- stop, troca de aba e mudanças de identidade cancelam timers e vozes;
- tempo ausente exige preview BPM explícito;
- erro de áudio é visível e não fatal;
- F360.13b não introduz aplicação do plano ou da frase melódica ao MuseScore;
  sincronização e operações de acordes existentes permanecem inalteradas.

### Guardrail de aplicação no Escrever

`useApplyProposalToWriter` continua aplicando somente acordes e timings da
proposta/variante selecionada. Ele nunca transfere material contextual, célula,
ranking, alvo ou frase.

### Validação

- criar:
  - `scripts/contextual-material-playback-plan.spec.ts`;
  - `scripts/contextual-material-playback-controller.spec.ts`;
- adicionar as novas specs a `vitest.curated.config.ts`;
- ampliar `scripts/musicxml-parser-timeline.spec.ts` com PPQ, metrônomo em
  unidade diferente de semínima e múltiplas mudanças de tempo;
- adicionar teste unitário do envelope curto de `src/utils/audioSynth.ts` por
  meio de uma fronteira Web Audio injetável, sem depender de áudio real;
- ampliar testes do painel para unmount, troca de aba, proposta e variante;
- ampliar `scripts/apply-proposal-to-writer.spec.ts` somente para preservar o
  guardrail acima;
- executar `npm run lint` e `npm run build`.

---

## F360.14.x — Vocabulário linear, articulação e packs idiomáticos

**Superfície:** compartilhada, adaptada por domínio
**Tamanho:** subépico
**Depende de:** F360.6, F360.7, F360.12, F360.13b

### Objetivo

Adicionar novas possibilidades que aumentem linguagem musical, não apenas o
número de fontes escalares.

### Fatias internas

#### F360.14.1 — Vocabulário linear mínimo

- migrar/consolidar notas-guia 3–7 já existentes como células explícitas;
- implementar uma família geral de aproximação/enclosure;
- validar aplicação local e contextual.

#### F360.14.2 — Expansão de vocabulário

- inversões e permutações reais de arpejo;
- blues como linguagem de frase, não somente escala;
- triad pairs e estruturas intervalares.

#### F360.14.3 — Primeiro pack brasileiro

- entregar um único pack completo, começando por samba;
- incluir groove, articulação, compatibilidade métrica, proveniência e casos
  negativos;
- adaptar separadamente para vamp local e timeline contextual.

#### Continuidade posterior

- bossa nova;
- baião;
- choro;
- frevo;
- packs adicionais sustentados por corpus.

O fechamento do épico F360 exige F360.14.1 e F360.14.3. F360.14.2 e os demais
packs podem continuar em roadmap sem bloquear F360.15, desde que sejam marcados
explicitamente como adiados.

### Política por superfície

No `Escrever`:

- célula e articulação são aplicadas ao vamp local;
- enclosures retornam ao mesmo acorde;
- groove é escolhido pelo usuário;
- não há inferência de função.

No `Harmonizar`:

- células são filtradas por melodia, evento e alvo;
- enclosure pode preparar uma nota real do acorde seguinte;
- groove deve respeitar métrica e duração;
- articulação pode variar por idioma e posição métrica.

### Contrato de pack idiomático

Cada pack deve carregar:

- ID e versão;
- groove/subdivisão;
- articulação;
- compatibilidade métrica;
- proveniência;
- exemplos abstratos;
- limites de uso.

Não cadastrar uma regra de estilo apenas por intuição. O pack deve ser
justificado por teoria ou trecho transcrito e generalizado.

### Técnica instrumental incremental

- legato;
- slide;
- hammer-on;
- pull-off;
- bend;
- vibrato;
- direção de palhetada;
- mudança de posição;
- string skipping.

O MVP deve começar por articulações que playback e realização conseguem
representar honestamente. Técnicas físicas específicas pertencem primeiro ao
`Escrever`; no `Harmonizar`, articulação permanece simbólica/auditiva enquanto
não existir realização no fretboard.

### Critérios de aceitação

- cada novo vocabulário produz células, não somente mapas;
- a mesma fonte não duplica ideias já existentes;
- aplicação local e contextual usam orquestradores diferentes;
- estilo sem proveniência não entra como regra;
- grooves não alteram silenciosamente a identidade harmônica;
- técnica incompatível com a realização escolhida é rejeitada;
- o número de alternativas por decisão permanece limitado.
- F360.14.1 e F360.14.3 possuem escopo e specs próprios;
- packs posteriores não são apresentados como implementados.

### Validação

- criar specs por família de vocabulário;
- ampliar o relatório de materiais para medir:
  - célula;
  - idioma;
  - proveniência;
  - duplicação;
- adicionar fixtures brasileiras pequenas e licenciadas/autoriais;
- registrar cada spec nova em `vitest.curated.config.ts`;
- executar `npm run lint` e `npm run build`.

---

## F360.15 — Auditoria musical e fechamento do épico

**Superfície:** compartilhada
**Tamanho:** M
**Depende de:** F360.8, F360.13a, F360.13b, F360.14.1, F360.14.3

### Objetivo

Medir se o sistema deixou de ser um catálogo de notas e passou a oferecer
material, frase e contexto coerentes.

### Auditorias

#### Integridade

- alterações escritas preservadas;
- grafia e grau coerentes;
- tensão disponível e avoid disjuntos; papéis lineares/contextuais sobrepostos
  permanecem rastreáveis;
- célula, ação, mapa e playback com a mesma identidade;
- ausência de fallback silencioso.

#### Escrever

- cobertura das 33 qualidades com ideia estruturada;
- variedade real por rota;
- transformações determinísticas;
- retorno sempre local;
- fretboard completo até `geometry.fretCount`;
- playback sem vozes residuais;
- restauração segura de rascunho.

#### Harmonizar

- célula escolhida com base na melodia real;
- janela temporal correta;
- chegada ao próximo acorde justificada;
- isolamento entre proposta e variante;
- frases limitadas e não aleatórias;
- cancelamento de playback;
- seleção invalidada ao mudar score.

#### Repertório

- maior/menor tonal;
- dominante natural e alterado;
- ii–V–I maior;
- iiø–V–i;
- SubV;
- diminuto de passagem;
- contexto modal;
- samba como primeiro pack obrigatório;
- demais idiomas apenas quando suas fatias forem efetivamente entregues.

### Métricas mínimas

- zero ideia tocável sem célula;
- zero interseção não explicada entre tensão disponível e avoid;
- zero alteração escrita perdida nos casos suportados;
- zero classificação de `#9/#11/b13` como apoio estável;
- 100% das frases do `Escrever` sem dependência contextual;
- 100% das frases **emitidas** pelo `Harmonizar` vinculadas a proposta e eventos
  temporais confiáveis;
- zero timer/voz residual nas specs de cancelamento;
- zero identidade persistida baseada apenas em label ou índice.

### Gate final

```bash
npm run lint
npm run test:curated
npm run build
```

Também devem ser atualizados:

- `docs/theory/melodic_materials_vocabulary.md`;
- `docs/reports/f184-melodic-materials-audit.md`;
- `docs/sprints/screens-architecture.md`, se os novos stores/modelos alterarem o
  mapa arquitetural;
- este roadmap, marcando cada fatia como entregue, adiada ou conscientemente
  fora de escopo.

Relatórios obrigatórios:

```bash
npm run report:contextual-materials
npm run report:melodic-materials
```

### Avaliação musical manual

Os gates automatizados provam integridade e determinismo, mas não provam
qualidade de frase, groove ou backing. F360.15 deve manter:

- corpus dourado com expectativas positivas e negativas;
- rubrica de escuta para direção da frase, clareza do retorno, articulação,
  equilíbrio do backing e coerência idiomática;
- registro separado entre fato automatizado e julgamento musical;
- revisão manual dos casos em que duas opções tecnicamente válidas têm valor
  artístico diferente.

## Estratégia de testes do épico

### 1. Invariantes puras

Testes tabelados e rápidos para:

- cifra -> identidade;
- identidade -> papéis;
- célula -> intenção;
- contexto -> semântica;
- transformação -> frase;
- ticks/beats -> playback.

### 2. Serviços de domínio

- orquestrador de materiais do `Escrever` sem `previousChord`, `nextChord`,
  `melody`, `tonalCenter`, `progressionItems` ou `activeProgressionIndex`;
- `Harmonizar` com contexto completo e fallbacks explícitos;
- resultados determinísticos;
- falhas tipadas.

### 3. Componentes

- seleção e reset;
- uma única identidade ativa;
- estados vazios e indisponíveis;
- playback e cancelamento;
- fretboard completo;
- persistência/restauração.

### 4. Auditoria de catálogo e corpus

- cobertura não significa somente “há uma escala”;
- medir célula, gesto, frase e proveniência;
- registrar casos sem suporte em vez de fabricar fallback.

### 5. Gates por fatia

Cada `F360.x` deve terminar com:

```bash
npx vitest run --config vitest.curated.config.ts <specs focadas>
npm run lint
npm run build
```

A suíte curada completa deve rodar nos marcos:

- F360.2;
- F360.8;
- F360.13b;
- F360.15.

## Riscos e guardrails

### Mistura de contexto

**Risco:** usar dados de progressão disponíveis no store do `Escrever` para tornar o
painel local aparentemente mais inteligente.

**Guardrail:** teste arquitetural garantindo que o orquestrador local não
importe `MaterialContext`, `buildContextualMaterialCandidates`,
`progressionItems`, `activeProgressionIndex` ou `useScoreSessionStore`. O
domínio pode continuar armazenando progressão para edição e handoff; apenas o
painel local não a consome.

### Explosão de alternativas

**Risco:** combinações de célula, transformação, ritmo, contorno e registro
gerarem busca excessiva e UI paralisante.

**Guardrail:** top-k pequeno, deduplicação antes do render, limites determinísticos
e ausência de busca combinatória ilimitada no main thread.

### Perda de grafia

**Risco:** normalizar cedo para pitch class e reapresentar `#9` como `b3`.

**Guardrail:** transportar grau escrito e grafia ao lado do pitch class.

### Fallback convincente, mas falso

**Risco:** uma realização ou frase falhar e a UI tocar outra coisa sem avisar.

**Guardrail:** estados tipados `unavailable`, `incompatible` e `audio-error`; sem
substituição silenciosa.

### Estado parcial

**Risco:** troca de acorde, proposta ou score manter célula, frase ou playback
antigos.

**Guardrail:** identidades compostas e invalidação explícita por domínio.

### Áudio concorrente

**Risco:** loops, backing e frase deixarem timers ou vozes ativas.

**Guardrail:** controllers donos de todos os handles; cancelamento testado com
relógio falso.

### Regra estilística sem base

**Risco:** transformar clichê isolado em gramática brasileira geral.

**Guardrail:** proveniência e generalização obrigatórias antes de promoção ao
catálogo.

## Definition of Done do épico

O épico estará encerrado quando:

- as duas superfícies preservarem claramente suas perguntas musicais;
- o `Escrever` produzir e reproduzir variações locais sem qualquer contexto
  inventado;
- o `Harmonizar` selecionar células e construir conexões a partir da melodia,
  timeline e harmonia realmente avaliadas;
- cifra, grau, papel, célula, frase e playback compartilharem identidades
  rastreáveis;
- nenhuma opção tocável depender de fallback de escala bruta;
- o usuário puder ouvir a ideia contra a referência harmônica apropriada;
- rascunhos locais e planos contextuais tiverem stores separados e seguros;
- idioma e articulação entrarem com proveniência;
- auditorias e testes comprovarem as invariantes acima;
- inserção de frase no MuseScore continuar explicitamente fora de escopo até
  existir um contrato próprio.

## Ordem recomendada de execução

1. F360.1 — identidade e papéis;
2. F360.2 — contrato de célula;
3. abrir as duas trilhas em paralelo:
   - Escrever:
     - F360.3 -> F360.4;
     - F360.5 pode avançar em paralelo a F360.3/F360.4;
     - F360.4 + F360.5 -> F360.6;
     - F360.7 e F360.8 podem avançar em paralelo após F360.6;
   - Harmonizar:
     - F360.9 -> F360.10 -> F360.11 -> F360.12 -> F360.13a -> F360.13b;
4. F360.14.1 e F360.14.3 — vocabulário mínimo e primeiro pack;
5. F360.15 — auditoria e fechamento.

O primeiro incremento de produto perceptível deve ocorrer no `Escrever` em F360.6:
uma célula deixa de ser apenas demonstrada e passa a gerar variações locais. O
primeiro incremento horizontal perceptível deve ocorrer no `Harmonizar` em
F360.12: uma leitura deixa de ser apenas uma lista por acorde e passa a formar
uma conexão temporal justificada.
