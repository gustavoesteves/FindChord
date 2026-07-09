# F69 - Auditoria musical do corpus importado

## Objetivo

Avaliar as 181 musicas promovidas para `docs/musics/imported-real-book` como material de calibragem do Harmonizar.

## Escopo

Esta auditoria nao altera o catalogo curado no topo de `docs/musics`.

Ela mede:

- leitura MusicXML;
- presenca de melodia;
- capacidade de encontrar uma janela harmonizavel;
- quantidade de propostas geradas;
- centro escolhido;
- sobreposicao entre proposta e harmonia de referencia.

## Comando

```bash
npm run import:audit-promoted
```

## Entregaveis

- Relatorio: `docs/reports/f69-promoted-import-corpus-audit-report.md`
- CSV: `docs/reports/f69-promoted-import-corpus-audit.csv`
- Script: `scripts/audit-promoted-import-corpus.ts`

## Proximo uso

Selecionar um subconjunto de obras harmonizadas com boa sobreposicao de referencia para calibrar:

- escolha de janela melodica;
- centro local versus centro global;
- harmonia basica versus referencia;
- ranking de propostas;
- linguagem de divergencia com a harmonia do autor.
