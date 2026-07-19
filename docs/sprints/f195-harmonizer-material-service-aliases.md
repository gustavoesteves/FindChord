# F195 — Modelos de material no Harmonizar

## Objetivo

Reduzir a dependência conceitual dos modelos antigos chamados `ScaleSuggestion` no `Harmonizar`, sem quebrar scripts e testes que ainda usam os nomes anteriores.

## Mudança

- Criados tipos material-first:
  - `SectionMaterialSuggestion`;
  - `SectionMaterialReadingRegion`;
  - `SectionMaterialSuggestionSet`.
- Os tipos antigos `SectionScaleSuggestion`, `SectionScaleReadingRegion` e `SectionScaleSuggestionSet` continuam como aliases.
- Criados builders material-first:
  - `buildSectionMaterialSuggestions`;
  - `buildProposalMaterialSuggestions`;
  - `buildMaterialReadingRegions`;
  - `buildMaterialLinearRoutes`;
  - `buildProposalMaterialSuggestionSets`.
- Os builders antigos continuam exportados como aliases.
- `useHarmonizerProposals` passou a consumir os nomes novos.
- As regiões agora carregam `materialLabel`, `sourceName` e `sourceType`, mantendo `scaleName` e `scaleType` por compatibilidade.

## Critério

O serviço deve representar o que a UI já passou a comunicar:

> a escala é fonte/mapa; a sugestão musical é material, linha e resolução.

## Próximo passo

Migrar gradualmente os nomes públicos restantes:

- `ContextualScaleSuggestionsPanel`;
- `ContextualScaleCandidate`;
- scripts de auditoria ainda chamados `scale`;
- specs antigas que continuam usando `buildScale...`.
