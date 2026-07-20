# F354 - Parser legado preserva qualidade 6/9

## Contexto

A auditoria tecnica marcou que subsistemas paralelos tratavam `C6/9` como se a barra fosse baixo indicado. O resolver canonico ja reconhecia `6/9`, mas `parseChord` cortava qualquer barra antes de mapear a qualidade, degradando o acorde para `C6` com um baixo invalido `9`.

## Alteracoes

- `parseChord` agora consulta primeiro `resolveChordSymbol`.
- Qualidades reconhecidas pelo contrato canonico sao mapeadas para o registry legado.
- `C6/9` passa a ser qualidade `69`, sem baixo indicado, preservando as notas `C E G A D`.
- Slash chords reais, como `C/E`, continuam preservando o baixo.
- Foi adicionada regressao para `C6/9`, `C/E` e helpers funcionais.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/chord-parser-slash-quality.spec.ts`
- `npx vitest run --config vitest.curated.config.ts scripts/chord-symbol-resolver.spec.ts scripts/musicxml-chord-symbol-mapper.spec.ts scripts/harmonic-strategy-properties.spec.ts scripts/bright-size-life-diagnostic.spec.ts`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`

