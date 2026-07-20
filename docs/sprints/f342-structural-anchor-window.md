# F342 - Janela estrutural conservadora para anchors melodicos

## Origem

A auditoria em `docs/auditoria.md` apontou que o limite de 32 notas podia criar um falso final de frase: a 32a nota era tratada como cadencia mesmo quando a melodia resolvia logo depois.

## Objetivo

Corrigir o falso final sem transformar a selecao inicial em uma reamostragem agressiva da obra inteira.

## Implementacao

- Quando a melodia excede o limite, a janela preserva a primeira amostra.
- Se a ultima nota real da selecao esta imediatamente apos o corte, ela substitui a ultima nota da janela.
- Se a ultima nota real esta muitos compassos depois, a janela inicial e mantida para nao puxar a analise de uma secao distante.
- A confianca cadencial passa a interpretar `duration` como ticks:
  - nota curta nao satura a cadencia;
  - nota longa de chegada pode atingir alta confianca.

## Resultado

O sistema evita o falso final local sem quebrar controles musicais como Asa Branca, onde uma melodia sem cifra deve continuar gerando harmonia de baixa densidade.

## Validacao

- Teste com 33 notas preservando a resolucao final imediata.
- Teste garantindo que nota curta em ticks nao gera confianca cadencial maxima.
- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts scripts/harmonization-density-audit.spec.ts`

## Proximo passo

Evoluir a selecao estrutural por secao real quando a ingestao de forma/timeline estiver mais robusta, evitando heuristicas globais em partituras longas.
