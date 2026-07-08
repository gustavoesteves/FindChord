# F45 — Inferencia de centro da referencia

## Objetivo

A F45 melhora a comparacao com harmonia de referencia.

Antes, o centro da referencia era inferido de modo simples demais, muitas vezes pelo primeiro acorde. Em standards e repertorio jazz, isso gera falsos alertas, porque o primeiro acorde pode ser:

- ii de uma cadencia;
- dominante secundaria;
- turnaround;
- acorde de aproximacao;
- inicio de uma frase que ainda nao repousou.

## Ajuste implementado

`ReferenceHarmonyAnalysis` agora infere um centro de referencia com evidencias.

A inferencia considera:

- celulas ii-V-I;
- celulas iiø-V-i;
- acordes de repouso maiores ou menores;
- acorde final;
- primeiro acorde apenas como evidencia fraca.

O resultado inclui:

- tonica;
- modo;
- confianca;
- evidencias.

## Arquivos alterados

- `src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis.ts`
- `src/utils/music/analysis/strategies/ReferenceHarmonyComparator.ts`
- `scripts/reference-harmony-analysis.spec.ts`
- `scripts/real-music-audit.ts`
- `scripts/real-music-audit-report.spec.ts`
- `docs/reports/f39-real-music-audit-report.md`

## Exibicao no relatorio

O relatorio real agora mostra:

```text
Centro da referencia: C major; confiança strong
```

Isso torna mais transparente a causa `centro divergente`.

## Consequencia musical

A comparacao fica mais justa para repertorio com cadencias locais, porque `Dm7 -> G7 -> Cmaj7` passa a apontar para C maior, nao para D menor.

Da mesma forma, `Bm7(b5) -> E7 -> Am6` aponta A menor, nao B.

## Limites atuais

A inferencia ainda e uma heuristica inicial.

Ela ainda nao considera:

- duracao real ponderada de cada cifra;
- forma ou secoes;
- modulacoes longas;
- centros concorrentes por periodo;
- tonalidade declarada da partitura como evidencia explicita.

## Proximo passo

A proxima fase pode separar centro global e centro local.

Isso e importante porque muitos standards alternam:

- centro global da forma;
- ii-V locais;
- tonicizacoes passageiras;
- secoes A/B com centros diferentes.

O sistema deve conseguir dizer: "a referencia esta em C maior globalmente, mas esta janela toniciza A menor".
