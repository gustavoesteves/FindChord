# F197 — Scripts usando builders de material

## Objetivo

Migrar os consumidores internos que já tratam materiais melódicos para os builders material-first do `Harmonizar`.

## Mudança

- `scripts/temporal-melody-window.spec.ts` passou a usar:
  - `buildProposalMaterialSuggestions`;
  - `buildProposalMaterialSuggestionSets`;
  - `buildMaterialReadingRegions`;
  - `buildMaterialLinearRoutes`.
- `scripts/audit-melodic-materials.ts` passou a usar:
  - `buildSectionMaterialSuggestions`;
  - `buildProposalMaterialSuggestions`.

## Critério

Scripts que testam ou auditam materiais não devem depender dos aliases antigos com `Scale`.

Os aliases seguem no serviço para compatibilidade, mas deixam de ser o caminho preferencial.

## Próximo passo

Tratar separadamente o núcleo `contextualScaleCandidates`, porque ali a palavra `Scale` ainda faz parte do modelo de candidato. A migração correta provavelmente é criar um alias gradual como `ContextualMaterialCandidate`.
