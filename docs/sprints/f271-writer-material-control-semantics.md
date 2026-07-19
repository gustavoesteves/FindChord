# F271 - Semantica dos controles em Materiais do acorde

## Objetivo

Melhorar a semantica dos controles interativos da tela `Materiais do acorde`.

## Alteracoes

- Botoes de rota, modo, categorias, detalhes, limpeza e audio passam a declarar `type="button"`.
- Toggles visuais passam a expor estado com `aria-pressed`.
- O painel de detalhes passa a expor abertura com `aria-expanded`.

## Resultado

A tela mantem a mesma aparencia, mas os controles ficam mais previsiveis, acessiveis e robustos para navegacao por teclado.
