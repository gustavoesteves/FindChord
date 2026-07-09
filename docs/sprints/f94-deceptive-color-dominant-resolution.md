# F94 - Chegada deceptiva por cor de terca

## Objetivo

Atacar o maior grupo restante da F93: `possible-deceptive-color`.

Esses casos tinham algo em comum: a dominante alterada nao chegava ao alvo esperado, mas caia em uma regiao de terca ligada a esse alvo.

Exemplo:

- `D7(b9)` esperaria `G`;
- a referencia chega em `Bm7`;
- `Bm7` nao e o alvo direto, mas funciona como regiao de terca de `G`.

## Decisao

A resolucao deceptiva agora aceita quatro regioes de terca em relacao ao alvo esperado:

- `bIII`;
- `III`;
- `bVI`;
- `VI`.

Isso cobre tanto o gesto deceptivo classico mais conhecido quanto chegadas por cor de mediante/submediante muito comuns no repertorio real.

## Limite

A regra continua curta e contextual:

- precisa ser o acorde seguinte;
- precisa partir de dominante reconhecida;
- nao aumenta a janela de busca;
- nao transforma qualquer cromatismo em resolucao.

## Impacto esperado

Os casos que antes apareciam como `possible-deceptive-color` devem sair da fila de dominantes sem alvo local.

O que restar em `unresolved-review` e `terminal-dominant` fica mais confiavel para escuta manual e calibragem de penalidade.

## Resultado no catalogo

Depois de regenerar F91/F93:

- as alteradas com resolucao contextual subiram de 68 para 89;
- as alteradas sem alvo local cairam de 53 para 32;
- `possible-deceptive-color` saiu da fila F93;
- restaram 19 `unresolved-review`, 9 `terminal-dominant` e 4 `long-delayed-resolution`.

Isso sugere que a nova regra capturou um padrao real sem precisar aumentar a janela de analise.

## Continuação F95

Ao olhar os 19 casos realmente problemáticos, apareceu outro padrão seguro: dominante alterada que não resolve no alvo esperado, mas alivia a cor mantendo a mesma raiz.

Exemplos:

- `A7alt -> A13`;
- `F7(#5) -> F7`;
- `C7(b9) -> C`.

Esse comportamento foi separado como `same-root-color-release`. Ele não equivale a resolução cadencial, mas também não deve ser penalizado como dominante sem destino.
