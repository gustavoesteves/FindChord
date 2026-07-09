# F72 - Auditoria da base harmonica

## Objetivo

Validar a primeira faixa do plano F71 antes de alterar regras de rearmonizacao.

A pergunta desta sprint e simples: nos casos de `Centro de referencia` e `Harmonia basica`, a proposta primaria do Harmonizar preserva funcao suficiente em relacao a harmonia de referencia?

## Entregas

- Script: `scripts/audit-calibration-foundation.ts`
- Teste: `scripts/audit-calibration-foundation.spec.ts`
- Relatorio: `docs/reports/f72-calibration-foundation-audit.md`
- CSV: `docs/reports/f72-calibration-foundation-audit.csv`
- Comando: `npm run import:audit-calibration-foundation`

## Resultado

- Casos auditados: 6
- Base aprovada: 5
- Revisao musical: 1
- Trabalho de motor: 0
- Sem proposta: 0
- Erro de parse: 0

## Leitura musical

`After you`, `African flower`, `Donna Lee`, `Blue in green` e `End of a love affair` viraram ancoras positivas: as propostas preservam funcao integralmente na janela comparada, mesmo quando trocam raiz.

`Freight trane` ficou em revisao musical: ha apoio funcional parcial, mas a diferenca entre centro local/global e o idioma da referencia pedem escuta antes de mexermos no motor.

`Blue in green` deixou de promover `Gm7 | C7 | Fmaj7` como resposta primaria. A chegada em F foi preservada como meia-cadencia no centro de Bb, nao como tonica local de F maior.

`After you` deixou de ser tratado como F maior por melodia: a cadeia dominante da referencia confirmou Bb maior por V-I local.

## Proxima acao

Como nao ha mais caso marcado como trabalho de motor neste lote, a proxima etapa deve ser escuta e revisao musical do caso parcial:

1. `Freight trane`, por divergencia entre centro global e centro local.

So depois disso vale voltar aos blocos de cromatismo, contraponto de baixo e alta densidade.
