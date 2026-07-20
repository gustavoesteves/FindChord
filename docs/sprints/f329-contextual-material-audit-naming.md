# F329 - Auditoria contextual com linguagem de materiais

## Objetivo

Remover mais um resíduo conceitual de `Escalas Compatíveis` na infraestrutura de auditoria contextual.

## Alteracoes

- A auditoria temporal passa a expor nomes `ContextualMaterialAudit*`.
- O relatório gerado passa a se chamar `f119-contextual-material-temporal-audit.md`.
- O título do relatório passa de "escalas contextuais" para "materiais contextuais".
- Os nomes antigos `ContextualScaleAudit*`, `auditContextualScaleLibrary` e `renderContextualScaleAuditMarkdown` permanecem como aliases de compatibilidade.
- O teste cobre tanto a nomenclatura nova quanto os aliases legados.

## Decisao

O motor ainda pode usar escalas como fontes, mas a camada musical que chega ao compositor deve falar em materiais. Essa limpeza preserva scripts antigos enquanto evita que novas ferramentas continuem reforçando o modelo antigo de "lista de escalas compatíveis".

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/contextual-scale-audit.spec.ts`
