# F360.2 - Contrato de celulas melodicas

**Status:** entregue como contrato inicial
**Roadmap:** [F360](./f360-improvisation-two-surface-roadmap.md)
**Depende de:** F360.1

## Objetivo

Trocar a leitura implicita de `cells: string[]` por uma camada estruturada,
serializavel e compartilhavel entre `Escrever` e `Harmonizar`, sem obrigar uma
migracao imediata de todos os catalogos.

## Entrega

- Novo modelo puro:
  - `src/utils/music/models/MelodicCell.ts`
- Novo contrato simbolico de frase:
  - `src/utils/music/models/ImprovisationPhrase.ts`
- Novo adaptador temporario:
  - `src/utils/music/theory/melodicCellMaterialAdapter.ts`
- `ContextualMelodicMaterial` agora aceita:
  - `id`;
  - `cellsStructured`;
  - `preferredCellId`;
  - `preferredCellIndex` marcado como ponte legada.
- `WriterMaterialImprovisationMove` agora carrega `cellId`, mantendo o `id`
  posicional apenas como identificador de selecao da UI atual.
- A spec `scripts/melodic-cell-contract.spec.ts` entrou no conjunto curado.

## Invariantes musicais

- `BaseMelodicCell` nao representa chegada contextual; ele conhece apenas
  `none` e `local-return`.
- `ContextualCellSelection` e o futuro plano do `Harmonizar` ficam responsaveis
  por `contextual-arrival`.
- Eventos de celula carregam nota, grau intervalar, papel harmonico e papel de
  gesto.
- Tencoes escritas por F360.1, como `#11`, seguem aparecendo como `tension`
  dentro da celula, mesmo quando fazem parte da cifra.
- Apoios estruturais continuam apoio, inclusive quando a intencao geral do
  gesto for `outside`; a saida precisa estar na celula, nao no rotulo geral.
- Frases simbolicas usam `beatUnit: "quarter-note"` para manter a unidade
  compartilhada entre as duas superficies.

## Casos cobertos

- Material lidio de `Cmaj7(#11)` gera IDs determinísticos para `C-E-G-B` e
  `D-F#-A`.
- `C-E-G-B` sobre `Cmaj7(#11)` fica como apoio estrutural.
- `C-E-G-B-F#` sobre `Cmaj7(#11)` marca `F#` como `#11` tensional.
- `B-G-E-C` carrega direção descendente explícita.
- `F#->G` sobre `Cmaj7(#11)` e retorno local para o grau `5`, sem virar chegada
  contextual.
- Uma celula interna `G-B-D-F` sobre `G7` nao e rotulada como outside apenas
  porque o material maior esta numa rota externa.
- `ImprovisationPhrase` preserva proveniencia da celula e eventos em beats de
  seminima.
- Movimentos do `Escrever` carregam `cellId` estavel para futura convergencia
  entre gesto, acao, mapa, audio e UI.

## Validacao parcial

```text
npx vitest run scripts/melodic-cell-contract.spec.ts \
  scripts/writer-material-improvisation-moves.spec.ts \
  scripts/writer-material-action-block.spec.ts

3 specs aprovadas
17 testes aprovados
```

## Proximo encaixe

- F360.3: separar ideias tocaveis de mapas de apoio e impedir pseudoideias
  escalares.
- F360.10, quando voltarmos ao `Harmonizar`: ranquear material e celula, nao
  apenas a primeira entrada de `melodicMaterials`.
