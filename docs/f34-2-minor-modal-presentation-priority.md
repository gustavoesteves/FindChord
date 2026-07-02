# F34.2 — Prioridade de Apresentação na Fronteira Menor/Modal

## Objetivo

Usar a evidencia da harmonia de referencia para organizar melhor as propostas exibidas ao usuario.

A geracao continua separada da apresentacao:

- a melodia e a frase geram alternativas;
- a harmonia de referencia ajuda a decidir o que aparece como resposta principal, alternativa ou comparacao.

## Decisao teorica

Quando a referencia mostra centro modal claro, o sistema nao deve promover automaticamente uma resposta tonal so porque ela cobre a melodia.

Quando a referencia confirma menor funcional por cadencia, uma proposta menor funcional deve ter prioridade sobre uma leitura modal concorrente.

## Comportamento implementado

### Referencia modal clara

Se a referencia traz:

```text
i -> bVII/bVI -> i
```

sem dominante cadencial, a proposta `Referência — Harmonia da partitura` permanece como ponto principal de comparacao no modo simples/equilibrado.

Comparacoes recebem explicacao:

```text
Comparação: a referência sugere centro modal sem sensível cadencial
```

### Referencia menor funcional

Se a referencia confirma:

```text
V7 -> i
iiø -> V7 -> i
```

o planejador tenta promover primeiro uma proposta com `harmonicIdiom: "minor-functional"`.

Comparacoes recebem explicacao:

```text
Comparação: a referência confirma menor funcional por cadência
```

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/models/ReharmonizationProposal.ts
src/domains/harmonizer/services/harmonizerService.ts
src/utils/music/analysis/strategies/ProposalPresentationPlanner.ts
```

Mudancas:

- `ReharmonizationProposal` agora pode carregar `harmonicBoundary`;
- a proposta de referencia recebe a fronteira calculada por `ReferenceHarmonyAnalysis`;
- `ProposalPresentationPlanner` usa essa fronteira para preservar referencia modal clara;
- quando a fronteira confirma menor funcional, o planejador prioriza proposta menor funcional;
- propostas concorrentes recebem uma frase curta explicando por que ficaram como comparacao.

## Testes

Coberto por:

```text
scripts/proposal-presentation-planner.spec.ts
scripts/reference-harmony-analysis.spec.ts
scripts/minor-modal-boundary.spec.ts
```

## Fora do escopo

- Ocultar automaticamente todas as alternativas conflitantes.
- Fazer julgamento estetico de que a referencia e sempre melhor.
- Reordenar propostas no modo exploratorio para impedir afastamentos propositais.

## Proxima fatia

F34.3 criou um papel de apresentacao comparativa:

1. separar `Comparação` de `Alternativa`;
2. manter propostas radicais como `Exploração`;
3. explicar por que a proposta esta subordinada a uma evidencia contextual.

Ver:

```text
docs/f34-3-comparative-presentation-role.md
```
