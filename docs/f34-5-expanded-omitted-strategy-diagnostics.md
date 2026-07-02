# F34.5 — Diagnosticos de Omissao por Idioma e Estrategia

## Objetivo

Ampliar os diagnosticos de omissao para alem da fronteira menor funcional/modal.

Esta fatia cobre tres familias que ja existem no sistema:

- blues funcional;
- ii-V local;
- SubV7 cadencial.

## Decisao teorica

Nem toda estrategia ausente precisa ser explicada. O sistema so deve diagnosticar omissao quando ha algum indicio musical que torna a ausencia relevante.

Por isso:

- blues nao e mencionado em toda melodia maior comum;
- ii-V local so e mencionado quando ha alvo local fora do centro principal;
- SubV7 so e mencionado quando ha fechamento cadencial, mas a substituicao nao cobre a melodia.

## Comportamento implementado

### Blues funcional

Quando a melodia sugere apenas parte da cor blues, sem sustentar b3 e b7 como estrutura:

```text
Blues funcional omitido: a melodia sugere cor blues parcial, mas não sustenta b3 e b7 como estrutura.
```

### ii-V local

Quando a frase chega a um alvo local, mas a celula ii-V nao cobre as notas estruturais:

```text
ii-V local omitido: a chegada em G não teve cobertura melódica suficiente para uma cadência local.
```

### SubV7

Quando ha fechamento autentico, mas o substituto cromatico nao cobre a melodia:

```text
SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
```

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/engines/GravityFieldManager.ts
```

Mudancas:

- `omittedStrategyDiagnostics` agora agrega diagnosticos de menor/modal, blues, ii-V local e SubV7;
- blues parcial e detectado por presenca de b3 ou b7 sem o par completo;
- ii-V local usa alvo cadencial fora do centro principal;
- SubV7 consulta a validacao da propria estrategia e reporta falha de cobertura melodica.

## Testes

Coberto por:

```text
scripts/omitted-strategy-diagnostics.spec.ts
scripts/blues-functional-strategy.spec.ts
scripts/ii-v-functional-grammar.spec.ts
scripts/subv7-cadential-strategy.spec.ts
scripts/minor-modal-boundary.spec.ts
```

## Fora do escopo

- Explicar toda estrategia ausente.
- Criar severidade ou prioridade para diagnosticos.
- Diferenciar omissao por gosto, por risco e por impossibilidade tecnica.

## Proxima fatia

F35 consolidou uma camada propria de diagnostico harmonico:

1. separar diagnosticos de geracao, apresentacao e referencia;
2. deduplicar mensagens por categoria;
3. permitir que a UI filtre diagnosticos por modo simples/equilibrado/exploratorio.

Ver:

```text
docs/f35-harmonic-diagnostic-contract.md
```
