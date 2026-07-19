# F216 - Remoção da biblioteca antiga no Escrever

## Diagnóstico

A aba `Acorde & Biblioteca` carregava duas responsabilidades muito diferentes:

- leitura do acorde desenhado;
- uma biblioteca pessoal de shapes com histórico, favoritos, importação e exportação JSON.

Ao investigar o código, a biblioteca estava toda concentrada em `TranslationLayer` e não aparecia conectada a outro fluxo relevante do sistema.

Ela persistia dados em:

- `findchord_library`;
- `findchord_captured`;
- `findchord_favorites`.

Na prática, era um mini-produto legado dentro da tela de leitura do acorde.

## Mudança

`TranslationLayer` foi simplificado para fazer apenas a leitura do acorde ativo:

- símbolo;
- notas tocadas;
- baixo;
- inversão;
- estrutura;
- tensões;
- nível de tensão.

Foram removidos:

- captura de acorde;
- biblioteca pessoal;
- favoritos;
- histórico;
- import/export JSON;
- persistência em `localStorage`.

A aba foi renomeada de `Acorde & Biblioteca` para `Leitura do acorde`.

## Por que isso importa

Essa remoção deixa o `Escrever` mais coerente com o rumo atual:

- desenhar acorde;
- entender o acorde;
- encontrar aberturas;
- explorar materiais locais.

A biblioteca antiga não ajudava diretamente o compositor/arranjador dentro desse fluxo e aumentava bastante o custo de manutenção da tela.
