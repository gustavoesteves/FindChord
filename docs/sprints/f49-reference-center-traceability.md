# F49 — Rastreabilidade do centro assistido por referencia

## Objetivo

Depois da F48, o sistema passou a poder promover o centro da frase a partir da harmonia de referencia. A F49 torna essa decisao visivel e auditavel.

Sem esse rastro, o motor poderia tomar uma boa decisao musical, mas parecer arbitrario no relatorio ou na UI.

## Decisao

`PhraseContext` agora carrega:

```text
selectedCenterSource: "melody" | "reference"
selectedCenterEvidence?: string[]
```

Quando o centro vem da leitura melodica, a origem e `melody`.

Quando `applyReferenceCenterToPhraseContext` promove um centro de referencia com confianca media ou forte, a origem vira `reference` e as evidencias da inferencia sao preservadas.

## Relatorio real

O relatorio em `docs/reports/f39-real-music-audit-report.md` passa a exibir, quando aplicavel:

```text
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: ...
```

Isso ajuda a separar tres situacoes:

1. centro escolhido pela melodia;
2. centro escolhido pela harmonia da janela;
3. divergencia posterior contra centro local/global da referencia.

## Produto

`useHarmonizerProposals` agora emite um diagnostico de referencia quando o centro da frase foi ajustado pela harmonia da secao.

Mensagem atual:

```text
Centro da frase ajustado pela harmonia da seção: X maior/menor.
```

Ela aparece nos modos equilibrado e exploratorio, mantendo o modo simples mais limpo.

## Limite

Esta fase nao muda a regra de promocao de centro. Ela apenas expoe a causa da decisao.

O proximo refinamento natural e transformar `selectedCenterEvidence` em texto mais musical e menos dependente da formulacao interna do inferidor.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-aware-phrase-context.spec.ts scripts/real-music-audit-report.spec.ts scripts/real-music-fire-audit.spec.ts`
- `npm run report:real-music`
