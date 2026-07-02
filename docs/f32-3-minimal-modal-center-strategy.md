# F32.3 — Estratégia Modal Mínima por Centro

## Objetivo

Gerar a primeira proposta modal sem depender de cadência dominante.

A F32.2 criou a primeira proposta blues. A F32.3 cria uma proposta modal mínima quando a melodia sugere:

- centro recorrente;
- cor modal clara;
- ausência de necessidade de `V7 -> I`.

## Regra de ativação

A estratégia aparece quando:

- a melodia repete o centro;
- a melodia contém `bVII` ou `bVI`;
- há pelo menos quatro compassos;
- a proposta cobre a melodia localmente.

## Harmonia gerada

A primeira versão usa uma paleta pequena:

```text
i
bVII
bVI
```

Exemplo em D:

```text
Dm -> C -> Bb -> Dm
```

## Decisão teórica

Essa proposta não tenta nomear o modo com precisão ainda.

Ela reconhece apenas uma família modal prática: centro estável + cor modal + ausência de dominante funcional.

## Desempate modal

Quando duas opções cobrem a melodia igualmente, o sistema privilegia a raiz da cor modal se ela aparece explicitamente na melodia.

Exemplo:

```text
melodia: C + A
```

`Dm` cobre A, `C` cobre C. A estratégia escolhe `C` para expor a cor `bVII`.

## Fora do escopo

- Diferenciar dórico, frígio, mixolídio etc.
- Gerar cadências modais idiomáticas completas.
- Misturar modal com empréstimo modal tonal.
- Substituições modais.

## Testes

Coberto por:

- `scripts/modal-center-strategy.spec.ts`
- `scripts/blues-functional-strategy.spec.ts`
- `scripts/asa-branca-diagnostic.spec.ts`
- `scripts/palhaco-diagnostic.spec.ts`

Os testes verificam:

- geração de `Dm -> C -> Bb -> Dm`;
- não ativação em melodia maior funcional;
- estabilidade dos diagnósticos reais tonais.

## Próxima fatia

F32.4 aprofunda o menor:

- separar menor natural, harmônico e melódico;
- evitar tratar todo menor como apenas `minor-functional`;
- ampliar cadências e cores menores além de `iiø-V-i`.

Implementado em `docs/f32-4-minor-field-color-classifier.md` como evidência de classificador antes de geração.
