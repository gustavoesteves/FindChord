# F180 - Fechamento do improviso funcional e ponte para o Escrever

## Objetivo

Fechar a primeira familia de materiais melodicos para improviso funcional e reaproveitar parte dessa inteligencia em `Escalas Compativeis`, sem confundir exploracao local com analise contextual.

## Fechamento funcional

Com F176-F179, o `Harmonizar` ja possui materiais para:

- dominante diminuta H/W;
- dominante alterado;
- SubV lidio dominante;
- iiø-V-i com locrio #2.

Essas familias cobrem a primeira camada funcional de improviso: dominante, substituicao dominante, preparacao menor e tensao/resolucao.

## Ponte para o Escrever

`ScaleOverlayPanel` agora reaproveita `buildContextualScaleCandidates` com contexto minimo:

```ts
buildContextualScaleCandidates({ chord: activeChord.notationInternational })
```

Quando a escala selecionada possui `melodicMaterials`, o painel mostra:

```text
Materiais melodicos
```

com celulas praticaveis e foco curto.

## Contrato de apresentacao

No `Escrever`, os materiais sao exploratorios:

- podem aparecer para `A7(b9)` como vocabulario do acorde;
- podem aparecer para `Bm7b5` como material meio-diminuto;
- nao devem afirmar resolucao se nao houver proximo acorde;
- materiais contextuais como SubV dependem do `Harmonizar`.

## Validacao

- `npm run test:curated -- scripts/contextual-scale-candidates.spec.ts scripts/compatible-scales.spec.ts`
- `npm run build`
