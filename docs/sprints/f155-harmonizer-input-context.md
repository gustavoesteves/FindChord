# F155 - Contexto de entrada no Harmonizar

## Objetivo

Transformar a distincao teorica da F154 em contrato operacional do motor: cada proposta pode carregar de onde veio o material musical usado pelo Harmonizar.

## Contextos criados

```text
melody-only
melody-with-reference-harmony
harmony-only-analysis
```

Na UI, esses nomes internos viram linguagem de compositor:

```text
Criado a partir da melodia
Comparado com a harmonia da partitura
Analise da progressao
```

## O que mudou

- `ReharmonizationProposal` ganhou `inputContext`.
- `resolveHarmonizerInputContext` decide o contexto pelos materiais disponiveis:
  - melodia sem cifras: `melody-only`;
  - melodia com cifras: `melody-with-reference-harmony`;
  - cifras sem melodia: `harmony-only-analysis`.
- O fluxo principal do Harmonizar aplica esse contexto aos cards.
- A harmonia de referencia tambem recebe o contexto, para deixar claro que ela esta sendo comparada com a melodia quando a melodia existe.
- Trechos locais herdam o mesmo contexto da secao.
- O card mostra uma etiqueta curta abaixo do titulo.

## Limite assumido

Esta sprint nao implementa ainda o terceiro modo como funcionalidade completa. `harmony-only-analysis` existe como contrato e linguagem, mas a tela ainda depende de melodia para gerar harmonizacoes.

Isso e intencional: sem melodia, o sistema deve analisar e transformar progressao, nao prometer harmonizacao validada melodicamente.

## Validacao

- `scripts/harmonization-proposal-card-labels.spec.ts` protege as etiquetas de contexto.
- `scripts/local-segment-harmonization.spec.ts` confirma que trechos locais continuam funcionando.
- `scripts/bright-size-life-diagnostic.spec.ts` confirma que o fluxo melodia + harmonia autoral preserva o comportamento esperado.
- `npm run build` confirmou tipagem e empacotamento.

## Proximo passo

Usar `inputContext` para melhorar a curadoria do caso mais importante do catalogo real:

```text
melody-with-reference-harmony
```

O alvo e separar melhor:

- propostas criadas pela melodia;
- propostas que preservam ritmo harmonico da partitura;
- propostas que divergem da harmonia autoral por escolha funcional clara.

