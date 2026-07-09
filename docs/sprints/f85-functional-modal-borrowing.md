# F85 - Emprestimos modais funcionais

## Objetivo

Transformar a analise de `bVI` e `bVII` em geracao controlada, sem confundir cor de modo paralelo com troca real de centro tonal.

## Implementacao

A estrategia `Estratégia — Empréstimo modal` foi ampliada.

Antes ela gerava apenas:

- `IV -> ivm`, quando a melodia expunha `b6`.

Agora tambem pode gerar:

- `bVII`, quando a melodia expõe `b7` como cor estrutural;
- `bVI`, quando a melodia expõe `b6` como cor estrutural.

Em C maior, isso significa:

- `Bb` / `Bb7` / `Bbmaj7` como `bVII`;
- `Ab` / `Abmaj7` / `Ab6` como `bVI`;
- `Fm` como `ivm`.

## Regra musical

Esses acordes entram como cores do modo paralelo menor em contexto maior funcional.

Eles nao mudam automaticamente o centro tonal e nao viram centro modal por acidente. No validador, `bVI` e `bVII` passam a ser lidos como regiao subdominante/predominante quando o contexto e maior funcional.

## Restricoes

A proposta so e aceita quando:

- o centro ativo e maior;
- o acorde emprestado cobre bem a melodia estrutural do compasso;
- a raiz da cor emprestada aparece de forma estrutural ou o compasso tem peso melodico suficiente;
- a progressao resultante mantem o arco funcional.

## Resultado no exemplo Almada

No exemplo de `docs/musics/exemplo.musicxml`, a quantidade de propostas geradas nao mudou.

Isso e desejavel neste momento: a melodia do exemplo nao sustenta `bVI`/`bVII` como cor isolada suficiente para uma proposta controlada. As referencias do Almada com mistura modal mais densa continuam marcadas como alvo futuro, porque combinam emprestimos com diminutos, dominantes alteradas, inversoes e deslocamentos.

## Decisao

Manter `bVI` e `bVII` como primeira camada de emprestimo funcional.

O proximo refinamento de mistura modal deve tratar progressões mais densas como familia propria, nao apenas como substituicao pontual de um acorde diatonico.

## Artefatos

- `src/utils/music/analysis/strategies/ModalBorrowingAnalysis.ts`
- `src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts`
- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`
- `scripts/modal-borrowing-strategy.spec.ts`
- `docs/theory/almada_harmonia_funcional_source_map.md`
