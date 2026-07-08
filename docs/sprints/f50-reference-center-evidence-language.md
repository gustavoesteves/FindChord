# F50 — Linguagem musical para evidencia de centro

## Objetivo

Transformar a evidencia interna usada para promover centro de referencia em texto mais musical.

A F49 tornou a origem do centro auditavel. A F50 melhora a forma como essa evidencia aparece para o usuario e no relatorio real.

## Decisao

`ReferenceAwarePhraseContext` agora formata as evidencias antes de grava-las em `PhraseContext.selectedCenterEvidence`.

Exemplos:

| Evidencia interna | Evidencia exibida |
| --- | --- |
| `ii-V-I local aponta G maior` | `cadência ii-V-I confirma G maior` |
| `iiø-V-i local aponta A menor` | `cadência iiø-V-i confirma A menor` |
| `repouso maior recorrente em Eb` | `repousos recorrentes sustentam Eb maior` |
| `acorde final sugere repouso em Eb` | `acorde final repousa em Eb` |
| `primeiro acorde sugere Bb maior` | `primeiro acorde apresenta Bb maior` |

## Produto

O diagnostico emitido quando a referencia ajusta o centro da frase agora inclui a primeira evidencia musical disponivel.

Exemplo:

```text
Centro da frase ajustado pela harmonia da seção: G maior. cadência ii-V-I confirma G maior.
```

## Relatorio real

O relatorio `docs/reports/f39-real-music-audit-report.md` passa a exibir evidencias como:

```text
- Evidencia do centro: cadência ii-V-I confirma G maior; repousos recorrentes sustentam G maior
```

## Limite

Esta fase nao muda inferencia, ranking ou geracao. Ela altera apenas a linguagem preservada no contexto.

O proximo passo natural e revisar capitalizacao/pontuacao das mensagens de diagnostico para ficarem completamente polidas na UI.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-aware-phrase-context.spec.ts scripts/real-music-audit-report.spec.ts scripts/real-music-fire-audit.spec.ts`
- `npm run report:real-music`
