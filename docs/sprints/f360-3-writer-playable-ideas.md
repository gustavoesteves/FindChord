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

## Invariantes

- Ideia tocavel precisa vir de celula ou linha curada.
- Fonte/mapa sem celula continua navegavel no braco, mas nao gera acao de
  audio.
- A acao sem shape nao inventa posicoes fisicas; posicao so aparece quando a
  celula e realizada perto da forma desenhada.
- O nome da acao segue o material/celula em foco, favorecendo identidade entre
  card, gesto e escuta.

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

## Proximo encaixe

- Auditar quantos itens ainda entram como mapa sem celula.
- Garantir que `routedMaterialPalette` distinga explicitamente ideia estruturada
  de mapa disponivel.
- Remover dependencias restantes de `preferredCellIndex` no caminho do
  `Escrever`, usando `preferredCellId` quando disponivel.
