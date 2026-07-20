# F352 - Atualizacao do Vite para fechar advisories

## Contexto

A auditoria tecnica marcou que o lockfile estava em `vite@8.0.14`, dentro da faixa afetada por advisories de desenvolvimento em Windows/rede. O `npm audit` completo confirmava uma vulnerabilidade alta em `vite 8.0.0 - 8.0.15`.

## Alteracoes

- `vite` foi atualizado para `^8.0.16`.
- `package-lock.json` foi regenerado com `vite@8.0.16` e as dependencias internas correspondentes do Rolldown.

## Validacao

- `npm audit`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`

