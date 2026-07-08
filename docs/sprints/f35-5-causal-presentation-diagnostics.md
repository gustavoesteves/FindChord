# F35.5 — Diagnosticos de Apresentacao por Causa

## Objetivo

Tornar os diagnosticos de apresentacao mais especificos.

Antes, o sistema dizia apenas que propostas ficaram como comparacao por dependerem da referencia harmonica. Agora ele explicita a causa musical:

- referencia favorece centro modal claro;
- referencia confirma menor funcional por cadencia;
- proposta foi mantida como exploracao por afastamento harmonico.

## Decisao teorica

Uma proposta comparativa nao e apenas "segunda opcao". Ela esta subordinada a alguma evidencia.

Essa evidencia precisa aparecer no diagnostico para o usuario entender se a comparacao existe por:

```text
centro modal
menor funcional cadencial
afastamento exploratorio
```

## Comportamento implementado

### Comparacao por referencia modal

```text
2 propostas ficaram como comparação porque a referência favorece centro modal claro.
```

### Comparacao por menor funcional cadencial

```text
1 proposta ficou como comparação porque a referência confirma menor funcional por cadência.
```

### Exploracao

```text
1 exploração foi mantida como afastamento harmônico.
```

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/strategies/ProposalPresentationPlanner.ts
```

Mudancas:

- `presentationDiagnosticsForProposals` agora le a `harmonicBoundary` da proposta de referencia;
- comparacoes por `modal-center` geram `presentation-comparative-modal-reference`;
- comparacoes por `minor-functional-cadential` geram `presentation-comparative-minor-functional-reference`;
- o diagnostico generico permanece como fallback.

## Testes

Coberto por:

```text
scripts/proposal-presentation-planner.spec.ts
```

## Fora do escopo

- Criar diagnostico individual por proposta.
- Explicar distancia harmonica como causa comparativa.
- Separar visualmente cada causa no bloco de diagnosticos.

## Proxima fatia

F35.6 transformou diagnosticos individuais em detalhes dentro de cada card, sem poluir a lista principal.

Ver:

```text
docs/f35-6-card-level-diagnostics.md
```
