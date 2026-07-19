# F221 - Geometria do braço no Escrever

## Objetivo

Reduzir a quantidade de regra visual embutida no `VirtualFretboard`, extraindo a geometria fixa do braço principal para um serviço testável do dominio `writer`.

## Alterações

- Criado `writerFretboardGeometry`, responsavel por dimensoes, marcadores, posicoes de trastes e posicoes verticais das cordas.
- `VirtualFretboard` passou a consumir essa geometria em vez de manter constantes e contas locais espalhadas pelo JSX.
- Adicionado teste de regressao para preservar largura, altura, quantidade de casas, marcadores, posicoes de casas e geometria das cordas.

## Resultado

O componente continua desenhando o mesmo braço, mas a parte geometrica agora esta isolada. Isso deixa o modulo `Escrever` mais facil de refatorar sem misturar decisao visual, interacao e leitura musical no mesmo arquivo.
