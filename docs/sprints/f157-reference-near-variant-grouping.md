# F157 - Agrupamento de leituras proximas da harmonia autoral

## Objetivo

Reduzir duplicacao visual quando uma proposta gerada e quase a mesma ideia musical da harmonia escrita pelo autor.

Depois da F156, o sistema ja sabe dizer se uma proposta esta proxima da partitura. A F157 usa essa informacao para curadoria:

```text
se a proposta preserva mesma funcao, mesma raiz, mesmo baixo e muda basicamente a cor,
ela vira leitura proxima da referencia em vez de card independente.
```

## O que mudou

- `groupNearReferenceVariants` compara propostas geradas com a proposta `reference`.
- Leituras quase equivalentes sao movidas para `colorVariants` da referencia.
- No card da referencia, essas variantes aparecem como `Leituras próximas`, nao como `Variações de cor`.
- O botao dessas leituras diz `Usar leitura`, evitando tratar a cifra do autor como uma variacao qualquer.
- Propostas que mudam baixo, raiz, funcao ou escopo continuam como cards independentes.

## Decisao musical

Uma extensao, tensao ou cor a mais nao deve ocupar o mesmo espaco visual que uma rearmonizacao com nova consequencia musical.

Exemplo conceitual:

```text
Referencia: C / D7 / G7 / C
Proposta:   Cmaj7 / D7(b13) / G9 / C6
```

Essa proposta pode ser util, mas nao e uma nova rota harmonica. Ela e uma leitura colorida da mesma ideia.

Ja uma proposta como:

```text
C / D7/F# / G7 / C
```

continua independente, porque altera o baixo e a conducao.

## Validacao

- `scripts/proposal-consequence-similarity.spec.ts` protege o agrupamento de leituras proximas da referencia.
- `scripts/audit-proposal-curation.ts` agora aplica o mesmo agrupamento antes de gerar o relatorio F108.
- `scripts/audit-proposal-consequence-similarity.ts` agora mede por padrao o conjunto pos-curadoria; candidatos brutos ainda podem ser investigados com `includeGroupedVariants: true`.
- `scripts/harmonization-proposal-card-labels.spec.ts` protege a linguagem `Leituras próximas` / `Usar leitura`.
- `scripts/bright-size-life-diagnostic.spec.ts` confirma que o fluxo com harmonia autoral segue estavel.
- `docs/reports/f108-proposal-curation.md` foi regenerado para 199 partituras, sem nenhum caso com zero ou uma ideia visivel.
- `docs/reports/f109-proposal-consequence-similarity.md` foi regenerado para 199 partituras e ficou com zero pares quase equivalentes visiveis.
