# F179 - Material melodico para iiø-V-i

## Objetivo

Fechar a preparacao funcional menor no motor de improviso contextual, usando `locrian #2` como material praticavel para acordes meio-diminutos.

## Mudanca

Escalas contextuais `locrian #2` agora recebem:

```text
iiø lócrio #2
```

Exemplo:

```text
Bm7b5 -> E7(b13) -> Am
```

gera:

```text
B-D-F-A
C#-D-B
A->G#
D->C
```

## Leitura teorica

O material combina:

- arpejo meio-diminuto `1-b3-b5-b7`;
- 9 natural do `locrian #2`;
- setima do iiø conduzindo para a terça da dominante;
- terça do iiø conduzindo para a b13 da dominante.

## Ajuste funcional

A inferencia contextual passou a reconhecer, em tonalidade menor:

- o segundo grau meio-diminuto como predominante;
- a dominante sobre o quinto grau como dominante funcional.

Isso melhora o ranqueamento das leituras de improviso menor.

## Validacao

- `npm run test:curated -- scripts/contextual-scale-candidates.spec.ts`
