# F202 — Extração de função contextual e notas-guia

## Objetivo

Separar a leitura de função/contexto e notas-guia do antigo `contextualScaleCandidates.ts`.

## Mudança

- Criado `src/utils/music/theory/contextualMaterialFunction.ts`.
- O novo módulo concentra:
  - comparação de raízes;
  - extração de raiz de cifra;
  - transposição de pitch class;
  - classificação contextual de função harmônica;
  - notas-guia por qualidade;
  - alvos próximos de notas-guia;
  - resoluções de notas-guia.
- `contextualScaleCandidates.ts` passou a consumir:
  - `determineContextualHarmonicFunction`;
  - `guideTonesFor`;
  - `nearestGuideToneTargets`;
  - `guideToneResolutions`;
  - `transposePitchClass`;
  - `rootsEqual`.
- Criada `scripts/contextual-material-function.spec.ts`.
- A spec nova foi incluída em `vitest.curated.config.ts`.

## Critério

Função contextual e notas-guia são informação musical reaproveitável.

Elas não devem ficar presas ao builder completo de candidatos, porque também serão úteis para:

- `Escrever > Materiais do acorde`;
- análise de um acorde isolado com contexto reduzido;
- futura leitura por compasso/acorde no `Harmonizar`.

## Próximo passo

Extrair ranking/fit melódico ou apresentação textual dos candidatos contextuais.
