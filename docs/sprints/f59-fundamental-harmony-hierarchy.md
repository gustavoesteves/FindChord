# F59 - Hierarquia de harmonia fundamental

## Objetivo

Separar claramente harmonizacao basica de rearmonizacao.

A primeira leitura da melodia deve tentar responder com o vocabulario mais elementar possivel:

- tonica;
- subdominante;
- dominante.

So depois dessa base aparecer e ser avaliada o sistema deve recorrer a acordes diatonicos ampliados, cadencias locais, funcao aparente, emprestimos, SubV7 ou cromatismos.

## O que mudou

- A estrategia `I_IV_V` validada continua sendo a resposta basica principal quando passa com seguranca.
- Quando o `I_IV_V` rigido nao passa, o motor agora gera uma proposta separada: `Estrategia - Harmonia fundamental I-IV-V`.
- Essa proposta usa apenas `I`, `IV` e `V` como primeira leitura da melodia.
- Se essa base cobre apenas parcialmente a melodia, ela fica como alternativa pedagogica, e uma camada diatonica mais rica pode assumir a proposta primaria.

## Caso Bright Size Life em modo melodia-only

Em `Bright Size Life.musicxml`, quando a auditoria ignora as cifras existentes e roda o caminho melodia-only, a melodia inicial nao se sustenta bem em `I/IV/V` puro.

O motor agora mostra:

- uma base `I/IV/V` como leitura fundamental;
- uma proposta `Melodia primeiro` como resposta primaria, usando acordes diatonicos com extensoes simples;
- a cadencia local para `Bm` como exploracao aventureira, nao como primeira resposta.

Isso impede que o sistema salte direto para uma alternativa sofisticada antes de explicitar a base funcional mais simples.

## Proximo passo

Levar essa hierarquia para a apresentacao do Harmonizar:

1. Harmonia fundamental.
2. Diatonica ampliada / melodia primeiro.
3. Cadencias locais.
4. Cores funcionais.
5. Cromatismos e rearmonizacoes.
