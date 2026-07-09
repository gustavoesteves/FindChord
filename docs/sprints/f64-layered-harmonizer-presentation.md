# F64 - Apresentacao em camadas no Harmonizar

## Objetivo

Implementar o refinamento pedido pela F63: o modo `Harmonizar` deve organizar propostas por camada musical, nao apenas como uma lista plana.

## O que mudou

- O `ProposalPresentationPlanner` exporta `groupProposalsByPresentationLayer`.
- A UI do harmonizador agrupa propostas estruturais em:
  - Harmonia basica;
  - Centro de referencia;
  - Rearmonizacao.
- As cores funcionais continuam em bloco separado, porque funcionam como camada de cor/rearmonizacao pontual.
- A regra de camada foi refinada: estar em um contexto de referencia nao torna automaticamente qualquer proposta `reference-aware`.

## Regra atual

- `basic`: proposta estrutural simples ou moderada que nao depende diretamente da referencia.
- `reference-aware`: proposta da referencia escrita ou estratégia explicitamente centrada na referencia.
- `reharmonization`: proposta controlada, exploratoria, cromatica/radical ou baseada em funcao aparente/substituicao.

## Por que isso importa

A F61 mostrou que o problema principal nao era falta de acordes complexos, mas falta de hierarquia:

1. resposta basica;
2. leitura contextual/autoral;
3. alternativa criativa.

Com a apresentacao em camadas, o usuario consegue ver essa hierarquia sem precisar ler a explicacao detalhada de cada proposta.

## Proximo passo

Usar essa mesma camada para selecionar a acao padrao:

1. aplicar a melhor `basic` quando o usuario quer harmonizacao simples;
2. aplicar a melhor `reference-aware` quando ele quer seguir a referencia;
3. aplicar `reharmonization` apenas quando ele escolhe uma alternativa criativa.
