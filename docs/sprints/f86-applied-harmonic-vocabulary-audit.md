# F86 - Auditoria de vocabulario harmonico aplicado

## Objetivo

Usar a parte aplicada do Almada como lente teorica para auditar o corpus real, separando formulas harmonicas relevantes antes de criar novas regras de geracao.

A decisao central desta fase: o motor nao deve depender de genero ou estilo musical. O repertorio brasileiro, jazzistico ou popular serve como corpus de exemplos, mas a engine deve decidir por coerencia melodica, funcional, cadencial e por conducao de vozes.

## Implementacao

Foi criado o script `scripts/audit-applied-harmonic-vocabulary.ts`.

Ele percorre recursivamente `docs/musics` e gera:

- `docs/reports/f86-applied-harmonic-vocabulary-audit.md`;
- `docs/reports/f86-applied-harmonic-vocabulary-audit.csv`.

O relatorio mede familias harmonicas, nao genero, estilo ou procedencia.

## Familias medidas

- celulas `ii-V`;
- dominantes aplicadas;
- dominantes primarias;
- SubV/resolucoes dominantes por semitom;
- diminutos e diminutos resolvidos localmente;
- cores `bVI`/`bVII`;
- cadencias plagais menores;
- tonicas `6`/`6/9`;
- densidade de slash chords.

## Resultado inicial

Foram auditados 199 arquivos.

Resumo:

- 197 arquivos com cifras de referencia;
- 2 arquivos sem cifras;
- 0 erros de parse;
- 543 celulas ii-V;
- 794 dominantes aplicadas;
- 291 resolucoes por semitom/SubV;
- 208 diminutos, sendo 72 resolvidos localmente;
- 156 cores `bVI`/`bVII`;
- 28 cadencias plagais menores;
- 160 tonicas `6`/`6/9`.

Entre as obras mais promissoras aparecem repertorios diferentes com vocabulario harmonico semelhante. Isso confirma que a auditoria e uma triagem de vocabulario, nao um classificador de genero.

## Decisao

Manter esta auditoria separada do relatorio geral de harmonizacao.

Ela deve servir para escolher obras e trechos para escuta/auditoria quando formos enriquecer o motor com vocabulario harmonico real. A proxima etapa nao deve gerar regras novas automaticamente a partir do score; deve primeiro separar:

- recorrencias harmonicas estaveis;
- cromatismos explicaveis por funcao ou conducao;
- casos em que a inferencia de idioma ainda esta fraca.

## Artefatos

- `scripts/audit-applied-harmonic-vocabulary.ts`
- `scripts/applied-harmonic-vocabulary-audit.spec.ts`
- `docs/reports/f86-applied-harmonic-vocabulary-audit.md`
- `docs/reports/f86-applied-harmonic-vocabulary-audit.csv`
- `docs/theory/almada_harmonia_funcional_source_map.md`
