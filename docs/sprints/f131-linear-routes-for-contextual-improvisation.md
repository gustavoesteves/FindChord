# F131 - Rotas lineares para improvisacao contextual

## Problema

A F130 criou fragmentos lineares por acorde, mas eles ainda apareciam apenas no
detalhe de cada leitura. Isso ajuda no estudo local, mas nao mostra quando um
trecho tem um pequeno caminho praticavel.

## Decisao

Cada conjunto de leituras de escala passa a expor `linearRoutes`.

Uma rota linear e criada apenas quando a leitura primaria tem material linear
claro, como:

- resolucoes de notas-guia;
- notas de passagem idiomaticas;
- dominante com alvo de resolucao.

Leituras regionais estaveis continuam separadas em `regions`. Assim, uma escala
regional nao vira automaticamente frase de improvisacao.

## Efeito musical

Em uma cadencia simples:

```text
G7 -> C
```

o sistema pode mostrar:

```text
B->C / F->E
```

como rota linear local para praticar a resolucao da dominante.

## Efeito na UI

O painel `Leituras de escala por contexto` passa a mostrar `Rotas lineares`
quando houver material suficiente. A leitura por compasso continua disponivel
abaixo, com detalhes de notas-guia, tensoes, passagens e fragmentos.

## Proximo passo

O proximo refinamento natural e comparar a rota linear com a melodia real do
trecho, para evitar sugerir fragmentos que conflitem com notas estruturais
importantes.
