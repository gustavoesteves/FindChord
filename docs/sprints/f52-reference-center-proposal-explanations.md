# F52 — Evidencia de centro nas explicacoes da proposta

## Objetivo

Levar a evidencia do centro assistido por referencia para dentro da explicacao da propria proposta.

A F49/F51 tornaram a decisao visivel no relatorio e no diagnostico global. A F52 faz com que o card da proposta tambem explique por que nasceu naquele centro.

## Decisao

Quando `PhraseContext.selectedCenterSource` e `reference`, toda proposta gerada nesse contexto recebe uma explicacao adicional:

```text
Centro da frase: Cadência ii-V-I confirma G maior.
```

Essa explicacao usa a primeira evidencia musical de `selectedCenterEvidence`, ja formatada como frase completa.

## Escopo

A mudanca e aplicada como enriquecimento pos-geracao:

```text
attachReferenceAssistedExplanation(proposal, phraseContext)
```

Isso evita alterar cada estrategia isoladamente e mantem o comportamento harmonico intacto.

## Caminhos cobertos

- `generateAcceptedProposals`
- `tryStrategy`

O helper evita duplicacao caso uma proposta passe pelos dois caminhos.

## Por que importa

Sem essa frase, a proposta pode parecer ter escolhido um centro local arbitrariamente. Com ela, o usuario ve que a decisao veio da harmonia de referencia da janela/secao.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-aware-phrase-context.spec.ts scripts/harmonic-strategy-properties.spec.ts scripts/real-music-audit-report.spec.ts`
