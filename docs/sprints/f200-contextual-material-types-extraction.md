# F200 — Extração dos tipos contextuais de material

## Objetivo

Começar a separação interna real do antigo `contextualScaleCandidates.ts`, sem mover ainda a implementação pesada do motor.

## Mudança

- Criado `src/utils/music/theory/contextualMaterialTypes.ts`.
- O novo módulo passa a ser dono dos contratos material-first:
  - `ContextualMaterialRole`;
  - `ContextualHarmonicFunction`;
  - `ContextualMaterialIntent`;
  - `ContextualMelodicFit`;
  - `MelodySupportRole`;
  - `MaterialContext`;
  - `MaterialRankingEvidence`;
  - `ContextualMelodicMaterial`;
  - `ContextualMaterialCandidate`.
- `contextualScaleCandidates.ts` agora importa esses contratos e mantém nomes legados como aliases.
- `contextualMaterialCandidates.ts` passou a exportar tipos diretamente de `contextualMaterialTypes.ts` e o builder da implementação antiga.

## Critério

Os contratos conceituais passam a existir fora do arquivo legado de escala.

Isso permite que próximas extrações sejam feitas por responsabilidade musical:

- fonte/mapa;
- função/contexto;
- materiais melódicos;
- ranking;
- apresentação.

## Compatibilidade

Os nomes antigos continuam exportados por `contextualScaleCandidates.ts`, então specs e chamadas legadas ainda funcionam.

## Próximo passo

Extrair os geradores de materiais melódicos para um módulo próprio, provavelmente `contextualMelodicMaterials.ts`.
