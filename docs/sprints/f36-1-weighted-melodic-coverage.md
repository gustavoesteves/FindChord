# F36.1 — Cobertura Melodica Ponderada

## Objetivo

Levar o peso melodico estrutural para os validadores.

F36 fez a escolha de acordes considerar apoio estrutural, passagem e ornamento. F36.1 aplica a mesma logica aos gates que aceitam ou rejeitam propostas.

## Problema

Antes, alguns validadores perguntavam:

```text
alguma nota do compasso coube no acorde?
```

ou calculavam cobertura por contagem simples de notas.

Isso podia aprovar um segmento em que apenas uma nota curta ornamental cabia no acorde, enquanto o apoio melodico real ficava descoberto.

## Decisao teorica

Cobertura melodica nao deve significar "quantidade de notas cobertas".

Ela deve significar:

```text
quanto do peso estrutural da melodia foi sustentado pela harmonia?
```

Uma passagem pode tolerar atrito. Um ornamento curto pode escapar. Um apoio longo, inicial, recorrente ou cadencial precisa ter muito mais peso.

## Comportamento implementado

Os validadores agora calculam cobertura por peso melodico:

- em frases curtas, a cobertura geral usa a classificacao da frase inteira;
- em compassos/segmentos, o bonus de final de frase fica desligado;
- propostas longas usam media de cobertura ponderada por compasso;
- o segmento mais fraco tambem usa cobertura ponderada.
- em propostas longas, a cobertura global minima e calibrada como sanity check; o veto principal fica no segmento estruturalmente fraco.

Isso torna mais dificil uma proposta passar apenas porque acertou notas pequenas e ignorou a sustentacao melodica principal.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts
src/utils/music/analysis/engines/GravityFieldManager.ts
```

Mudancas:

- `calculateMelodyCoverage` passou a usar peso melodico;
- `measureMelodyCoverages` passou a medir cobertura ponderada por compasso;
- o gate experimental do `GravityFieldManager` passou a usar o mesmo criterio;
- foi adicionado um teste de regressao para nota ornamental coberta com apoio estrutural descoberto.

## Testes

Coberto por:

```text
scripts/harmonic-strategy-properties.spec.ts
scripts/melodic-anchor-classifier.spec.ts
```

## Fora do escopo

- Alterar mensagens de diagnostico para exibir porcentagens ponderadas.
- Criar diagnosticos por nota descoberta.
- Modelar suspensoes como excecao valida de cobertura.

## Seguimento implementado

F36.2 classificou suspensao, retardo, aproximacao cromatica e passagem por grau conjunto dentro da cobertura melodica.

```text
docs/f36-2-melodic-resolution-coverage.md
```
