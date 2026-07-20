# F330 - Comando de relatorio contextual material-first

## Objetivo

Evitar que novos usos operacionais continuem nascendo com a linguagem antiga de `contextual scales`.

## Alteracoes

- Criado `scripts/generate-contextual-material-audit.ts`.
- `scripts/generate-contextual-scale-audit.ts` passa a ser apenas um wrapper legado.
- Adicionado comando `report:contextual-materials`.
- `report:contextual-scales` permanece como alias para compatibilidade.
- `contextualScaleCandidates.ts` recebeu comentario explicito de adaptador legado.
- O teste de candidatos contextuais passa a afirmar que `buildContextualScaleCandidates` e o mesmo builder material-first.

## Decisao

Nao vale remover os nomes antigos de uma vez, porque ainda existem scripts, docs e historico de sprints apoiados nessa nomenclatura. O caminho saudavel e criar a trilha nova e manter a antiga como ponte.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/contextual-material-candidates.spec.ts scripts/contextual-scale-audit.spec.ts`
- `npm run build`
