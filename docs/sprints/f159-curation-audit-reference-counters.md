# F159 - Contadores separados na auditoria de curadoria

## Objetivo

Deixar o relatorio F108 mais honesto depois das F157/F158.

Antes, a coluna `groupedColorIdeas` podia misturar duas coisas diferentes:

- leituras proximas da harmonia da partitura;
- variacoes de cor entre propostas geradas.

Agora a auditoria separa:

```text
groupedReferenceIdeas
groupedColorIdeas
```

## Resultado no catalogo atual

Depois de regenerar o F108 em 199 partituras:

```text
Leituras proximas da referencia agrupadas: 0
Variacoes de cor agrupadas: 4
Partituras com zero ou uma ideia visivel: 0
```

Isso e uma leitura importante: a curadoria atual reduziu duplicacao entre propostas geradas, mas nao esta escondendo leituras proximas da cifra autoral no catalogo analisado.

## Decisao de produto

Os relatorios precisam distinguir:

- o que foi removido por ser repeticao exata;
- o que virou leitura proxima da referencia;
- o que virou variacao de cor de outra proposta;
- o que segue como card independente.

Essa separacao evita a falsa impressao de que estamos apagando a harmonia do autor quando, na pratica, estamos agrupando ideias geradas que nao acrescentam consequencia harmonica nova.

## Validacao

- `scripts/proposal-curation-audit.spec.ts` exige que `repeatedMainIdeas` seja a soma de repeticoes exatas, leituras proximas da referencia e variacoes de cor.
- `docs/reports/f108-proposal-curation.md` foi regenerado com a nova coluna `Referencia`.
- `docs/reports/f108-proposal-curation.csv` ganhou a coluna `groupedReferenceIdeas`.
