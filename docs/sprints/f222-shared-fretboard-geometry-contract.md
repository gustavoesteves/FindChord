# F222 - Contrato compartilhado de fretboard

## Objetivo

Comecar a reduzir a duplicacao entre o `Braço` e o painel `Materiais do acorde`, sem redesenhar a interface inteira neste passo.

## Decisao

Os dois fretboards continuam existindo como experiencias diferentes:

- `Braço`: entrada, edicao e envio do acorde.
- `Materiais do acorde`: leitura de vocabulario melodico sobre o acorde.

Mas a geometria basica agora passa por um contrato comum em `fretboardGeometry`.

## Alterações

- Criado `src/utils/music/presentation/fretboardGeometry.ts`.
- `writerFretboardGeometry` virou um adaptador do modo principal do `Escrever`.
- `localMaterialFretboardGeometry` virou um adaptador compacto para `Materiais do acorde`.
- Adicionado teste de contrato compartilhado para posicoes de casas, trastes, marcadores e cordas.

## Proximo passo

Com a geometria compartilhada, o caminho natural e extrair uma camada de `FretboardViewModel`: notas visiveis, papeis musicais, rotulos, interacoes e modo de uso. Isso permitiria um unico renderer de braço com leituras diferentes para entrada, materiais e improviso.
