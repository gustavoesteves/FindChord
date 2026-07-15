# F156 - Relacao musical com a harmonia autoral

## Objetivo

Melhorar o caso `melody-with-reference-harmony` sem transformar a harmonia do autor em gabarito absoluto.

A F155 dizia de onde vem o material musical. A F156 acrescenta uma segunda pergunta:

```text
Qual e a relacao desta proposta com a harmonia escrita na partitura?
```

## Relacoes criadas

O modelo `ReharmonizationProposal` ganhou `referenceRelation`:

```text
reference-original
reference-rhythm-preserved
reference-close
reference-functional-variation
melody-derived-alternative
harmony-only-reading
```

Na UI, isso vira linguagem musical:

```text
Cifra escrita pelo autor
Preserva o ritmo harmonico da partitura
Proxima da harmonia da partitura
Varia a partitura mantendo funcao
Alternativa guiada pela melodia
Leitura sem validacao melodica
```

## Criterios

- A proposta de referencia recebe `Cifra escrita pelo autor`.
- `Rearmonização — ritmo harmônico da partitura` recebe `Preserva o ritmo harmonico da partitura`.
- Propostas com alto acordo de raiz com a referencia recebem `Proxima da harmonia da partitura`.
- Propostas com acordo funcional ou bonus de funcao aparente recebem `Varia a partitura mantendo funcao`.
- As demais propostas em contexto com harmonia autoral recebem `Alternativa guiada pela melodia`.
- O contexto `harmony-only-analysis` recebe `Leitura sem validacao melodica`.

## Decisao de produto

Esta informacao aparece como etiqueta curta no card, abaixo do contexto de entrada.

Ela evita duas leituras erradas:

- achar que toda proposta deve copiar a cifra do autor;
- achar que toda divergencia da partitura e erro do motor.

## Curadoria compacta

No modo compacto da camada `Rearmonizações progressivas`, a lista agora reserva espaco para relacoes importantes com a partitura:

1. proposta principal;
2. proposta que preserva o ritmo harmonico da partitura;
3. variacao funcional da referencia;
4. proposta proxima da referencia;
5. familias progressivas distintas;
6. uma exploracao mais distante, quando existir.

Isso evita que o card de ritmo harmonico da partitura desapareca quando ha muitas rearmonizacoes cromaticas competindo pela tela.

## Validacao

- `scripts/harmonization-proposal-card-labels.spec.ts` protege as novas etiquetas e a classificacao de relacao.
- `scripts/harmonizer-proposal-list-curation.spec.ts` protege a presenca de relacoes importantes com a partitura no modo compacto.
- `scripts/bright-size-life-diagnostic.spec.ts` confirma que o fluxo melodia + harmonia autoral segue estavel.
- `npm run build` passou.
- `npm run test:curated` passou com 465 testes.

## Proximo passo

Usar `referenceRelation` para refinar a ordenacao/agrupamento visual:

- manter `Cifra escrita pelo autor` como leitura de obra;
- agrupar propostas que preservam ritmo harmonico da partitura;
- destacar divergencias que sejam claramente guiadas pela melodia;
- evitar que alternativas muito proximas da referencia dupliquem cards sem acrescentar ideia musical.
