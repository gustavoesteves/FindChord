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
- A auditoria real (`findHarmonizableWindow`) agora aceita o snapshot completo e resolve a tonalidade pelo início de cada janela melódica.
- Auditorias e calibrações derivadas passaram a chamar `findHarmonizableWindow` com o snapshot completo quando disponível.
- A auditoria de janelas apresentáveis passou a resolver a tonalidade de cada janela candidata pelos anchors.
- Diagnósticos e relatórios que chamavam `PhraseAnalysisEngine.analyzePhrase` diretamente passaram a resolver a tonalidade pelos anchors quando usam snapshot real.
- Fallbacks de comparação sem proposta agora usam o contexto temporal inicial em vez de ler a armadura global diretamente.
- `GravityFieldManager` e `HarmonicRegionResolver` agora aceitam `measureTicks`, permitindo que regiões experimentais convertam ticks para compassos pelo mapa real da partitura.
- A UI do Harmonizar, segmentos locais e auditorias reais passaram a repassar `measureTicks` para a geração apenas quando a métrica pede mapa explícito e a resolução em ticks é compatível com o passo temporal atual do resolver.
- `selectMelodicAnchors` passou a aceitar `measureTicks` para filtrar seções e inferir `measureIndex` sem assumir 1920 ticks por compasso quando a nota não informa `measure`.
- Adicionado teste de regressão para:
  - C menor vindo da timeline ser entregue ao motor como `Cm`;
  - mudança posterior para D maior em 3/4;
  - fallback para snapshots antigos sem timeline.
- Adicionado teste de regressão para a auditoria real não voltar a usar apenas a tonalidade global em janelas harmonizáveis.

## Próximos consumidores

- Comparadores de referência devem usar a tonalidade do trecho avaliado.
- Seletores de janelas que ainda não recebem snapshot devem continuar sendo avaliados antes de remover todos os fallbacks 4/4.
- O resolver experimental ainda usa passo interno fixo de 480 ticks; partituras importadas com resolução menor não devem ativar `measureTicks` até essa camada receber PPQ/divisions explícito.
- O painel de Improviso pode herdar o mesmo resolvedor quando comparar materiais por região.

## Critério musical

O sistema deve tratar a armadura inicial como um indício local, não como verdade global. A seção em análise é quem decide o contexto tonal e métrico usado pelo motor.
