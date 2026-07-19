# F223 - Notas visiveis do fretboard de entrada

## Objetivo

Avancar na separacao entre renderer de fretboard e decisao musical no modulo `Escrever`.

## Alterações

- Criado `writerInputFretboardNotes`, responsavel por transformar afinacao, casas selecionadas e acorde ativo em notas visiveis.
- `VirtualFretboard` deixou de decidir cor, rotulo e exibicao das notas diretamente no JSX.
- Adicionado teste cobrindo cordas ativas, rotulos sem acorde e cores funcionais com acorde ativo.

## Resultado

O `Braço` fica mais perto de consumir um `FretboardViewModel`: o componente ainda desenha o SVG, mas a camada que decide o que aparece no braço ja saiu do JSX.

## Proximo passo

Extrair um renderer comum de fretboard que receba geometria, notas visiveis e callbacks. Isso deve permitir aproximar `Braço` e `Materiais do acorde` sem perder os modos de uso especificos de cada tela.
