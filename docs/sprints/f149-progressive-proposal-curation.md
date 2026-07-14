# F149 - Curadoria das rearmonizacoes progressivas

## Objetivo

Depois das sprints Almada, o Harmonizar passou a gerar muitas alternativas progressivas. Isso e bom para o motor, mas pode ser ruim para o compositor se a UI virar uma lista longa de conquistas tecnicas.

Esta sprint ajusta a exibicao recolhida dos cards para privilegiar diversidade musical.

## Problema

Antes, cada camada mostrava apenas os primeiros cards do ranking. Em uma camada rica como `Rearmonizações progressivas`, isso podia expor varias propostas da mesma familia antes de mostrar uma alternativa realmente diferente.

O resultado pratico era:

- fundamento e rearmonizacoes competindo visualmente;
- cromatismos diferentes escondidos atras de variantes proximas;
- propostas exploratorias importantes ficando invisiveis ate o usuario abrir tudo.

## Alteracao

`HarmonizerProposalList` agora usa uma curadoria por camada.

No modo recolhido:

- `Fundamento harmônico`: ate 2 propostas;
- `Leitura da obra`: ate 2 propostas;
- `Rearmonizações progressivas`: ate 5 propostas;
- `Cores harmônicas`: ate 3 propostas.

Na camada progressiva, a selecao procura:

- preservar a proposta principal quando ela estiver nessa camada;
- manter uma alternativa forte do ranking;
- incluir uma rota cromatica dirigida quando houver;
- evitar repetir a mesma familia harmonica antes de mostrar familias diferentes;
- manter uma exploracao mais distante quando ela existir.

## Familias usadas para diversidade

A UI agrupa informalmente propostas por familia:

- dominantes e ciclos de dominantes;
- SubV;
- diminutos/cromatismo de vizinhanca;
- mistura modal/plagal;
- chegada deceptiva;
- contraponto de baixo;
- fundamento tonal;
- funcao aparente.

Isso nao muda a engine nem a ordem interna expandida. So muda o recorte inicial mostrado ao compositor.

## Resultado esperado

O usuario ve primeiro um conjunto mais variado e musicalmente escaneavel:

- uma leitura principal;
- alternativas progressivas contrastantes;
- uma exploracao distante quando fizer sentido;
- demais propostas continuam acessiveis em `Ver mais harmonizações`.

## Proximo refinamento

O proximo passo pode ser agrupar visualmente variantes progressivas muito proximas, do mesmo modo que ja fazemos com `Variações de cor`, mas sem esconder familias distintas como se fossem meras substituicoes.
