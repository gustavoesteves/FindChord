# F31.3 — Apresentação Guiada por Perfil

## Objetivo

Usar o perfil da rota para organizar a apresentação das propostas.

A F31.2 classificou cada proposta como conservadora, moderada, cromática ou radical. A F31.3 transforma isso em um pequeno papel de apresentação:

- `Principal`;
- `Alternativa`;
- `Exploração`.

## Contrato

`ReharmonizationProposal` agora pode carregar:

```ts
presentationRole?: "primary" | "alternative" | "adventurous";
```

O planejador fica em:

- `src/utils/music/analysis/strategies/ProposalPresentationPlanner.ts`

## Regras

### Principal

A primeira proposta não radical vira `Principal`.

Isso respeita o ranking já calculado por condução de vozes e custo de rota.

### Alternativa

Propostas conservadoras, moderadas ou cromáticas que não são a principal viram `Alternativa`.

Cromatismo resolvido continua visível como cor possível, não como erro.

### Exploração

Propostas radicais viram `Exploração`.

Elas não são ocultadas nesta fase, apenas apresentadas com expectativa musical correta.

## UI

O card de harmonização passa a mostrar um rótulo curto:

```text
Principal
Alternativa
Exploração
```

Esse rótulo fica separado de `Perfil`, que continua dizendo se a rota é conservadora, moderada, cromática ou radical.

## Decisão importante

A F31.3 não filtra propostas. Ela só melhora leitura.

Essa escolha é deliberada: ainda estamos calibrando o sistema. Esconder propostas radicais cedo demais poderia apagar evidências úteis para o desenvolvimento e para repertórios que realmente pedem mais ousadia.

## Testes

Coberto por:

- `scripts/proposal-presentation-planner.spec.ts`

Os testes verificam:

- referência harmônica não recebe papel de apresentação;
- a primeira proposta não radical vira principal;
- propostas radicais viram exploração;
- uma proposta radical isolada não é promovida artificialmente a principal.

## Próxima fatia

F31.4 pode introduzir controle de ousadia:

- modo simples: prioriza conservadora/moderada;
- modo cromático: permite cromática subir mais;
- modo exploratório: mantém radicais com mais destaque.

Esse controle deve ser musical, não técnico.

Implementado em `docs/f31-4-boldness-mode.md` com os modos `Simples`, `Equilibrado` e `Exploratório`.
