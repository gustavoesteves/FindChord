# F306 - Apresentacao dos materiais de vamp dominante

## Objetivo

Dar linguagem propria aos novos materiais locais de vamp dominante no `Escrever`.

## Alteracoes

- `dominant diminished axis` passa a ter descricao, clima e dica propria.
- `side slip minor pentatonic` passa a ter descricao, clima e dica propria.
- O eixo diminuto ganha a linha de estudo `Eixo por ii menores`.
- O side slip ganha a linha de estudo `Pentatonica fora e volta`.

## Decisao

Esses materiais nao devem cair no fallback generico. Eles sao parte importante da navegacao local do acorde e precisam chegar ao compositor como gestos tocaveis, nao como nomes tecnicos soltos.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-material-presentation.spec.ts scripts/writer-active-material-panel.spec.ts scripts/local-chord-vamp-materials.spec.ts scripts/writer-material-action.spec.ts`
- `npm run build`
