# F290 - Fixtures alinhados aos labels de acao

## Objetivo

Evitar que fixtures manuais de `Materiais do acorde` dupliquem o mapeamento de intencao para acao.

## Alteracoes

- Fixtures em testes de rotas, foco e acao passam a usar `actionLabelForWriterMaterialIntent`.
- Expectativas de paleta continuam literais para proteger o contrato visivel.

## Resultado

Os testes ficam mais fieis ao fluxo de producao e reduzem duplicacao de strings de apresentacao.
