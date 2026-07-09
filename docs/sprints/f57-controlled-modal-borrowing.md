# F57 — Emprestimo modal controlado

## Objetivo

Adicionar a primeira geracao controlada de emprestimo modal em contexto maior funcional.

A decisao segue o mesmo criterio usado em F56: uma cor cromatica so entra no motor quando tem funcao, contexto e compatibilidade melodica claros.

## Caso implementado

Primeira fatia:

```text
IV -> ivm
```

Em C maior:

```text
F -> Fm
```

## Regra

A proposta aparece como:

```text
Estratégia — Empréstimo modal
kind: controlled-reharmonization
```

Ela so e gerada quando:

- o centro escolhido e maior;
- a melodia traz `b6`;
- ha um IV diatonico na base funcional;
- o `ivm` cobre todas as notas estruturais do compasso;
- a progressao resultante ainda passa pela validacao de expansao funcional diatonica.

## Por que este caso primeiro

O `ivm` e um emprestimo modal classico do modo paralelo menor. Ele preserva a funcao subdominante, mas troca a cor maior por menor.

Isso evita misturar duas ideias diferentes:

- centro modal puro, como `i-bVII-bVI`;
- emprestimo modal tonal, como `I-IV-iv-I`.

O sistema ja tinha uma proposta minima para centro modal. Esta sprint adiciona a primeira cor de modo paralelo dentro de uma frase maior funcional.

## UI e auditoria

`Estratégia — Empréstimo modal` passa a ser tratada como cor funcional na auditoria e na UI.

Ela aparece na camada:

```text
Cores funcionais
```

junto das funcoes aparentes, porque tambem funciona como alternativa de rearmonizacao e nao como harmonia basica primaria.

## Limites

Esta sprint ainda nao implementa:

- `bVII`;
- `bVI`;
- `bII`/napolitano;
- `bIII`;
- intercambio modal amplo;
- deteccao completa de modo paralelo.

## Verificacao

- `npm exec vitest -- run scripts/modal-borrowing-strategy.spec.ts`
- `npm exec vitest -- run scripts/modal-borrowing-strategy.spec.ts scripts/modal-center-strategy.spec.ts scripts/minor-modal-boundary.spec.ts scripts/minor-functional-strategy.spec.ts scripts/apparent-function-strategy.spec.ts`
- `npm run test:curated`
- `npm run report:real-music`

## Proximo passo

Auditar `bVII` e `bVI` como emprestimos modais tonais, separando cuidadosamente quando eles indicam centro modal real e quando sao apenas cor dentro de maior funcional.
