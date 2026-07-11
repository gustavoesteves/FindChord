# F119 - Janela temporal da melodia

## Objetivo

Melhorar a evidencia melodica usada para ranquear escalas contextuais. A cifra
deve ser comparada primeiro com as notas que realmente soam durante seu
intervalo, e nao apenas com todas as notas do mesmo compasso.

## Regra de selecao

1. notas que se sobrepoem ao intervalo temporal da cifra;
2. notas do mesmo compasso quando nao ha ticks confiaveis;
3. vizinhanca imediata de um compasso, com metade do peso, quando o compasso
   esta vazio.

Essa ordem preserva a evidencia local e evita que uma nota distante determine
sozinha o campo de uma cifra sustentada.

## Resultado no catalogo

- 199 arquivos analisados;
- 7.431 eventos de cifra;
- 0 cifras sem candidata;
- 0 fallbacks genericos em acordes alterados;
- baixa cobertura reduziu de 388 para 327 eventos.

A reducao confirma que parte importante do alerta anterior era um artefato da
janela por compasso. Os 327 casos restantes continuam disponiveis para
triagem musical: podem ser compassos sem melodia, notas de passagem, acordes
antecipados ou cifras que exigem uma janela maior que um compasso.

## Verificacao

- 4 testes focados aprovados;
- auditoria temporal gerada em `docs/reports/f119-contextual-scale-temporal-audit.md`;
- TypeScript e ESLint aprovados.
