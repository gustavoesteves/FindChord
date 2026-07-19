# F253 - Modelo da tela de materiais do acorde

## Objetivo

Retirar de `ScaleOverlayPanel` a cadeia de montagem dos dados da tela.

## Alteracoes

- Criado `writerMaterialScreenModel`.
- O modelo resolve nome do acorde por estilo de notacao.
- O modelo monta leituras, paleta, rotas, rota efetiva, apresentacao da rota, foco, painel ativo e acao tocavel.
- `ScaleOverlayPanel` passa a consumir um objeto pronto para renderizacao.
- Adicionado teste dedicado para o modelo.

## Resultado

A tela fica mais declarativa e a decisao musical/estrutural da aba Materiais do acorde passa a ser testavel fora do React.
