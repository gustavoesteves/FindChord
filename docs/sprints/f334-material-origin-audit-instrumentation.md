# F334 - Instrumentacao de origem dos materiais contextuais

## Objetivo

Separar claramente materiais vindos de mapas-fonte base e materiais vindos do catalogo curado.

## Alteracoes

- `ContextualMaterialCandidate` passa a expor `materialOrigin`.
- Leituras base recebem `source-map`.
- Leituras do catalogo local curado recebem `curated-catalog`.
- A auditoria de materiais melodicos passa a registrar:
  - `primaryOrigin`;
  - `availableOrigins`;
  - contagem de leituras em que o catalogo curado e principal;
  - contagem de leituras em que o catalogo curado esta disponivel.
- O CSV da auditoria passa a incluir `primaryOrigin` e `availableOrigins`.

## Leitura inicial

No catalogo real atual:

- o catalogo curado aparece disponivel em 98% das leituras;
- ele e candidato principal em 1% das leituras.

Isso confirma a estrategia conservadora: o catalogo enriquece a leitura sem deslocar automaticamente os materiais-base. A proxima etapa musical pode estudar quando um material curado deve subir de alternativa para leitura principal.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/contextual-material-candidates.spec.ts scripts/melodic-materials-audit.spec.ts scripts/contextual-material-presentation.spec.ts`
- `npm run report:melodic-materials`
