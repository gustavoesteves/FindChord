# F32.1 — Proteção de Apresentação por Idioma

## Objetivo

Usar o idioma harmônico detectado para evitar que alternativas tonais pareçam a resposta principal quando a referência sugere modal ou blues.

A F32.0 classificou o idioma. A F32.1 aplica essa informação na apresentação.

## Problema

Se uma partitura já possui harmonia de referência modal ou blues, uma proposta tonal funcional pode até ser útil como comparação, mas não deve aparecer como `Principal` por padrão.

Nesses idiomas, a própria referência é muitas vezes o melhor ponto de partida.

## Contrato

`ReharmonizationProposal` agora pode carregar:

```ts
harmonicIdiom?: "major-functional" | "minor-functional" | "modal" | "blues";
```

`buildExistingHarmonyProposal` preenche esse campo a partir de `ReferenceHarmonyAnalysis`.

## Regra

Quando a proposta de referência tem idioma:

- `modal`;
- `blues`;

e o modo de ousadia é:

- `Simples`;
- `Equilibrado`;

o planejador não promove alternativas geradas a `Principal`.

Elas continuam visíveis como `Alternativa` ou `Exploração`.

No modo `Exploratório`, o usuário explicitamente pediu mais cor/risco, então alternativas podem voltar a ser promovidas.

## Decisão de produto

Essa fatia não bloqueia a geração.

Ela apenas melhora a hierarquia visual:

```text
Referência modal/blues
Alternativas geradas
Explorações
```

Isso evita a sensação de que o sistema está "corrigindo" uma harmonia idiomática real.

## Testes

Coberto por:

- `scripts/proposal-presentation-planner.spec.ts`
- `scripts/reference-harmony-analysis.spec.ts`

Os testes verificam:

- referência modal impede alternativa tonal de virar principal no modo equilibrado;
- referência blues ainda permite promoção no modo exploratório;
- referência harmônica carrega o idioma detectado.

## Próxima fatia

F32.2 pode começar a gerar propostas mínimas:

- primeira proposta modal por centro/pedal;
- primeira proposta blues por I7/IV7/V7;
- sempre com perfil e explicação próprios.

Implementado em `docs/f32-2-minimal-blues-functional-strategy.md` para a primeira proposta blues mínima.
