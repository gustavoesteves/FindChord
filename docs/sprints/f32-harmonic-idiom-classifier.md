# F32 — Classificador de Idioma Harmônico

## Objetivo

Começar a camada modal/blues/menor profundo de forma defensiva.

Antes de gerar harmonizações modais ou blues, o sistema precisa reconhecer quando a harmonia não deve ser tratada como tonal maior comum.

## Contrato

Novo arquivo:

- `src/utils/music/analysis/strategies/HarmonicIdiomClassifier.ts`

Função principal:

```ts
classifyHarmonicIdiom(chords, center)
```

Retorna:

```ts
{
  idiom: "major-functional" | "minor-functional" | "modal" | "blues",
  confidence: "strong" | "medium" | "weak",
  evidence: string[]
}
```

## Regras iniciais

### Menor funcional

Reconhecido por sinais como:

- centro como acorde menor;
- dominante maior resolvendo em tônica menor;
- `iiø` preparando dominante.

A F32.4 ampliou a evidência interna do menor para reconhecer:

- `bVI`/`bVII` como cor de menor natural;
- sensível funcional como cor de menor harmônico;
- sexta maior como cor de menor melódico.

### Blues

Reconhecido quando `I7` e `IV7` aparecem como estabilidade local.

Isso impede tratar todo dominante como erro de resolução.

### Modal

Reconhecido quando há:

- centro recorrente;
- cor modal como `bVII` ou `bVI`;
- ausência de cadência dominante.

### Maior funcional

Continua como fallback quando não há sinais fortes dos outros idiomas.

## Integração

### Substituições

`FunctionalSubstitutionIdiomInference` agora delega para o classificador geral.

Isso evita duplicar regras de idioma em vários lugares.

### Referência harmônica

`ReferenceHarmonyAnalysis` agora inclui:

```ts
idiom: HarmonicIdiomClassification | null
```

Quando a partitura tem harmonia existente, a explicação pode incluir:

```text
Idioma harmônico sugerido: blues
Idioma harmônico sugerido: modal
Idioma harmônico sugerido: menor funcional
```

## Fora do escopo

- Gerar harmonização modal.
- Gerar harmonização blues.
- Escolher centro modal por melodia.
- Diferenciar todos os modos.
- Tratar menor natural, harmônico e melódico como três gramáticas completas.

Esta fatia apenas reconhece o idioma para evitar decisões tonais erradas.

## Testes

Coberto por:

- `scripts/harmonic-idiom-classifier.spec.ts`
- `scripts/functional-substitution-idiom-inference.spec.ts`
- `scripts/reference-harmony-analysis.spec.ts`

Os testes verificam:

- menor funcional por `V7 -> i` e `iiø -> V`;
- blues por `I7`/`IV7`;
- modal por centro recorrente + `bVII` sem dominante;
- fallback para maior funcional;
- análise de referência expondo idioma modal/blues.
- evidência de menor natural, harmônico e melódico dentro de `minor-functional`.

## Próxima fatia

F32.1 deve usar esse classificador na apresentação e/ou geração:

1. quando a referência for blues/modal, evitar propostas tonais agressivas por padrão;
2. preparar primeira proposta modal mínima;
3. preparar primeira proposta blues mínima;
4. só depois expandir substituições desses idiomas.

Implementado em `docs/f32-1-idiom-aware-presentation-guard.md` para a camada de apresentação.
