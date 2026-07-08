# F35.6 — Diagnosticos no Nivel do Card

## Objetivo

Levar diagnosticos especificos para dentro da proposta individual.

O bloco geral de diagnosticos explica o panorama. O card deve explicar por que aquela proposta especifica recebeu seu papel de apresentacao.

## Decisao teorica

Uma proposta marcada como `Comparação` ou `Exploração` precisa de explicacao local.

Isso evita que o usuario veja apenas o selo e precise inferir sozinho:

- comparacao por referencia modal;
- comparacao por menor funcional cadencial;
- exploracao por afastamento harmonico.

## Comportamento implementado

Quando uma proposta vira comparacao por referencia modal:

```text
Esta proposta ficou como comparação porque a referência favorece centro modal claro.
```

Quando uma proposta vira comparacao por menor funcional:

```text
Esta proposta ficou como comparação porque a referência confirma menor funcional por cadência.
```

Quando uma proposta radical fica como exploracao:

```text
Esta proposta foi mantida como exploração por afastamento harmônico.
```

Essas mensagens aparecem dentro de `Ver análise`.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/models/ReharmonizationProposal.ts
src/utils/music/analysis/strategies/ProposalPresentationPlanner.ts
src/domains/harmonizer/components/HarmonizationProposalCard.tsx
```

Mudancas:

- `ReharmonizationProposal` agora pode carregar `diagnostics`;
- `ProposalPresentationPlanner` anexa diagnosticos individuais em propostas `comparative` e `adventurous`;
- `HarmonizationProposalCard` renderiza diagnosticos dentro da analise expandida;
- as mensagens usam o contrato `HarmonicDiagnostic`.

## Testes

Coberto por:

```text
scripts/proposal-presentation-planner.spec.ts
scripts/omitted-strategy-diagnostics.spec.ts
```

## Fora do escopo

- Criar UI recolhivel separada dentro do card.
- Adicionar diagnosticos individuais de geracao para cada acorde.
- Criar severidade por diagnostico.

## Proxima fatia

F36 pode voltar ao motor musical propriamente dito: calibrar estruturalmente nota melodica, ornamento e peso de ancora antes de expandir novas estrategias.
