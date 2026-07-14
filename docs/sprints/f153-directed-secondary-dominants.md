# F153 - Dominantes secundarias com preparacao cromatica dirigida

## Objetivo

Transformar a familia do exemplo `d` de Carlos Almada em uma rota geravel pelo motor, sem depender de copia literal da partitura: usar dominantes secundarias como preparacao funcional, com baixo cromatico claro ate a dominante.

## Rota implantada

Para uma frase maior de quatro compassos, a estrategia `DOMINANTES_SECUNDARIAS` tenta primeiro uma versao dirigida:

```text
I -> V7/IV -> IVmaj7 -> V7/V/#IV -> V7 -> Imaj7
```

Em C:

```text
C / C7 / Fmaj7 / D7/F# / G7 / Cmaj7
```

Isso cobre a ideia central do exemplo `d` do Almada:

```text
C / C7 / F7M / D7/F# / G7 / C7M
```

## Decisao de apresentacao

O modo equilibrado agora evita que uma cor cromatica sem apoio de referencia vire resposta principal quando existe uma rota estavel centrada disponivel. No caso do exemplo do Almada, `Dominantes alteradas` continua aparecendo como alternativa, mas `Tonal Classico` permanece como card principal.

## Validacao

- `scripts/harmonic-strategy-properties.spec.ts` fixa a rota `C / C7 / Fmaj7 / D7/F# / G7 / Cmaj7` e o baixo `C -> C -> F -> F# -> G -> C`.
- `scripts/almada-example-comparison.spec.ts` exige que o exemplo `d` esteja coberto por `Estratégia — Dominantes secundárias`.
- `scripts/proposal-presentation-planner.spec.ts` protege a curadoria do modo equilibrado contra cromatismos sem apoio virando primary.
- `docs/reports/f79-almada-example-comparison.md` registra 8 exemplos cobertos, 4 parciais e nenhuma lacuna pratica de vocabulario no conjunto do Almada.

