# F68 - Promocao dos candidatos importados

## Objetivo

Promover os arquivos tecnicamente bons do staging importado sem misturar automaticamente esse lote com o catalogo curado ja existente em `docs/musics`.

## Decisao

- Arquivos `candidate` da auditoria F66 entram em `docs/musics/imported-real-book`.
- Arquivos `needs-review` entram em `docs/imports/review`.
- O topo de `docs/musics` permanece como catalogo curado/manual.

Essa separacao evita duplicatas imediatas com as musicas ja existentes e preserva a possibilidade de promover manualmente apenas obras escolhidas para os testes principais.

## Comando

```bash
npm run import:promote-candidates
```

## Resultado esperado neste lote

- 181 arquivos promovidos.
- 32 arquivos separados para revisao manual.

## Proximo bloco

Depois da revisao manual, decidir se os 32 arquivos devem:

- entrar no contrato de cifra;
- passar por limpeza de importacao;
- ficar fora do catalogo real;
- ou ser promovidos manualmente para `docs/musics/imported-real-book`.
