# F31.1 — Ranking de Propostas com Custo de Rota

## Objetivo

Conectar `HarmonicRouteDistance` ao ranking das propostas aceitas.

A F31 criou uma régua de custo para rotas harmônicas. A F31.1 aplica essa régua às propostas que o Harmonizar já gera, sem remover o score de condução de vozes.

## Decisão musical

O ranking agora combina dois sinais:

1. condução de vozes;
2. custo de rota harmônica.

A condução continua tendo peso forte, porque ela já escolhia bem entre alternativas válidas. O custo de rota entra como refinamento: ajuda a penalizar caminhos funcionalmente caros ou cromaticamente distantes, mas não derruba automaticamente uma proposta com condução claramente melhor.

## Implementação

Arquivos:

- `src/utils/music/analysis/models/ReharmonizationProposal.ts`
- `src/utils/music/analysis/strategies/VoiceLeadingProposalRanker.ts`

Novos metadados na proposta:

```ts
routeDistanceCost?: number;
routeDistanceEvidence?: string[];
```

O ranqueador passa a:

1. calcular condução de vozes;
2. calcular custo de rota;
3. adicionar evidência de rota à explicação;
4. ordenar por score combinado;
5. preservar desempate por condução e ordem original.

## Linguagem de explicação

A evidência aparece como:

```text
Rota harmônica: rota ganha clareza por resolução de guide tones
```

ou:

```text
Rota harmônica: rota preserva notas comuns
```

A interface ainda não precisa mostrar o custo bruto como métrica principal. O valor fica disponível no modelo para depuração, testes e próximas etapas.

## Por que não usar custo puro

Um teste importante mostrou que custo de rota puro rebaixava `ii-SubV7` diante de uma dominante original mais simples. Isso era teoricamente possível, mas musicalmente cedo demais para o nosso sistema: a condução cromática do `ii-SubV7` já tinha evidência forte.

Por isso, F31.1 escolhe um score combinado leve:

```text
ranking = condução - custo_de_rota * peso_pequeno
```

Essa solução mantém o comportamento que já funcionava e abre espaço para calibração futura.

## Testes

Coberto por:

- `scripts/voice-leading-ranking.spec.ts`
- `scripts/harmonic-route-distance.spec.ts`

Os testes verificam:

- ranking antigo por condução continua estável;
- propostas aceitas recebem `routeDistanceCost`;
- explicações incluem `Rota harmônica: ...`;
- a métrica de distância continua validada isoladamente.

## Próxima fatia

F31.2 pode classificar propostas por perfil:

- conservadora;
- moderada;
- cromática;
- radical.

Essa classificação deve usar custo de rota, quantidade de cromatismo, função preservada e distância do original.

Implementado em `docs/f31-2-route-profile-classification.md`.
