# F66 - Auditoria do staging importado

## Objetivo

Auditar os arquivos gerados em `docs/imports/split` antes de promover qualquer musica para `docs/musics`.

## Perguntas

- O arquivo MusicXML abre no parser real do app?
- Ha notas melodicas lidas?
- Ha cifras MusicXML lidas?
- A quantidade de cifras lidas corresponde aos blocos `<harmony>` brutos?
- As cifras importadas entram no resolvedor moderno de cifras sem ambiguidade?
- Quais arquivos parecem bons candidatos tecnicos para a proxima curadoria musical?

## Entregaveis

- Script repetivel: `npm run import:audit-split`
- Relatorio Markdown: `docs/reports/f66-import-split-audit-report.md`
- Dados filtraveis: `docs/reports/f66-import-split-audit.csv`
- Teste de contrato: `scripts/audit-import-split-catalog.spec.ts`

## Criterio de classificacao

Um arquivo e classificado como candidato tecnico quando:

- o MusicXML e parseado sem erro;
- ha notas lidas;
- as cifras MusicXML, quando existem, sao lidas quase integralmente;
- o resolvedor de cifras nao encontra ambiguidade relevante.

Arquivos com problemas entram em revisao, nao sao descartados automaticamente.

## Proximo bloco

Usar o relatorio para escolher um subconjunto de obras para escuta/curadoria e entao promover apenas as melhores para `docs/musics`.
