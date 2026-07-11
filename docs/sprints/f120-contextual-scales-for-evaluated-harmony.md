# F120 - Escalas para a harmonia avaliada

## Problema

O painel contextual dependia exclusivamente das cifras importadas da
partitura. Em uma analise melodia-first, como Asa Branca, a partitura nao tem
cifras e o painel desaparecia, embora o harmonizador ja tivesse produzido uma
proposta.

## Correcao

A fonte contextual agora segue esta ordem:

1. harmonia de referencia da partitura, quando existe;
2. proposta primaria avaliada pelo harmonizador, quando a referencia esta
   ausente.

O titulo da UI distingue os dois casos: `Leituras da harmonia de referencia`
ou `Leituras da harmonia proposta`.

## Resultado

Asa Branca e outras partituras sem cifra agora podem mostrar escalas,
tensoes, cobertura melodica e alvos de resolucao a partir da harmonia que o
sistema esta efetivamente avaliando. Isso alinha a funcionalidade com a
pergunta correta: escala compativel com qual harmonia e em qual trecho?

## Verificacao

- teste melodia-first para `C -> F -> G7 -> C` aprovado;
- TypeScript e `git diff --check` aprovados;
- a UI permanece sem painel contextual apenas quando nao ha melodia para
  formar contexto.
