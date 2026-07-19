# F294 - Linguagem musical no braco de materiais

## Objetivo

Trocar termos de diagnostico tecnico por uma leitura mais util para quem esta compondo, improvisando ou procurando caminhos no instrumento.

## Alteracoes

- `Tonica` passa a aparecer como `Repouso`.
- Notas caracteristicas deixam de aparecer como `Modal` e passam a aparecer como `Identidade`.
- Notas antes chamadas de `Evitar` passam a aparecer como `Passagem`.
- Tooltips passam a reforcar uso musical: estabilidade, identidade do material e friccao controlada.

## Decisao

A categoria interna `avoid` continua existindo porque ainda e util para filtragem e classificacao. A UI, porem, nao deve sugerir que uma nota e proibida. Para o compositor, a pergunta melhor e: "isso e apoio, identidade, tensao ou passagem?"

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-material-note-roles.spec.ts scripts/local-material-fretboard-notes.spec.ts scripts/writer-material-fretboard-view.spec.ts scripts/material-fretboard-renderer-migration.spec.ts`
- `npm run build`
