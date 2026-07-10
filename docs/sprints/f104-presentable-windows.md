# F104 - Janelas apresentaveis por musica

## Objetivo

Verificar se os eventos problematicos da F98/F103 ficam fora da experiencia principal porque o motor nao sabe gerar alternativas ou porque a janela melodica primaria nao cobre o trecho certo da musica.

## Implementacao

- Criei `scripts/audit-presentable-windows.ts` para percorrer janelas melodicas por musica.
- Classifiquei janelas por tres razoes:
  - `primary-window`: janela escolhida hoje pelo fluxo principal.
  - `reference-coverage`: janela com boa quantidade de cifras de referencia.
  - `interesting-event`: janela que cobre um evento de dominante nao resolvida mapeado na F98.
- Gereis os artefatos:
  - `docs/reports/f104-presentable-windows.md`
  - `docs/reports/f104-presentable-windows.csv`
- Adicionei `scripts/presentable-windows-audit.spec.ts` ao `vitest.curated.config.ts`.

## Resultado

- Musicas analisadas: 7
- Janelas apresentaveis: 179
- Janelas destacadas no Markdown: 47
- Janelas primarias: 7
- Janelas com evento F98: 32

O Markdown destaca as janelas mais importantes para leitura humana: a janela primaria, as janelas com eventos harmonicamente interessantes e as melhores janelas de referencia por musica. O CSV preserva o conjunto completo.

## Leitura musical

A F102 mostrou que poucos eventos F98 aparecem na janela harmonizavel selecionada pelo fluxo principal. A F103 mostrou que, quando forcamos a janela em torno do evento, o motor consegue gerar candidatos laterais em 6 de 8 casos.

A F104 transforma isso em uma hipotese de produto: alem de uma harmonizacao global, o sistema precisa conseguir expor janelas locais harmonizaveis. Isso e especialmente importante para musicas reais, em que uma unica janela inicial pode esconder regioes boas de rearmonizacao, dominantes laterais, cadencias locais ou trechos onde a referencia do autor e mais rica.

## Proximo passo sugerido

Criar um seletor interno de segmentos harmonizaveis:

1. manter uma janela primaria para a experiencia simples;
2. detectar janelas secundarias com boa cobertura melodica/harmonica;
3. marcar janelas com eventos interessantes, como dominantes alteradas sem resolucao direta;
4. permitir que a interface apresente esses trechos como opcoes de harmonizacao local, sem substituir a proposta global.

Isso preserva a ideia central do projeto: partir da melodia e da coerencia harmonica, mas reconhecer que uma musica real pode precisar de varias leituras locais em vez de uma decisao unica para a peca inteira.
