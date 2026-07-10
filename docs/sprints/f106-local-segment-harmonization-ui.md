# F106 - Trechos locais no Harmonizar

## Objetivo

Levar o seletor de janelas harmonizaveis da F105 para o fluxo real do Harmonizar, preservando a proposta global como leitura principal e oferecendo alguns trechos locais quando a musica tiver regioes boas para harmonizacao propria.

## Implementacao

- Criei `src/domains/harmonizer/services/localSegmentHarmonization.ts`.
- O servico calcula segmentos locais a partir de:
  - ancoras melodicas completas da secao;
  - cifras de referencia da secao;
  - compassos da janela primaria;
  - modo de apresentacao atual.
- Cada segmento devolve:
  - compassos cobertos;
  - centro local;
  - motivo musical simples;
  - quantidade de propostas geradas;
  - proposta primaria local.
- Atualizei `selectMelodicAnchors` para manter `allAnchors`, sem alterar o uso atual de `anchors` truncadas na proposta global.
- Atualizei `useHarmonizerProposals` para retornar `localSegments`.
- Atualizei `HarmonizerProposalList` para mostrar uma secao `Trechos locais`.
- Atualizei `HarmonizationProposalCard` para aceitar um rotulo de aplicacao especifico, usado como `Aplicar trecho em Escrever`.
- Adicionei `scripts/local-segment-harmonization.spec.ts` na suite curada.

## Decisao de produto

A proposta global continua sendo a experiencia principal. Os trechos locais entram como complemento controlado, no maximo algumas sugestoes, para evitar que a tela vire uma lista tecnica de janelas.

Na interface, os motivos aparecem em linguagem musical curta:

- `Boa referência`
- `Tensão local`
- `Trecho local`

Os termos internos (`reference-coverage`, `interesting-event`, `primary-window`) ficam restritos ao motor e aos relatórios.

## Proximo passo sugerido

Avaliar visualmente no app com musicas reais:

1. conferir se os trechos locais aparecem em quantidade musicalmente util;
2. verificar se aplicar um trecho no Escrever deixa claro que e uma progressao local;
3. ajustar a ordenacao dos segmentos com base nos casos reais;
4. decidir se a UI precisa de selecao de trecho ativa ou se a lista complementar basta.
