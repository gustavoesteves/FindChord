# F103 - Janelas forcadas para chegadas laterais

## Contexto

A F102 mostrou que 7 dos 8 casos F98 ficam fora da janela harmonizavel escolhida pelo pipeline.

A pergunta seguinte era se o motor falha em gerar candidatos quando a janela contem o caso, ou se a selecao de janela esta escondendo candidatos que ja existem.

## Decisao

Criar `scripts/audit-side-arrival-forced-windows.ts`.

Para cada caso F98, a auditoria força uma janela melodica de ate 8 compassos contendo o compasso do caso e mede:

- quantas propostas sao geradas;
- se alguma proposta contem a raiz da chegada lateral da referencia perto do compasso;
- quais estrategias produziram esse material.

## Resultado

Nos 8 casos analisados:

- casos com janela forcada: 8
- casos com candidato lateral gerado: 6
- casos ainda sem candidato lateral: 2

Os dois casos sem candidato aparecem em `Daahood`.

## Leitura

O gargalo principal nao e falta global de vocabulario lateral.

Quando a janela contem o caso, o motor ja encontra candidatos laterais na maior parte das vezes. O problema central passa a ser:

- selecionar/expor multiplas janelas;
- nao depender apenas da melhor janela global;
- avaliar candidatos por trecho sem perder a coerencia da frase inteira.

## Proximo refinamento

Criar uma auditoria de multiplas janelas apresentaveis por musica:

- janela primaria;
- janelas alternativas com forte cobertura de referencia;
- janelas que cobrem eventos harmonicamente interessantes;
- ranking local dessas janelas.

Depois disso, decidir se o produto deve permitir harmonizacao por trecho/segmento alem da janela primaria.
