# F90 - Tensao dominante no ranking

## Objetivo

Fazer a graduacao de tensao dominante influenciar a apresentacao das propostas sem transformar tensao alterada em enfeite automatico.

O criterio musical e simples: dominante alterada ganha peso quando aponta para um alvo local claro; quando aparece sem resolucao audivel, deve ficar atras de rotas mais estaveis.

## Implementacao

A camada de ranking agora calcula dois campos nas propostas:

- `dominantTensionRankBonus`
- `unsupportedDominantTensionPenalty`

O bonus aparece quando uma dominante alterada ou altamente alterada resolve:

- por quarta ascendente, como `G7alt -> C`;
- por semitom descendente no caso de SubV, como `Db7 -> C`.

A penalidade aparece quando uma dominante alterada nao tem alvo local logo depois.

## Limite importante

Dominantes coloridas, como `G13` ou `Db7(#11)`, nao recebem a mesma penalidade. Elas carregam cor, mas nao devem ser tratadas como o mesmo grau de urgencia de `G7alt` ou `G7(b13,b9)`.

## Testes

Foram adicionados casos em `scripts/voice-leading-ranking.spec.ts` para garantir que:

- `G7alt -> Cmaj7` recebe bonus;
- `G7alt -> F#maj7` recebe penalidade;
- `G13` sem resolucao imediata nao e penalizado como dominante alterada.

## Proximo passo

Auditar o catalogo real procurando onde autores usam:

- dominante simples resolvida;
- dominante colorida;
- dominante alterada resolvida;
- dominante alterada suspensa ou deceptiva.

Isso deve alimentar a futura regra de dominantes sem resolucao e resolucoes deceptivas.
