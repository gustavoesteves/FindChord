# F121 - Superficie de leitura para improviso

## Problema

A primeira apresentacao de escalas contextuais ficou musicalmente promissora,
mas visualmente fraca: ela disputava espaco com os cards de harmonizacao dentro
do `Harmonizar`. Isso confundia duas tarefas diferentes:

- escolher ou comparar uma harmonia para a melodia;
- ler possibilidades de improviso sobre a harmonia avaliada.

Em uma partitura como `Asa Branca` sem cifras, o fluxo correto e:

1. ler a melodia;
2. gerar uma harmonia estrutural principal;
3. usar essa harmonia como base para sugerir escalas, tensoes e alvos de
   resolucao por acorde/compasso.

## Decisao

O `Harmonizar` passa a ter duas visoes internas:

- `Harmonizacoes`: superficie principal para cards de harmonia, rearmonizacao,
  trechos locais e aplicacao em `Escrever`;
- `Improviso`: superficie propria para leituras de escala por contexto.

A leitura de improviso nao e mais apresentada como mais um card de proposta.
Ela passa a ser uma tabela musical por compasso, exibindo:

- compasso;
- acorde avaliado;
- escala principal;
- funcao harmonica resumida;
- alvo de resolucao quando houver;
- cores alternativas.

## Refinamento: leitura por proposta

A leitura de improviso tambem nao pode ser unica para a secao inteira. Se o
sistema exibe tres harmonias possiveis para a mesma melodia, cada harmonia deve
ter sua propria leitura.

Exemplo: em `Asa Branca`, uma harmonia basica `I-IV-V`, uma leitura com `SubV`
e uma leitura tonal classica carregam implicacoes diferentes para improviso. A
aba `Improviso` passa a oferecer um seletor de harmonias avaliadas; ao escolher
uma proposta, a tabela de escalas acompanha aquela progressao.

Isso preserva a nuance musical:

- uma proposta conservadora tende a sugerir leituras diatonicas e funcionais;
- uma proposta com dominante substituta deve abrir leituras proprias para o
  acorde cromatico;
- uma proposta por regioes longas deve poder sustentar uma leitura mais
  regional, quando o motor tiver essa camada.

## Regra de fonte harmonica

A leitura usa a harmonia escrita quando a partitura tiver cifras.

Se a partitura nao tiver cifras, a leitura usa a proposta harmonica principal
gerada pelo sistema. Isso preserva o caso `Asa Branca`: a melodia gera uma
harmonia basica, e a aba `Improviso` le essa harmonia.

## Limite atual

A unidade visual ainda e acorde/compasso. Isso e suficiente para a primeira
entrega, mas nao resolve toda a teoria de improviso.

Os proximos refinamentos devem tratar:

- quando uma escala deve durar um compasso inteiro;
- quando a leitura deve mudar dentro do compasso;
- quando a frase pede uma leitura regional, em vez de acorde-a-acorde;
- como exibir escolhas principais versus alternativas sem produzir excesso de
  informacao;
- como cruzar a escala sugerida com notas estruturais da melodia.

## Resultado esperado

O usuario primeiro compara progressoes na aba `Harmonizacoes`. Depois, na aba
`Improviso`, escolhe qual harmonia quer avaliar e consulta o mapa de
possibilidades sobre aquela progressao.

Isso aproxima a UI do raciocinio musical: harmonia primeiro, leitura melodica e
improvisacional depois.
