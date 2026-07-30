# F360.1 - Identidade harmonica para materiais

**Status:** concluido como fundacao compartilhada
**Roadmap:** [F360](./f360-improvisation-two-surface-roadmap.md)
**Base de entrada:** `baaace5`

## Objetivo

Criar uma projecao harmonica compartilhada para materiais, preservando a cifra
aceita pelo resolvedor e a estrutura inferida pelo shape sem reconstruir tudo a
partir de uma qualidade reduzida.

## Entrega inicial

- Novo modulo puro:
  - `src/utils/music/theory/materialChordIdentity.ts`
- Novo contrato de teste:
  - `scripts/material-chord-integrity.spec.ts`
- `ChordSymbolResolver` agora expoe os intervalos da qualidade resolvida por
  `intervalsForResolvedChordQuality`.
- `resolveMaterialChordQuality` passou a consumir a identidade harmonica em vez
  de manter outro mapa paralelo de qualidade resolvida para qualidade interna.
- `localMaterialNoteRoles` passou a aceitar `MaterialChordIdentity` para
  classificar alteracoes e tensoes escritas antes das heuristicas por
  `sourceType`.
- O mapa de materiais do `Escrever` agora propaga a identidade do
  `ChordCandidate` ativo ate `localMaterialFretboardNotes`.
- `LocalChordVampMaterialCandidate` agora carrega `materialIdentity`; o catalogo
  curado recebe a identidade completa e mantem `quality` apenas como indice de
  familia.
- O candidato `chord tone core` usa `structuralNotes` da identidade, preservando
  notas estruturais omitidas pelo shape.
- O adapter de `ChordCandidate` usa a formula da qualidade na DSL como estrutura
  harmonica; `drawnNotes`/`notes` informam o que esta soando no shape.
- `writerMaterialImprovisationMoves` recebe a identidade do material focado e
  classifica gestos que contêm tensao escrita ou alteracao estrutural como
  `tension`, mesmo quando a nota pertence a formula do acorde.

## Casos cobertos

- `C7(#9,b13)` preserva `#9` e `b13` como `written-tension`.
- `C13(b9,#11)` preserva `b9`, `#11` e `13`.
- `Cm6/9` preserva `6` e `9` como graus estruturais.
- Shape `dominant7#9` preserva a `#9` soando como tensao escrita/inferida do
  acorde, sem alegar origem de partitura.
- `C7b5` trata `b5` como alteracao estrutural de voicing.
- `Caug` trata `#5` como suporte estrutural.
- `Csus4` preserva `4` como suspensao estrutural.
- Shape `Cmaj7(no5)` conserva a quinta estrutural omitida separada das notas
  soando.
- `Cmaj7(#11)` exibido em material lidio mostra `#11` como tensao escrita da
  cifra, nao como identidade modal generica.
- `C7b5` exibido em material lidio dominante mostra `b5` como alteracao
  estrutural, nao como ponto de repouso.
- `Cmaj7(no5)` no catalogo local mantem `G` no nucleo estrutural mesmo que o
  shape esteja soando apenas `C-E-B`.
- `dominant7#11` preserva `9` e `#11` mesmo se o `ChordCandidate` carregar
  intervalos defasados de uma dominante natural.
- Uma celula `C-E-G-B-F#` sobre `Cmaj7(#11)` deixa de ser classificada como
  apoio neutro apenas porque `F#` esta contido na cifra.
- Uma celula `C-E-Gb-Bb` sobre `C7b5` e tratada como tensao de gesto, preservando
  a alteracao estrutural.

## Validacao parcial

```text
npx vitest run --config vitest.curated.config.ts \
  scripts/material-chord-integrity.spec.ts \
  scripts/contextual-material-chord-context.spec.ts \
  scripts/contextual-material-candidates.spec.ts \
  scripts/chord-symbol-resolver.spec.ts

4 specs aprovadas
109 testes aprovados
```

Segundo encaixe validado com:

```text
npx vitest run --config vitest.curated.config.ts \
  scripts/local-material-note-roles.spec.ts \
  scripts/local-material-fretboard-notes.spec.ts \
  scripts/writer-material-fretboard-view.spec.ts

3 specs aprovadas
20 testes aprovados
```

Terceiro encaixe validado com:

```text
npx vitest run --config vitest.curated.config.ts \
  scripts/local-chord-vamp-material-catalog.spec.ts \
  scripts/local-chord-vamp-materials.spec.ts \
  scripts/contextual-material-candidates.spec.ts

3 specs aprovadas
88 testes aprovados
```

Quarto encaixe validado com:

```text
npx vitest run --config vitest.curated.config.ts \
  scripts/writer-material-improvisation-moves.spec.ts \
  scripts/writer-material-screen-model.spec.ts

2 specs aprovadas
37 testes aprovados
```

A auditoria contextual manteve:

```text
files: 199
harmonyEvents: 7424
noCandidate: 0
lowMelodyCoverage: 253
genericAlteredFallback: 0
```

## Fechamento

F360.1 entregou a identidade harmonica e os papeis de grau necessarios para
F360.2. Os consumidores ainda podem aprofundar casos de grafia e nomenclatura,
mas a base bloqueadora para celulas estruturadas esta pronta.

## Proximo encaixe

- Prosseguir em F360.2 e F360.3: usar IDs e eventos estruturados de celula sem
  quebrar o adaptador legado de `cells: string[]`.
