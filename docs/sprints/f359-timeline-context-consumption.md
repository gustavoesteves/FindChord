# F359 — Consumo de timeline tonal e métrica

## Objetivo

Fazer os motores deixarem de depender apenas dos campos legados `metadata.keySignature` e `metadata.timeSignature` quando o snapshot já possui `keyTimeline` e `timeTimeline`.

## Decisão

Os campos antigos continuam existindo como fallback e compatibilidade. A leitura musical ativa deve passar por um resolvedor de contexto temporal:

- escolher a última entrada de `keyTimeline` válida no tick da seção;
- escolher a última entrada de `timeTimeline` válida no tick da seção;
- converter modo menor para a forma analítica explícita, como `Cm`;
- cair para `metadata.keySignature/timeSignature` se a partitura ainda não tiver timeline.

Isso evita que uma peça modulante ou uma seção em menor seja analisada como se toda a obra estivesse na primeira armadura.

## Implementado

- Criado `scoreTimelineContext`, um contrato reutilizável para resolver tonalidade e métrica por tick ou por seção ativa.
- O hook principal do Harmonizar agora usa o contexto da seção ativa para:
  - análise de frase;
  - geração de segmentos locais.
- Adicionado teste de regressão para:
  - C menor vindo da timeline ser entregue ao motor como `Cm`;
  - mudança posterior para D maior em 3/4;
  - fallback para snapshots antigos sem timeline.

## Próximos consumidores

- Scripts de auditoria real devem resolver contexto por janela, não pela tonalidade global.
- Comparadores de referência devem usar a tonalidade do trecho avaliado.
- Seletores de janelas e motores temporais devem consumir `measureTicks/timeTimeline` para evitar pressupor 4/4 fixo.
- O painel de Improviso pode herdar o mesmo resolvedor quando comparar materiais por região.

## Critério musical

O sistema deve tratar a armadura inicial como um indício local, não como verdade global. A seção em análise é quem decide o contexto tonal e métrico usado pelo motor.
