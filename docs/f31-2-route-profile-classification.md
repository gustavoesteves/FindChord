# F31.2 — Classificação de Perfil da Proposta

## Objetivo

Transformar o custo de rota em um rótulo musical legível.

A F31.0 criou a métrica de distância. A F31.1 conectou essa métrica ao ranking. A F31.2 evita que o usuário precise interpretar apenas números, classificando a proposta em perfis:

- conservadora;
- moderada;
- cromática;
- radical.

## Contrato

`HarmonicRouteDistance` agora retorna:

```ts
profile: "conservative" | "moderate" | "chromatic" | "radical"
```

`ReharmonizationProposal` recebe:

```ts
routeProfile?: ReharmonizationRouteProfile;
```

## Sentido musical

### Conservadora

Rota de baixo custo, sem cromatismo relevante, sem tendência pendurada e com função clara.

Exemplo típico:

```text
Dm7 -> G7 -> Cmaj7
```

### Moderada

Rota funcionalmente coerente, mas com algum custo local: repetição funcional, cor menor ou condução menos direta.

Exemplo:

```text
Am -> Bm7(b5) -> E7b13 -> Am
```

em menor funcional.

### Cromática

Rota com cor cromática justificada por resolução.

Exemplo:

```text
Db7 -> Cmaj7
```

como SubV7 resolvido.

### Radical

Rota com custo alto, função pouco clara ou tendência não resolvida. Ela pode ser musicalmente interessante, mas deve ser apresentada como opção mais aventureira.

## UI

O card de proposta passa a mostrar:

```text
Perfil: Conservadora
Perfil: Moderada
Perfil: Cromática
Perfil: Radical
```

Esse rótulo é melhor que expor apenas o custo bruto, porque comunica intenção musical sem transformar a interface em painel de depuração.

## Decisão de calibração

O perfil cromático não depende apenas de custo alto. Um SubV7 bem resolvido pode ter custo moderado, mas continua sendo cromático em linguagem musical. Por isso, o classificador também olha evidências de resolução cromática e SubV7.

Rotas menores funcionais também não devem ser chamadas de radicais apenas porque a condução ainda usa algumas heurísticas tonais maiores. Quando a função menor está coerente, o perfil tende a moderado.

## Testes

Coberto por:

- `scripts/harmonic-route-distance.spec.ts`
- `scripts/voice-leading-ranking.spec.ts`

Os testes verificam:

- `ii-V-I` como conservador;
- SubV7 resolvido como cromático;
- menor funcional como moderado;
- rota distante não resolvida como radical;
- propostas ranqueadas recebem `routeProfile`.

## Próxima fatia

F31.3 pode usar o perfil para controlar apresentação:

- destacar a opção mais estável;
- preservar opções cromáticas como alternativas, não como erro;
- ocultar ou rebaixar opções radicais quando a melodia pede simplicidade;
- permitir futuramente um controle de ousadia.

Implementado em `docs/f31-3-profile-aware-proposal-presentation.md`, ainda sem ocultar propostas radicais.
