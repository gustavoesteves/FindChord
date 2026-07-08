# F53 — Evidencias da proposta no relatorio real

## Objetivo

Fazer o relatorio real auditar tambem o "por que funciona" da proposta primaria.

A F52 levou a evidencia do centro assistido para a explicacao da proposta. A F53 mostra essa explicacao no relatorio de obras reais, em uma forma curta.

## Decisao

`docs/reports/f39-real-music-audit-report.md` agora inclui:

```text
- Evidencias da proposta:
  - cria uma cadência local para A
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
```

O relatorio mostra no maximo quatro evidencias unicas da proposta primaria.

## Ajuste importante

Durante a auditoria, apareceu um caso musicalmente ambíguo:

- a janela tinha centro assistido por referencia em `Eb`;
- a proposta primaria era uma cadencia ii-V local para `A`.

Nesse caso, anexar `Centro da frase: Eb` na explicacao da proposta confundia a leitura, porque a proposta estava declarando outro alvo local.

Por isso, a F53 adiciona uma guarda:

> Se a proposta declara cadencia local para um alvo diferente do centro da frase, a evidencia de centro da frase nao e anexada ao card.

## Por que importa

Centro de frase e alvo cadencial local nao sao sempre a mesma coisa.

O sistema pode estar certo em dizer:

- a janela tem centro de referencia em `Eb`;
- esta proposta especifica cria uma cadencia local para `A`.

Mas essas duas informacoes precisam aparecer separadas para nao parecer contradicao.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-aware-phrase-context.spec.ts scripts/real-music-audit-report.spec.ts`
- `npm run report:real-music`
