# F335 - Origem dos materiais na UI do Harmonizar

## Objetivo

Tornar visivel, de forma discreta, se uma sugestao de material melodico vem do mapa estrutural do acorde ou do catalogo curado de vocabulario.

## Decisao

O sistema passa a tratar a origem como parte do contrato das leituras contextuais:

- `source-map`: leitura estrutural derivada do mapa do acorde.
- `curated-catalog`: vocabulario melodico curado, com celulas e ideias aplicaveis.

Essa origem nao muda o ranking por si so. Ela serve para o compositor entender a natureza da sugestao sem transformar a UI em relatorio tecnico.

## Implementacao

- `ContextualMaterialCandidate` ja carrega `materialOrigin`.
- Regioes de material e caminhos melodicos tambem passam a preservar essa origem.
- A UI do painel de materiais no Harmonizar exibe badges curtos:
  - `Mapa`
  - `Vocabulário`
- Os agrupamentos de regiao e rota nao misturam leituras de origens diferentes.

## Resultado esperado

O compositor consegue distinguir rapidamente:

- quando esta olhando para um fundamento seguro do acorde;
- quando esta olhando para vocabulario idiomatico aproveitavel em fraseado;
- quando uma rota melodica ou regiao longa nasce de uma leitura estrutural ou de uma ideia curada.

## Proximo passo

Usar a mesma clareza no modulo Escrever, em especial na tela Materiais do acorde, para que a navegacao em um acorde isolado funcione como uma tela de vamp: fundamento, cor, tensao e vocabulario pratico sem depender de contexto harmonico.
