# F35.4 — Diagnosticos da Camada de Apresentacao

## Objetivo

Fazer a camada de apresentacao emitir diagnosticos proprios.

Ate aqui, `ProposalPresentationPlanner` atribuía papéis como:

```text
Principal
Alternativa
Comparação
Exploração
```

mas essas decisoes nao alimentavam o bloco de diagnosticos. Agora alimentam.

## Decisao teorica

Quando o sistema muda o papel de uma proposta, isso tambem e uma leitura musical.

Exemplos:

- se uma proposta ficou como `Comparação`, ela esta subordinada a uma evidencia contextual;
- se uma proposta ficou como `Exploração`, ela tem afastamento harmonico maior.

Essa decisao nao deve ficar escondida apenas no selo do card.

## Comportamento implementado

Quando ha propostas comparativas:

```text
2 propostas ficaram como comparação por dependerem da referência harmônica.
```

Quando ha exploracoes:

```text
1 exploração foi mantida como afastamento harmônico.
```

Esses diagnosticos usam:

```text
source: "presentation"
category: "comparison"
```

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/strategies/ProposalPresentationPlanner.ts
```

Integração:

```text
src/domains/harmonizer/hooks/useHarmonizerProposals.ts
```

Mudancas:

- criado `presentationDiagnosticsForProposals`;
- propostas `comparative` geram diagnostico de comparacao;
- propostas `adventurous` geram diagnostico de exploracao;
- o hook soma diagnosticos de geracao, referencia e apresentacao antes do filtro por modo.

## Testes

Coberto por:

```text
scripts/proposal-presentation-planner.spec.ts
scripts/omitted-strategy-diagnostics.spec.ts
```

## Fora do escopo

- Criar diagnosticos individuais para cada card.
- Mostrar diagnosticos de apresentacao dentro do proprio card.
- Diferenciar comparacao por referencia modal de comparacao por distancia harmonica.

## Proxima fatia

F35.5 transformou esses diagnosticos em mensagens mais especificas por causa:

1. comparacao por referencia modal;
2. comparacao por menor funcional cadencial;
3. exploracao por perfil radical.

Ver:

```text
docs/f35-5-causal-presentation-diagnostics.md
```
