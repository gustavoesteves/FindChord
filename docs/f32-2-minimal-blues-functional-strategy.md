# F32.2 — Estratégia Blues Funcional Mínima

## Objetivo

Gerar a primeira proposta blues sem tratar `I7` como erro tonal.

A F32.0 detectou o idioma. A F32.1 protegeu a apresentação quando a referência é blues/modal. A F32.2 adiciona uma geração mínima para melodias que trazem vocabulário blues claro.

## Regra de ativação

A estratégia só aparece quando:

- o centro selecionado está em modo maior;
- a melodia contém `b3`;
- a melodia contém `b7`;
- a frase tem pelo menos quatro compassos;
- a proposta cobre a melodia localmente.

Isso evita aplicar blues em melodias tonais comuns.

## Harmonia gerada

A primeira versão usa uma forma pequena:

```text
I7 -> IV7 -> V7 -> I7
```

Exemplo em C:

```text
C7 -> F7 -> G7 -> C7
```

## Decisão teórica

No blues, `I7` não é automaticamente dominante pendente.

Ele pode funcionar como repouso idiomático. Por isso esta estratégia é criada fora do validador tonal `T -> PD -> D -> T`.

## Explicação ao usuário

A proposta explica:

- `I7` como repouso idiomático;
- `IV7` como região estável de resposta;
- `b3` e `b7` como cores estruturais.

## Fora do escopo

- Blues de 12 compassos completo.
- Turnarounds.
- Blue note `#4/b5`.
- Mistura com jazz blues.
- Substituições blues.

## Testes

Coberto por:

- `scripts/blues-functional-strategy.spec.ts`
- `scripts/asa-branca-diagnostic.spec.ts`
- `scripts/palhaco-diagnostic.spec.ts`

Os testes verificam:

- geração de `C7 -> F7 -> G7 -> C7` para melodia blues;
- não ativação em melodia maior comum;
- estabilidade dos diagnósticos reais tonais.

## Próxima fatia

F32.3 pode criar uma estratégia modal mínima:

- centro recorrente;
- pedal ou permanência no centro;
- `bVII`/`bVI` como cor modal;
- ausência de cadência dominante.

Implementado em `docs/f32-3-minimal-modal-center-strategy.md`.
