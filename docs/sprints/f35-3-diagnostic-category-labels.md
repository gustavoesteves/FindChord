# F35.3 — Etiquetas de Categoria nos Diagnosticos

## Objetivo

Deixar o bloco de diagnosticos mais legivel sem aumentar a quantidade de texto.

Depois de agrupar por origem, cada mensagem passa a mostrar tambem sua categoria:

```text
Omissão
Comparação
Compatibilidade
```

## Decisao teorica

Origem e categoria respondem perguntas diferentes.

Origem responde:

```text
De onde veio essa leitura?
```

Categoria responde:

```text
Que tipo de leitura e essa?
```

Isso evita que uma omissao por melodia, uma comparacao de apresentacao e uma incompatibilidade cromatica parecam o mesmo tipo de aviso.

## Comportamento implementado

Exemplo:

```text
Melodia
Omissão  SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.

Referência
Omissão  Cadência dominante evitada: a referência favorece centro modal claro.
```

## Implementacao

Arquivos principais:

```text
src/domains/harmonizer/components/HarmonizerProposalList.tsx
src/utils/music/analysis/models/HarmonicDiagnostic.ts
```

Mudancas:

- a UI exibe uma etiqueta curta por `diagnostic.category`;
- criado `HarmonicDiagnosticCategoryGroup`;
- criado `groupDiagnosticsByCategory` para preservar a semantica no contrato;
- a ordem estavel das categorias e `omission`, `comparison`, `compatibility`.

## Testes

Coberto por:

```text
scripts/omitted-strategy-diagnostics.spec.ts
```

## Fora do escopo

- Criar cores diferentes por categoria.
- Separar visualmente cada categoria em subgrupos.
- Adicionar severidade.

## Proxima fatia

F35.4 transformou diagnosticos comparativos em dados reais vindos do `ProposalPresentationPlanner`, em vez de apenas categorias disponiveis no contrato.

Ver:

```text
docs/f35-4-presentation-diagnostics.md
```
