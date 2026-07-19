# F268 - Contrato de foco em Materiais do acorde

## Objetivo

Centralizar a regra de foco valido para os materiais do acorde.

## Alteracoes

- `resolveWriterMaterialFocus` passa a aceitar uma escolha explicita somente se ela pertence a paleta ativa.
- O modelo da tela deixa de duplicar essa verificacao antes de resolver o foco.
- Testes cobrem selecao valida e descarte de selecao antiga.

## Resultado

Ao trocar rota ou acorde, a tela evita manter uma ideia antiga fora do conjunto atual e volta para a primeira ideia musicalmente disponivel.
