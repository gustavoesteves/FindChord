# F252 - Navegador de rotas do material

## Objetivo

Separar o topo de navegacao de Materiais do acorde do componente principal.

## Alteracoes

- Criado `WriterMaterialRouteNavigator`.
- O componente concentra nome do acorde, rota ativa e botoes de intencao musical.
- `ScaleOverlayPanel` passa apenas acorde, rotas e handler de selecao.

## Resultado

O fluxo superior acorde -> intencao passa a ter um componente dedicado. O painel principal fica mais curto e mais claramente responsavel por orquestrar os presenters e componentes extraidos.
