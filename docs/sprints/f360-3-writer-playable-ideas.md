# F360.3 - Escrever sem pseudoideias escalares

**Status:** iniciado
**Roadmap:** [F360](./f360-improvisation-two-surface-roadmap.md)
**Depende de:** F360.2

## Objetivo

Separar claramente o que e uma ideia tocavel do que e apenas um mapa de apoio.
Uma colecao de notas pode ajudar o compositor a navegar no braco, mas nao deve
ser apresentada como frase, gesto ou botao de escuta quando nao houver celula.

## Primeiro encaixe

- `WriterMaterialPaletteItem` agora declara `hasPlayableIdea`.
- Cards sem material melodico deixam `cells: []`; nao copiam
  `source.notes.slice(0, 4)` como se fossem celulas.
- O card ativo mostra `mapa de apoio` quando nao ha celula.
- `buildWriterMaterialAction` deixou de criar fallback auditivo com
  `focusedSource.notes`.
- `buildWriterActiveMaterialPanel` cria uma linha auditiva abstrata a partir da
  celula estruturada quando nao ha shape realizado.
- O shape realizado continua tendo prioridade sobre a linha abstrata.
- A linha teorica generica continua disponivel apenas quando nao ha celula
  curada.
- `realizeWriterMaterialCellNearShape` agora consome o adaptador de celulas
  estruturadas e preserva `cellId` na celula realizada.
- Quando uma selecao traz `cellId`, ele tem prioridade sobre o indice legado,
  evitando que a realizacao fisica toque outra celula se a ordem do catalogo
  mudar.
- O painel ativo do `Escrever` tambem resolve a celula por `cellId` antes de
  aceitar `cellIndex`, mantendo a escuta abstrata alinhada com a mesma
  identidade usada no braco.
- O card de ideias deixou de exibir `mapa de apoio` como categoria visual. O
  estado sem celula permanece rastreavel pelo modelo e pela auditoria, mas nao
  vira uma promessa musical para o compositor.
- `hasPlayableIdea` continua existindo como sinal de auditoria/regressao, mas
  saiu da decisao visual do card: na superficie atual, card ativo e ideia
  tocavel no braco.
- O catalogo local de vamp agora preenche `preferredCellId` para todo material
  que ainda declara `preferredCellIndex`, usando o mesmo ID estavel das celulas
  estruturadas. O indice permanece como ponte de compatibilidade.
- O construtor `buildContextualMelodicMaterials` aplica a mesma ponte de
  `preferredCellId` no retorno final, cobrindo tanto materiais contextuais
  quanto vocabulário `local-vamp` gerado dinamicamente.
- O painel ativo do `Escrever` agora usa `preferredCellId` do material antes
  de aceitar `cellIndex` legado quando a selecao nao traz `cellId` explicito.
- Os movimentos de improviso do Writer agora emitem `id` baseado em `cellId`
  estavel. IDs antigos baseados em `materialIndex:cellIndex` continuam sendo
  aceitos apenas na resolucao de selecao legada.
- O bloco visual dos gestos tambem reconhece `activeMoveId` legado para marcar
  o botao ativo, mas continua emitindo o ID novo baseado em `cellId` nos cliques.

## Auditoria de cobertura

O auditor `scripts/audit-writer-playable-ideas.ts` mede as 33 qualidades da DSL
do `Escrever` usando o mesmo caminho da paleta real.

Linha atual:

```text
Qualidades: 33
Itens de paleta: 186
Ideias tocaveis: 186
Mapas de apoio: 0
```

Leitura musical:

- toda qualidade possui ao menos uma ideia tocavel;
- nao ha mais itens de paleta sem celula tocavel;
- mapas sem celula nao geram botao de escuta nem celula falsa quando surgirem
  em novas fontes;
- `chord tone core` nao aparece entre os mapas sem celula.
- `altered` sobre dominante natural agora possui celulas de tensao local no
  `Escrever`, porque em um vamp ela pode funcionar como cor opcional sem
  promessa de resolucao funcional;
- `mixolydian` foi removido de dominantes explicitamente alteradas (`7#9` e
  `7#11`), pois esse mapa omite a alteracao escrita e nao deve aparecer como
  possibilidade principal de um acorde local.
- o vocabulário novo entra apenas quando
  `buildContextualMelodicMaterials(..., { surface: "local-vamp" })` e chamado
  pelo `Escrever`; o caminho contextual do `Harmonizar` preserva as regras de
  função e resolução.

## Invariantes

- Ideia tocavel precisa vir de celula ou linha curada.
- Fonte/mapa sem celula continua navegavel no braco, mas nao gera acao de
  audio.
- A acao sem shape nao inventa posicoes fisicas; posicao so aparece quando a
  celula e realizada perto da forma desenhada.
- O nome da acao segue o material/celula em foco, favorecendo identidade entre
  card, gesto e escuta.
- A realizacao perto do shape segue a identidade da celula; `cellIndex` continua
  apenas como ponte de UI enquanto a migracao nao termina.

## Validacao parcial

```text
npx vitest run scripts/writer-material-palette.spec.ts \
  scripts/writer-material-action.spec.ts \
  scripts/writer-material-screen-model.spec.ts \
  scripts/writer-active-material-panel.spec.ts \
  scripts/writer-material-action-block.spec.ts

5 specs aprovadas
41 testes aprovados
```

Segundo encaixe validado com:

```text
npx vitest run scripts/writer-playable-ideas-coverage.spec.ts

1 spec aprovada
3 testes aprovados
```

Terceiro encaixe validado com:

```text
npx vitest run scripts/writer-material-cell-realization.spec.ts \
  scripts/writer-active-material-panel.spec.ts \
  scripts/writer-material-screen-model.spec.ts \
  scripts/writer-material-action.spec.ts \
  scripts/writer-material-action-block.spec.ts \
  scripts/melodic-cell-contract.spec.ts

6 specs aprovadas
52 testes aprovados
```

Quarto encaixe validado com:

```text
npx vitest run scripts/writer-playable-ideas-coverage.spec.ts \
  scripts/contextual-material-candidate-behavior.spec.ts \
  scripts/contextual-melodic-materials.spec.ts \
  scripts/local-chord-vamp-materials.spec.ts \
  scripts/writer-material-screen-model.spec.ts

5 specs aprovadas
96 testes aprovados
```

Quinto encaixe validado com:

```text
npx vitest run scripts/writer-playable-ideas-coverage.spec.ts \
  scripts/contextual-material-candidate-behavior.spec.ts \
  scripts/contextual-melodic-materials.spec.ts \
  scripts/local-chord-vamp-materials.spec.ts \
  scripts/writer-material-screen-model.spec.ts

5 specs aprovadas
96 testes aprovados
```

Sexto encaixe validado com:

```text
npx vitest run scripts/writer-playable-ideas-coverage.spec.ts \
  scripts/material-source-maps.spec.ts \
  scripts/contextual-material-candidate-behavior.spec.ts \
  scripts/contextual-melodic-materials.spec.ts \
  scripts/local-chord-vamp-materials.spec.ts \
  scripts/writer-material-screen-model.spec.ts

6 specs aprovadas
110 testes aprovados
```

Setimo encaixe validado com:

```text
npx vitest run scripts/writer-active-material-panel.spec.ts \
  scripts/writer-material-cell-realization.spec.ts \
  scripts/melodic-cell-contract.spec.ts

3 specs aprovadas
20 testes aprovados
```

Oitavo encaixe validado com:

```text
npx vitest run scripts/writer-material-idea-card-copy.spec.ts \
  scripts/writer-material-palette.spec.ts \
  scripts/writer-playable-ideas-coverage.spec.ts

3 specs aprovadas
8 testes aprovados
```

Nono encaixe validado com:

```text
npx vitest run scripts/writer-material-idea-card-copy.spec.ts \
  scripts/writer-material-palette.spec.ts \
  scripts/writer-playable-ideas-coverage.spec.ts

3 specs aprovadas
8 testes aprovados
```

Decimo encaixe validado com:

```text
npx vitest run scripts/local-chord-vamp-material-catalog.spec.ts \
  scripts/local-chord-vamp-materials.spec.ts \
  scripts/writer-material-cell-realization.spec.ts \
  scripts/writer-active-material-panel.spec.ts

4 specs aprovadas
70 testes aprovados
```

Decimo primeiro encaixe validado com:

```text
npx vitest run scripts/contextual-melodic-materials.spec.ts \
  scripts/contextual-material-candidate-behavior.spec.ts \
  scripts/local-chord-vamp-materials.spec.ts \
  scripts/writer-material-cell-realization.spec.ts \
  scripts/writer-active-material-panel.spec.ts

5 specs aprovadas
81 testes aprovados
```

Decimo segundo encaixe validado com:

```text
npx vitest run scripts/writer-active-material-panel.spec.ts \
  scripts/writer-material-screen-model.spec.ts \
  scripts/writer-material-cell-realization.spec.ts \
  scripts/writer-material-improvisation-moves.spec.ts

4 specs aprovadas
52 testes aprovados
```

Decimo terceiro encaixe validado com:

```text
npx vitest run scripts/writer-material-improvisation-moves.spec.ts \
  scripts/writer-material-screen-model.spec.ts \
  scripts/melodic-cell-contract.spec.ts \
  scripts/writer-material-action-block.spec.ts

4 specs aprovadas
44 testes aprovados
```

Decimo quarto encaixe validado com:

```text
npx vitest run scripts/writer-material-action-block.spec.ts \
  scripts/writer-material-improvisation-moves.spec.ts \
  scripts/writer-material-screen-model.spec.ts

3 specs aprovadas
38 testes aprovados
```

Decimo quinto encaixe:

- A identidade estavel da celula agora chega tambem aos eventos realizados
  no braco e aos passos da acao tocavel.
- `WriterMaterialGestureEvent` e `WriterMaterialActionStep` carregam `cellId`
  quando a ideia vem de uma celula estruturada.
- `cellIndex` permanece apenas como metadado de posicao/compatibilidade legada,
  nao como identidade principal da selecao.
- O retorno acrescentado automaticamente ao fim da frase tambem preserva o
  `cellId`, mantendo a acao inteira ligada ao mesmo gesto musical.

Decimo quinto encaixe validado com:

```text
npx vitest run scripts/writer-material-action.spec.ts \
  scripts/writer-material-cell-realization.spec.ts \
  scripts/writer-active-material-panel.spec.ts \
  scripts/writer-material-playback-controller.spec.ts

4 specs aprovadas
28 testes aprovados
```

Decimo sexto encaixe:

- A representacao do braco agora preserva `cellId` nas visitas da sequencia.
- Cada nota renderizada pela sequencia expoe os `cellIds` associados e o
  `activeCellId` quando aquele ponto e o passo atual do playback.
- O destaque visual continua guiado pelo passo real tocado, mas sem perder a
  identidade musical da celula estruturada que originou o gesto.
- Nenhum texto tecnico novo foi adicionado a UI; o ganho fica como contrato de
  view model para futuras interacoes/inspecoes.

Decimo sexto encaixe validado com:

```text
npx vitest run scripts/writer-material-fretboard-view.spec.ts \
  scripts/writer-material-action.spec.ts \
  scripts/writer-material-cell-realization.spec.ts

3 specs aprovadas
21 testes aprovados
```

Decimo setimo encaixe:

- A identidade de playback dos materiais saiu do componente e virou servico
  testavel.
- A identidade considera acorde, shape, afinacao, rota, material e gesto
  selecionado.
- O passo ativo so fica visivel quando a identidade em reproducao ainda e a
  mesma identidade da tela corrente.
- Isso protege troca de gesto/material/rota durante loop ou playback: qualquer
  estado visual antigo fica oculto enquanto a nova selecao assume o painel.
- O novo spec entrou na suite curada para impedir que essa protecao fique fora
  da regressao principal.

Decimo setimo encaixe validado com:

```text
npx vitest run scripts/writer-material-playback-identity.spec.ts \
  scripts/writer-material-playback-controller.spec.ts \
  scripts/writer-material-screen-model.spec.ts \
  scripts/writer-material-action-block.spec.ts

4 specs aprovadas
39 testes aprovados

npm run test:curated
155 specs aprovadas, 2 ignoradas
1036 testes aprovados, 6 ignorados
```

Decimo oitavo encaixe:

- O foco inicial dos materiais agora valida a fonte escolhida por `name` e
  `type`, evitando reaproveitar uma selecao antiga apenas por nome igual.
- O modelo da tela ganhou uma protecao de ponta a ponta: primeiro gesto focado,
  celula realizada no shape e passos da acao precisam compartilhar o mesmo
  `cellId`.
- Isso fecha a coerencia inicial entre rota, material em foco, gesto preferido
  e desenho no braco.

Decimo oitavo encaixe validado com:

```text
npx vitest run scripts/writer-material-focus.spec.ts \
  scripts/writer-material-screen-model.spec.ts \
  scripts/writer-material-cell-realization.spec.ts \
  scripts/writer-material-action.spec.ts

4 specs aprovadas
47 testes aprovados
```

## Proximo encaixe

- Auditar os textos de acao/rotulo dos gestos para garantir que o primeiro
  comando lido pelo compositor descreve a intencao musical real da celula.
