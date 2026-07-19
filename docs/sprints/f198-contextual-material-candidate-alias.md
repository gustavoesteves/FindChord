# F198 — Alias contextual de material

## Objetivo

Atacar o núcleo `contextualScaleCandidates` sem uma refatoração arriscada de uma só vez.

## Mudança

- Criados aliases material-first:
  - `ContextualMaterialRole`;
  - `ContextualMaterialIntent`;
  - `MaterialContext`;
  - `ContextualMaterialCandidate`;
  - `MaterialRankingEvidence`;
  - `buildContextualMaterialCandidates`.
- `HarmonizerService` passou a consumir `ContextualMaterialCandidate` e `buildContextualMaterialCandidates`.
- `ContextualMaterialSuggestionsPanel` passou a tipar leituras com `ContextualMaterialCandidate`.
- `ScaleOverlayPanel`, no `Escrever`, passou a consumir `buildContextualMaterialCandidates`.
- `scripts/audit-contextual-scales.ts` passou a usar o builder e tipo material-first.
- `scripts/contextual-scale-candidates.spec.ts` ganhou uma verificação de equivalência entre o builder novo e o legado.

## Critério

O nome novo comunica melhor o papel real do motor:

> gerar candidatos contextuais de material melódico a partir de uma fonte/mapa de escala, função, melodia e resolução.

## Compatibilidade

Os nomes antigos continuam existindo:

- `ContextualScaleCandidate`;
- `ScaleContext`;
- `ContextualScaleRole`;
- `ContextualScaleIntent`;
- `ScaleRankingEvidence`;
- `buildContextualScaleCandidates`.

Eles permanecem porque a implementação interna ainda usa a escala como fonte de notas e porque várias specs antigas validam esse contrato.

## Próximo passo

Separar o arquivo em duas camadas:

1. escala-fonte/mapa;
2. candidato contextual de material.

Isso permitirá renomear internamente sem carregar a palavra `Scale` no centro do modelo.
