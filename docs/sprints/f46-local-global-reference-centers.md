# F46 — Centro global e centro local da referencia

## Objetivo

A F46 aprofunda a F45.

F45 melhorou a inferencia do centro da referencia, evitando tomar o primeiro acorde como centro por padrao. F46 separa duas perguntas diferentes:

- qual e o centro global sugerido pela harmonia de referencia inteira?
- qual e o centro local da janela que esta sendo comparada com a proposta?

Essa diferenca e essencial em jazz e musica popular harmonizada, porque uma obra pode estar globalmente em C maior e, numa janela curta, tonicizar A menor, D menor, G maior ou outra regiao.

## Ajuste implementado

`ReferenceHarmonyComparator` agora calcula:

- centro global da referencia, usando a harmonia completa;
- centro local da referencia, usando apenas os compassos que sobrepoem a proposta primaria;
- centro ativo da comparacao, preferindo o centro local quando ele existe.

## Arquivos alterados

- `src/utils/music/analysis/strategies/ReferenceHarmonyComparator.ts`
- `scripts/reference-harmony-comparator.spec.ts`
- `scripts/real-music-audit.ts`
- `docs/reports/f39-real-music-audit-report.md`

## Exibicao no relatorio

Quando centro local e global coincidem, o relatorio mostra apenas uma leitura:

```text
Centro da referencia: Bb major; confiança medium
```

Quando divergem, o relatorio mostra os dois:

```text
Centro da referencia: janela D minor; confiança medium; global C major; confiança strong
```

## Leitura musical

Essa fase evita dois erros:

1. comparar uma janela local usando apenas o centro global da obra;
2. chamar de erro uma tonicizacao local que a propria referencia esta sustentando.

Agora a causa `centro divergente` fica mais justa: ela compara a proposta contra o centro ativo da janela quando a referencia oferece evidencia local.

## Limites atuais

A inferencia local ainda depende da janela escolhida pela auditoria.

Ela ainda nao modela:

- modulacoes longas;
- centro por secao formal;
- duracao ponderada de cada cifra;
- concorrencia entre varios centros locais na mesma janela.

## Proximo passo

A proxima fase pode criar diagnosticos de centro mais ricos:

- proposta diverge do centro local;
- proposta diverge do centro global, mas acompanha centro local;
- proposta acompanha centro global, mas ignora tonicizacao local;
- referencia nao oferece centro local confiavel.

Isso deve transformar `centro divergente` em uma explicacao mais musical e menos binaria.
