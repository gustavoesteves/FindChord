# F203 — Extração do ranking contextual de material

## Objetivo

Separar score, fit melódico e papéis de apoio do antigo `contextualScaleCandidates.ts`.

## Mudança

- Criado `src/utils/music/theory/contextualMaterialRanking.ts`.
- O novo módulo concentra:
  - `scoreMaterialCandidate`;
  - `melodicFitFor`;
  - `melodyMatchesFor`;
  - `melodySupportRolesFor`;
  - `melodicFitAdjustment`;
  - `supportRoleAdjustment`;
  - `passingNoteFragmentsFor`.
- `WeightedMelodyNote` passou para `contextualMaterialTypes.ts`.
- `contextualScaleCandidates.ts` passou a consumir o ranking extraído.
- Criada `scripts/contextual-material-ranking.spec.ts`.
- A spec nova foi incluída em `vitest.curated.config.ts`.

## Critério

Ranking/fit não é vocabulário melódico nem leitura funcional.

É uma camada própria que decide:

- quanto a fonte cobre a melodia;
- se há avoid note importante;
- se há resolução apoiada;
- quanto as notas-guia e fragmentos lineares devem aumentar a confiança.

## Benefício para o Escrever

O módulo **Materiais do acorde** poderá reaproveitar essa camada para ordenar materiais por utilidade musical, sem precisar passar por toda a construção contextual do `Harmonizar`.

## Próximo passo

Extrair apresentação textual (`explanationFor` e `practiceHintFor`) para uma camada própria.
