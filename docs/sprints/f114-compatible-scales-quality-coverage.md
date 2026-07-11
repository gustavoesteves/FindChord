# F114 - Cobertura semantica das escalas compativeis

## Objetivo

Corrigir o primeiro nivel do motor de escalas compativeis: cada qualidade de
acorde registrada na DSL deve receber uma familia de escalas coerente, sem cair
silenciosamente em `major` e `minor pentatonic`.

## Decisao

`getCompatibleScales` continua sendo um adaptador de acorde isolado. A ordem
das escalas indica estabilidade pedagogica, nao uma escolha definitiva para a
musica. Funcao harmonica, melodia, centro tonal e resolucao continuam sendo
responsabilidades do futuro adaptador contextual do `Harmonizar`.

## Alteracoes

- substituida a cadeia de condicionais por um registro explicito por qualidade;
- cobertas as qualidades de maior, menor, dominante, suspenso, aumentado,
  diminuto e meio-diminuto;
- `dominant7b9` e `dominant7b13` agora priorizam `phrygian dominant`;
- `dominant7#9` agora prioriza `altered`;
- `dominant7#11` agora prioriza `lydian dominant`;
- `halfDiminished` agora prioriza `locrian #2`, sem usar diminuta
  meio-tom-tom como se fosse sua leitura principal;
- `diminished7th` agora usa `whole-half diminished`;
- `augmented` agora usa `whole tone`;
- adicionados testes para as qualidades alteradas e para a ausencia do fallback
  generico.

## Verificacao

- teste focado: 9 testes aprovados;
- TypeScript: aprovado;
- ESLint dos arquivos alterados: aprovado;
- suite curada: 75 arquivos aprovados, 2 ignorados; 404 testes aprovados, 6
  ignorados.

## Limite conhecido

Ainda nao existe contexto suficiente para decidir entre as candidatas. Por
exemplo, `mixolydian` pode ser a leitura natural de um V7, enquanto `altered`
so deve subir no ranking quando a melodia, a cifra ou a resolucao sustentarem
as alteracoes. Esse e o proximo bloco: F115, o modelo de candidata contextual.
