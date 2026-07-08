# F48 — Centro de frase assistido por referencia

## Objetivo

Usar a harmonia existente da partitura como evidencia de centro antes da geracao de propostas, sem transformar a referencia em gabarito absoluto.

A F47 tornou visivel quando a proposta acompanha o centro global mas ignora uma tonicizacao local, ou quando acompanha o centro local e se afasta do global. A F48 fecha o ciclo seguinte:

> Quando a referencia local tem evidencia media ou forte de centro, a geracao deve poder partir desse centro.

## Decisao

Foi criado um refinador de contexto:

```text
applyReferenceCenterToPhraseContext(phraseContext, referenceHarmonies)
```

Ele preserva o `PhraseAnalysisEngine` como motor melodico principal, mas promove o centro inferido da referencia quando a confianca e `medium` ou `strong`.

Centros fracos nao sequestram a leitura melodica.

## Onde entra

### Auditoria real

Em `scripts/real-music-audit.ts`, cada janela melodica passa a analisar somente as cifras que caem nos compassos da propria janela.

Isso permite que uma janela com ii-V-I, iiø-V-i ou repouso local claro gere propostas a partir do centro local, nao apenas da armadura ou do centro melodico bruto.

### Produto

Em `useHarmonizerProposals`, a secao harmonica ativa tambem pode refinar o contexto antes da geracao.

Isso preserva a experiencia de rearmonizacao sobre uma partitura real: se o usuario abriu uma secao com cifras, o sistema pode escutar essas cifras como contexto.

## Contrato

- Sem harmonia de referencia: nada muda.
- Referencia com centro fraco: nada muda.
- Referencia com centro medio ou forte: o centro da referencia entra como `selectedCenter`.
- O centro promovido tambem entra na lista de candidatos tonais.

## Resultado musical esperado

A proposta deixa de ser obrigada a explicar toda janela pelo centro global quando a propria referencia local aponta uma regiao temporaria.

Exemplos que passaram a ficar mais legiveis no relatorio real:

- `Bright Size Life`: proposta acompanha centro local `G`, embora divirja do centro global `D`;
- `a fine romance`: proposta acompanha centro local `D menor`, embora divirja do centro global `C`;
- `affirmation`: proposta acompanha centro local `G`, embora divirja do centro global `B menor`;
- `depois de muito discutir`: proposta acompanha centro local `G menor`, embora divirja do centro global `F`.

## Limite

Esta fase nao substitui a analise melodica por uma analise da referencia. Ela apenas permite que uma referencia confiavel escolha o campo gravitacional inicial.

Ainda falta:

1. explicar na UI quando o centro foi assistido pela referencia;
2. diferenciar centro de secao e centro de janela no produto;
3. usar cadencias locais detectadas como estrategias positivas de geracao, nao apenas como centro inicial.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-aware-phrase-context.spec.ts scripts/real-music-audit-report.spec.ts scripts/real-music-fire-audit.spec.ts scripts/reference-harmony-comparator.spec.ts scripts/autumn-leaves-diagnostic.spec.ts scripts/bright-size-life-diagnostic.spec.ts`
- `npm run report:real-music`
