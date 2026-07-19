# F292 - Sincronia de intenção no factory de teste

## Objetivo

Evitar inconsistência entre `intentLabel` e `actionLabel` no factory de testes de `Materiais do acorde`.

## Alterações

- `writerMaterialTestItem` passa a resolver a intenção final antes de derivar o label de ação.
- Caso um teste sobrescreva `intentLabel`, o `actionLabel` acompanha essa nova intenção.
- Sobrescrita explícita de `actionLabel` continua possível quando o teste realmente precisar.

## Resultado

Os fixtures de teste continuam pequenos, mas ficam mais fiéis ao contrato real da paleta.
