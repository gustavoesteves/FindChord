# F31.4 — Controle de Ousadia

## Objetivo

Permitir que o usuário organize as propostas por intenção musical.

A F31.3 introduziu os papéis `Principal`, `Alternativa` e `Exploração`. A F31.4 adiciona um controle simples:

- `Simples`;
- `Equilibrado`;
- `Exploratório`.

## Contrato

`ReharmonizationProposal` agora compartilha o tipo:

```ts
type ReharmonizationBoldnessMode =
  | "simple"
  | "balanced"
  | "exploratory";
```

O planejador recebe o modo:

```ts
annotateProposalPresentationRoles(proposals, mode)
```

## Modos

### Simples

Prioriza rotas conservadoras e moderadas.

Ordem preferida:

```text
conservadora -> moderada -> cromática -> radical
```

### Equilibrado

Preserva a ordem já produzida pelo ranking musical.

Esse é o padrão, porque mantém a decisão combinada de condução de vozes e custo de rota.

### Exploratório

Prioriza cor e surpresa.

Ordem preferida:

```text
cromática -> radical -> moderada -> conservadora
```

Mesmo assim, propostas radicais continuam marcadas como `Exploração` quando não são a primeira escolha do modo.

## UI

O Harmonizar passa a mostrar três botões:

```text
Simples
Equilibrado
Exploratório
```

Esses botões não regeneram a harmonia. Eles reorganizam a apresentação das propostas já aceitas.

## Decisão importante

O controle é musical, não técnico.

Não expomos pesos, penalidades ou thresholds. O usuário escolhe a disposição estética das respostas.

## Testes

Coberto por:

- `scripts/proposal-presentation-planner.spec.ts`

Os testes verificam:

- modo simples prioriza conservadora/moderada;
- modo equilibrado preserva a ordem ranqueada;
- modo exploratório prioriza cromática/radical;
- referência harmônica continua fora dos papéis de apresentação.

## Próxima fronteira

F31 está praticamente fechada como camada de distância, rota e apresentação.

A próxima etapa natural é F32:

- modal;
- blues;
- menor profundo.

Antes disso, pode valer uma fatia curta de consolidação para garantir que todos os rótulos visíveis estejam coerentes em português musical.
