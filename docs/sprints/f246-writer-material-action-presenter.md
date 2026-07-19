# F246 - Presenter da acao tocavel do material

## Objetivo

Separar a decisao de `Tocar agora` da camada visual de Materiais do acorde.

## Alteracoes

- Criado `writerMaterialAction`.
- A acao prioriza frase curada quando existe.
- Quando nao ha frase, a acao cai para uma audicao curta do mapa do material.
- O componente passa a consumir uma estrutura pronta: nome, escola, descricao, notas e rotulo do botao.

## Resultado

O comportamento musical de `Tocar agora` fica testavel e preparado para receber vocabulario mais rico sem aumentar a complexidade do componente.
