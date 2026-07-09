# F92 - Contexto de resolucao dominante

## Objetivo

Refinar a regra criada na F90 para que dominante alterada sem resolucao imediata nao seja automaticamente tratada como erro.

A auditoria F91 mostrou que ha muitos casos reais em que a dominante alterada nao cai diretamente no alvo no acorde seguinte. Isso pode indicar resolucao atrasada, prolongamento de dominante, chegada deceptiva ou, em alguns casos, ausencia real de destino.

## Implementacao

Foi criado o analisador:

- `src/utils/music/analysis/strategies/DominantResolutionAnalysis.ts`

Ele classifica uma dominante dentro de uma pequena janela local:

- `immediate`: resolve por quarta ascendente no acorde seguinte;
- `subv-immediate`: resolve por semitom descendente como SubV;
- `delayed`: resolve no alvo depois de um acorde intermediario;
- `subv-delayed`: SubV resolve depois de um acorde intermediario;
- `prolonged`: a dominante e prolongada antes da resolucao;
- `deceptive`: desvia para uma regiao deceptiva proxima do alvo esperado;
- `unresolved`: nao ha alvo local na janela analisada.

## Ranking

O ranking deixou de usar a regra binaria "resolve no proximo acorde ou pune".

Agora:

- resolucao imediata recebe o bonus principal;
- resolucao atrasada, prolongada ou deceptiva recebe bonus menor, mas nao penalidade;
- apenas `unresolved` recebe penalidade de tensao alterada sem alvo local.

## Auditoria

A auditoria F91 tambem passou a separar:

- alteradas resolvidas imediatamente;
- alteradas com resolucao contextual;
- alteradas sem alvo local;
- resolucoes atrasadas;
- prolongamentos de dominante;
- chegadas deceptivas.

## Proximo passo

Usar exemplos reais do relatorio F91 para calibrar a janela de analise.

O ponto delicado sera nao transformar qualquer acorde intermediario em desculpa para uma dominante alterada forte. A janela deve continuar curta e a explicacao precisa permanecer musicalmente clara.
