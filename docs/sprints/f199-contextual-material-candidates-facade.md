# F199 — Fachada contextual de materiais

## Objetivo

Separar o ponto de entrada material-first do arquivo legado `contextualScaleCandidates.ts`.

## Mudança

- Criado `src/utils/music/theory/contextualMaterialCandidates.ts`.
- A nova fachada exporta:
  - `buildContextualMaterialCandidates`;
  - `ContextualMaterialCandidate`;
  - `ContextualMaterialRole`;
  - `ContextualMaterialIntent`;
  - `MaterialContext`;
  - `MaterialRankingEvidence`;
  - `ContextualMelodicMaterial`;
  - `ContextualMelodicFit`;
  - `MelodySupportRole`.
- Consumidores material-first passaram a importar da fachada nova:
  - `HarmonizerService`;
  - `ContextualMaterialSuggestionsPanel`;
  - `ScaleOverlayPanel`;
  - auditorias de contexto e materiais.
- Criada `scripts/contextual-material-candidates.spec.ts`.
- A spec nova foi incluída em `vitest.curated.config.ts`.

## Critério

O arquivo antigo ainda implementa o motor, mas deixa de ser o ponto de entrada preferencial para a aplicação.

Novo caminho recomendado:

```ts
import { buildContextualMaterialCandidates } from "./contextualMaterialCandidates";
```

## Próximo passo

Mover gradualmente implementação interna para módulos menores:

- escala-fonte;
- função/contexto;
- materiais melódicos;
- ranking;
- apresentação.

Essa separação deve acontecer por comportamento musical, não por conveniência técnica.
