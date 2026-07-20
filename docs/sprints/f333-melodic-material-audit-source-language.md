# F333 - Linguagem de fonte na auditoria de materiais melodicos

## Objetivo

Alinhar a auditoria de materiais melodicos com a linguagem material-first.

## Alteracoes

- `MelodicMaterialAuditRow.primaryScale` passa a ser `primarySource`.
- O CSV troca a coluna `primaryScale` por `primarySource`.
- O Markdown troca "Escala principal" por "Fonte principal".
- O resumo troca "Sem candidata de escala" por "Sem candidato de material".
- O teste garante que os textos antigos nao retornem ao relatorio.

## Decisao

A auditoria mede materiais melodicos. A fonte principal pode ser uma escala, mas tambem pode representar mapas, celulas, arpejos ou vocabulario curado. Portanto, `source` e o nome correto do contrato.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/melodic-materials-audit.spec.ts`
