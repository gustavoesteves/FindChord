# F118 - Auditoria de escalas contextuais no catalogo real

## Objetivo

Verificar a nova camada contextual contra as partituras reais do catalogo,
procurando cifras sem candidata, alteracoes que caiam em escala generica e
baixa cobertura melódica.

## Resultado

- 199 arquivos analisados;
- 7.431 eventos de cifra analisados;
- 0 cifras sem candidata;
- 0 fallbacks genericos em acordes alterados;
- 388 eventos com cobertura melódica abaixo de 50% na mesma medida.

## Leitura musical

O resultado mais importante foi eliminar os 50 fallbacks encontrados na
primeira passagem. Eles vinham de aliases ainda nao mapeados, como `7(#9,b13)`
e `(#5)`, e nao de uma decisao musical contextual.

As baixas coberturas restantes nao devem ser tratadas automaticamente como
erro: muitas cifras aparecem no mesmo compasso em que a melodia tem poucas ou
nenhuma nota estrutural. O proximo refinamento deve procurar notas vizinhas no
tempo e distinguir acorde sustentado, antecipacao, passagem e compasso sem
evento melodico.

## Artefatos

- `scripts/audit-contextual-scales.ts`;
- `scripts/generate-contextual-scale-audit.ts`;
- `scripts/contextual-scale-audit.spec.ts`;
- `docs/reports/f118-contextual-scale-audit.md`.

## Verificacao

- 8 testes focados aprovados;
- TypeScript e ESLint aprovados;
- auditoria completa gerada com sucesso.
