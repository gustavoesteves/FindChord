# F34 — Fronteira entre Menor Funcional e Centro Modal

## Objetivo

Separar duas leituras que podem parecer parecidas na superficie:

```text
i -> bVII -> bVI
```

Essa sequencia pode ser:

- centro modal/aeolio, quando nao ha direcao cadencial;
- menor funcional, quando ha sensivel, sexta maior ou gesto de fechamento tonal.

## Decisao teorica

`bVI` e `bVII` sozinhos nao autorizam o motor a inventar uma cadencia menor funcional.

Para gerar `Estratégia — Menor funcional`, a melodia precisa trazer direcao menor clara:

- sensivel (`7M` do centro menor);
- ou sexta maior (`6M`) como cor de menor melodico.

Sem esse sinal, a leitura preferida e:

```text
Estratégia — Centro modal
```

## Comportamento implementado

### Caso modal

Melodia em A:

```text
A C | G B | F A | A
```

Resultado:

```text
Am -> G -> F -> Am
```

O sistema gera centro modal e nao gera menor funcional.

### Caso menor funcional

Melodia em A:

```text
A C | G B | F A | E G# | A
```

Resultado:

```text
Am -> G -> F -> E7 -> Am
```

O sistema gera menor funcional e nao gera centro modal concorrente.

### Caso menor melodico

Melodia em A:

```text
A F# | B D | E G# | A
```

Resultado:

```text
Am6 -> Bm7(b5) -> E7 -> Am
```

A sexta maior e a sensivel sustentam a leitura funcional.

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts
```

Mudancas:

- `buildModalProposals` nao gera modal quando o centro menor tem direcao funcional clara;
- `buildMinorFunctionalProposals` so ativa quando ha direcao menor clara;
- `hasFunctionalMinorMelodicDirection` concentra a evidencia de sensivel/sexta maior.

## Testes

Coberto por:

- `scripts/minor-modal-boundary.spec.ts`
- `scripts/modal-center-strategy.spec.ts`
- `scripts/minor-functional-strategy.spec.ts`
- `scripts/harmonic-idiom-classifier.spec.ts`

## Fora do escopo

- Diferenciar todos os modos menores.
- Decidir dórico versus eólio por nome.
- Fazer ranking comparativo quando duas leituras forem realmente plausíveis.
- Usar harmonia de referencia para arbitrar automaticamente toda a apresentacao.

## Proxima fatia

F34.1 integrou essa fronteira com referencia harmônica:

1. se a partitura original usa `V7 -> i`, privilegiar menor funcional;
2. se a partitura original evita sensivel e gira em `i-bVII-bVI`, privilegiar modal;
3. explicar ao usuario a diferenca entre "menor com cadencia" e "centro modal".

Ver:

```text
docs/f34-1-reference-minor-modal-boundary.md
```
