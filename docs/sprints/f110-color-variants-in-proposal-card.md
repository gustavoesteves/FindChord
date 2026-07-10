# F110 - Variacoes de cor no mesmo card

## Objetivo

Transformar os quatro pares encontrados na F109 em uma apresentacao que preserve
as duas realizacoes sem repetir a mesma rota harmonica em cards separados.

## Regra

- o agrupamento usa a similaridade de consequencia da F109;
- referencias do autor nunca sao agrupadas com propostas geradas;
- categorias internas diferentes podem compartilhar o card quando a consequencia
  musical e equivalente, mas cada variacao preserva seu contrato completo;
- a versao com menor carga de tensao dominante vira o percurso principal;
- as versoes mais coloridas permanecem como propostas completas e aplicaveis.

## Interface

O card principal exibe `Variacoes de cor` quando houver alternativas. Ao abrir,
o musico ve somente as cifras que mudam, com compasso, cifra original e cifra
colorida. Cada variacao possui sua propria acao `Aplicar variacao`.

## Resultado esperado

`Dominantes secundarias` e `Dominantes alteradas` passam a ocupar um unico card
quando compartilham a mesma rota. Alteracoes de baixo, raiz, funcao, densidade
ou posicao temporal continuam produzindo cards independentes.

## Resultado

- 4 variacoes de cor agrupadas em 4 partituras;
- `Dominantes secundarias` tornou-se o percurso principal nesses casos;
- `Dominantes alteradas` permaneceu disponivel dentro do mesmo card;
- os cards principais do catalogo passaram de 1.099 para 1.095;
- nenhuma das 199 partituras ficou com zero ou apenas uma ideia visivel;
- `asa branca.musicxml` permaneceu inalterada por nao possuir quase repeticoes.
