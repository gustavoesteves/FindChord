# F51 — Evidencias de centro como frases completas

## Objetivo

Polir a apresentacao das evidencias de centro assistido por referencia.

A F50 traduziu a evidencia interna para linguagem musical. A F51 transforma esses trechos em frases prontas para relatorio e UI, com capitalizacao e pontuacao consistentes.

## Decisao

Foi adicionado:

```text
formatReferenceCenterEvidenceSentence(evidence)
```

Ele preserva a evidencia musical curta no `PhraseContext`, mas formata a superficie final quando o texto vai para relatorio ou diagnostico.

## Exemplo

Antes:

```text
cadência ii-V-I confirma G maior; repousos recorrentes sustentam G maior
```

Depois:

```text
Cadência ii-V-I confirma G maior. Repousos recorrentes sustentam G maior.
```

## Produto

O diagnostico de centro assistido pela referencia agora inclui uma evidencia como frase completa:

```text
Centro da frase ajustado pela harmonia da seção: G maior. Cadência ii-V-I confirma G maior.
```

## Relatorio real

O relatorio `docs/reports/f39-real-music-audit-report.md` passa a exibir evidencias com frases independentes:

```text
- Evidencia do centro: Cadência ii-V-I confirma G maior. Repousos recorrentes sustentam G maior.
```

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-aware-phrase-context.spec.ts scripts/real-music-audit-report.spec.ts scripts/real-music-fire-audit.spec.ts`
- `npm run report:real-music`
