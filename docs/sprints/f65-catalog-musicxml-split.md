# F65 - Split de catalogos MusicXML importados

## Objetivo

Desmembrar os livros MusicXML exportados a partir do MuseScore em arquivos individuais de staging, sem ainda promover essas musicas para `docs/musics`.

## Entrada

O script descobre automaticamente arquivos `.musicxml`, `.xml` e `.mxl` em `docs/imports`.

Os `.mscz` originais permanecem como fonte bruta. Quando a entrada e `.mxl`, o script extrai o `score.xml` interno e segue o mesmo fluxo de split.

## Regra de split

- Cada novo arquivo comeca em uma pagina que possui `<credit-type>title</credit-type>`.
- A pagina 1 e tratada como capa do livro e ignorada.
- Creditos de subtitulo, como paginas de continuacao, nao abrem nova musica.
- Titulos com sufixo explicito de continuacao, como `(2/2)`, sao anexados ao titulo anterior.
- O fim de uma musica e a pagina anterior ao proximo titulo.
- O arquivo gerado preserva os compassos originais e cria um `score-partwise` minimo com titulo, compositor quando disponivel, `identification`, `defaults` e `part-list`.
- Os numeros de compasso sao normalizados para comecar em 1 dentro de cada arquivo desmembrado.

## Entregaveis

- Script repetivel: `npm run import:split-catalog`
- Area de staging: `docs/imports/split`
- Relatorio: `docs/reports/f65-catalog-split-report.md`
- Teste de contrato: `scripts/split-musicxml-catalog.spec.ts`

## Criterio de aceite

- Rodar o script deve gerar arquivos individuais em `docs/imports/split`.
- O relatorio deve listar origem, paginas, titulo, compositor, quantidade de compassos e caminho do arquivo.
- Paginas sem titulo proprio devem permanecer acopladas a musica anterior.
- Nada deve ser copiado automaticamente para `docs/musics`.

## Proximo bloco

Depois do split, o catalogo de staging precisa passar por uma auditoria leve:

- legibilidade pelo parser MusicXML;
- compatibilidade das cifras com nosso dicionario;
- presenca de melodia util para harmonizacao;
- duplicatas, variantes e continuacoes;
- escolha de quais arquivos entram no catalogo real de pesquisa.
