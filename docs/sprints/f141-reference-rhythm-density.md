# F141 - Densidade pelo ritmo harmonico da referencia

## Objetivo

Reduzir a lacuna entre referencias reais com mais de uma cifra por compasso e as propostas geradas pelo Harmonizar, sem transformar melodias simples em harmonias artificialmente densas.

## Decisao musical

Quando a partitura ja traz cifras, o sistema pode usar o ritmo harmonico da propria referencia como guia. Isso nao depende de genero: a densidade vem da escrita do autor, e a proposta gerada troca acordes por equivalentes funcionais simples apenas quando a melodia sustenta a leitura.

Para partituras sem cifra, como `asa branca.musicxml`, o comportamento continua melody-first e de baixa densidade.

## Implementacao

- `buildControlledReharmonizationProposals` agora tambem pode criar `Rearmonização — ritmo harmônico da partitura`.
- A proposta preserva a quantidade e posicao das cifras da referencia.
- Cada cifra passa por uma pequena paleta funcional do centro analisado:
  - repouso: tonicizantes diatonicos simples;
  - preparacao: ii/IV ou iiø/iv em menor;
  - dominante: V7 e leituras proximas.
- A troca so ocorre se nao repetir a raiz original e se a melodia do compasso aceitar a substituicao.

## Resultado

`docs/reports/f113-harmonization-density.md` foi regenerado:

- Partituras analisadas: 199
- Referencias com mais de uma cifra em algum compasso: 182
- Lacunas de densidade detectadas: 0
- Partituras sem referencia: 2

## Regressao

- `asa branca.musicxml` continua sem alternativa densa gerada.
- `Ain't misbehavin.musicxml` agora recebe uma alternativa densa controlada quando a referencia tem ritmo harmonico interno.

## Proximo refinamento

Auditar musicalmente alguns casos densos para separar tres situacoes:

- a alternativa derivada da referencia ficou musicalmente util;
- a alternativa preservou densidade, mas ainda soa mecanica;
- a referencia possui idioma/contexto que exige vocabulario mais especifico do que a paleta funcional simples.
