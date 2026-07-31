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

## Auditoria de cobertura

O auditor `scripts/audit-writer-playable-ideas.ts` mede as 33 qualidades da DSL
do `Escrever` usando o mesmo caminho da paleta real.

Linha atual:

```text
Qualidades: 33
Itens de paleta: 188
Ideias tocaveis: 182
Mapas de apoio: 6
```

Leitura musical:

- toda qualidade possui ao menos uma ideia tocavel;
- os 6 itens restantes continuam disponiveis como mapa de apoio no braco;
- esses mapas nao geram botao de escuta nem celula falsa;
- `chord tone core` nao aparece entre os mapas sem celula.
- os mapas restantes sao deliberadamente cautelosos: `altered` sobre dominante
  natural e `mixolydian` sobre dominante explicitamente alterado.
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

## Proximo encaixe

- Decidir se os 6 mapas restantes devem continuar como mapas cautelosos ou
  receber celulas mais claramente tensionais.
- Remover dependencias restantes de `preferredCellIndex` nos catalogos,
  preenchendo `preferredCellId` de forma gradual.
