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

## Proximo encaixe

- Remover dependencias restantes de `preferredCellIndex` nos catalogos,
  preenchendo `preferredCellId` de forma gradual.
- Avaliar se o contrato `hasPlayableIdea` deve continuar publico para UI ou
  ficar restrito aos auditores/servicos internos.
