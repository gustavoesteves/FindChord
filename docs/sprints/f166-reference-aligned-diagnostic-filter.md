# F166 - Filtro de diagnosticos em rotas estruturais de referencia

## Objetivo

Evitar que a UI e a F39 mostrem avisos de geracao como erro quando a proposta primaria preserva fortemente a harmonia de referencia.

Antes deste ajuste, casos com `Rearmonização — contorno da partitura` perfeitamente alinhada ainda podiam exibir mensagens como:

```text
ii-V local omitido
SubV7 omitido
Apoio melódico descoberto
```

Isso era confuso para o compositor: a rota da partitura estava sendo preservada, mas o diagnostico parecia acusar uma falha da proposta.

## Mudanca

Foi criada uma regra compartilhada entre UI e auditoria:

```text
se a proposta primaria preserva estruturalmente a referencia
e tem forte acordo de funcao e raiz,
entao diagnosticos de geracao sao suprimidos.
```

Diagnosticos de referencia e apresentacao continuam visiveis.

## Criterio

A supressao acontece quando a proposta primaria e uma leitura estrutural da referencia:

```text
controlled-reference-contour
controlled-reference-rhythm
reference-contour-preserved
reference-rhythm-preserved
reference-close
```

E quando a comparacao com a referencia e forte:

```text
referenceFunctionAgreement >= 0.75
referenceRootAgreement >= 0.75
```

## Resultado musical

Os casos em que a cifra autoral enriquece a rota deixam de parecer falhas da geracao melodica.

Isso reforca a distincao:

```text
melodia-only pode omitir uma rota;
referencia-aware pode validar a rota autoral;
avisos de omissao so devem aparecer quando ainda ajudam o compositor.
```

## Validacao

Foi adicionado teste unitario para garantir que:

- diagnosticos de geracao somem quando a referencia estrutural esta forte;
- diagnosticos de geracao permanecem quando o acordo com a referencia e fraco;
- diagnosticos de referencia nao sao apagados por essa regra.
