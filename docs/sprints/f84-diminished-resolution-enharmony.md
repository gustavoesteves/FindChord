# F84 - Diminutos por resolucao e enharmonia

## Objetivo

Refinar a estrategia de diminutos de passagem para tratar o diminuto completo como estrutura simetrica, validada pela resolucao de qualquer nota do acorde por semitom para o alvo funcional.

## Implementacao

O validador de estrategia agora aceita `dim` e `dim7` como diminutos de passagem.

A resolucao deixou de depender apenas da raiz escrita do acorde. Em vez disso, o sistema calcula as notas do acorde e verifica se alguma delas resolve por semitom ascendente para a raiz do proximo acorde funcional.

Isso permite casos como:

- `G#dim7 -> Am`;
- `Edim7 -> F`;
- `F#dim7 -> G7`.

Tambem foi corrigida uma ambiguidade no reconhecimento de preparacoes menores: acordes diminutos nao devem ser tratados como menores apenas porque a cifra contem `dim`.

## Apresentacao

A camada de sugestao de inversoes nao adiciona mais slash bass em acordes `dim7`.

O diminuto completo e simetrico; uma cifra como `G#dim7/B` pode ate representar uma disposicao possivel, mas comunica pouco e polui a leitura. Para o usuario, a forma musicalmente mais clara e `G#dim7`.

## Resultado no exemplo Almada

No exemplo de `docs/musics/exemplo.musicxml`, a proposta de diminutos passou a aparecer como:

`C / G#dim7 / Am / Edim7 / F / F/C / Bm7b5 / F#dim7 / G7 / C`

O contraste com Almada melhorou no item de diminutos de passagem:

- antes: 29% de sobreposicao de cifras, 61% de afinidade;
- depois: 43% de sobreposicao de cifras, 69% de afinidade.

## Decisao

Manter os diminutos como rearmonizacao alternativa de baixa a media densidade, validada por resolucao local e nao por atalho de musica especifica.

O proximo refinamento teorico-pratico deve separar tres usos:

- diminuto de passagem para alvo diatonico;
- diminuto de sensivel com funcao dominante aparente;
- diminuto como cor cromatica em rearmonizacoes densas.

## Artefatos

- `src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts`
- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`
- `src/utils/music/analysis/strategies/BassInversionSuggester.ts`
- `scripts/harmonic-strategy-properties.spec.ts`
- `scripts/almada-example-comparison.spec.ts`
- `docs/reports/f79-almada-example-comparison.md`
