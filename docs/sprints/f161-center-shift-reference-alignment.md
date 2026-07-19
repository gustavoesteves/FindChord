# F161 - Alinhamento da referencia em centros alterados

## Objetivo

Aprofundar a fila da F39 em que a harmonia autoral muda o centro percebido pelo harmonizador.

O numero bruto era util, mas ainda misturava situacoes diferentes:

- a referencia muda o centro e a proposta fica alinhada;
- a referencia muda o centro e a proposta fica parcialmente alinhada;
- a referencia muda o centro e a proposta ainda diverge da cifra autoral.

## Resultado F39

No corpus principal atual:

```text
Referencia muda centro: 10
Centros alterados alinhados com a referencia: 4
Centros alterados parcialmente alinhados: 2
Centros alterados ainda divergentes: 4
```

## Leitura musical

Isso confirma que usar a harmonia da partitura como evidencia de contexto local e saudavel, mas nao resolve tudo sozinho.

Quando a proposta fica alinhada, o problema era principalmente de centro local: a melodia isolada sugeria um eixo, e a referencia corrigiu a leitura da janela.

Quando a proposta fica parcial ou divergente, preservar o centro local ainda nao basta. O proximo refinamento precisa observar tambem:

- rota harmonica;
- funcao de cada acorde;
- densidade harmonica;
- pontos cadenciais;
- baixo e inversoes;
- consequencia musical da substituicao.

## Mudancas na auditoria

O relatorio F39 agora soma separadamente os casos de centro alterado:

```text
aligned
partial
divergent
```

A triagem detalhada tambem mostra, para cada obra, se a referencia ficou alinhada, parcial ou divergente, junto com a comparacao de funcao e raiz.

## Proximo foco sugerido

Atacar primeiro os 4 casos ainda divergentes:

```text
african flower.musicxml
afron-centric.musicxml
after you've gone.musicxml
after you.musicxml
```

Eles parecem representar o ponto mais importante do refinamento atual: o motor ja entendeu que a referencia desloca o centro, mas ainda nao preserva suficientemente a logica harmonica da obra.
