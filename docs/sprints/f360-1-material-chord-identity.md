# F360.1 - Identidade harmonica para materiais

**Status:** em andamento
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

A auditoria contextual manteve:

```text
files: 199
harmonyEvents: 7424
noCandidate: 0
lowMelodyCoverage: 253
genericAlteredFallback: 0
```

## Proximo encaixe

- Fazer `localMaterialNoteRoles` consumir `MaterialChordIdentity` para abandonar
  inferencias por substring de `sourceType`.
- Propagar a identidade para `localMaterialFretboardNotes` e para o screen model
  do `Escrever`.
- Fazer o catalogo local receber a identidade completa mantendo `quality` apenas
  como indice de familia.
