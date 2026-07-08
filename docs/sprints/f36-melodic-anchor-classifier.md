# F36 — Classificador de Ancoras Melodicas

## Objetivo

Separar nota estrutural, nota de passagem e ornamento antes de escolher acordes.

O motor ja verificava se a harmonia cobria a melodia, mas varias escolhas ainda tratavam as notas do compasso de forma quase equivalente. Isso podia fazer uma nota curta de passagem pesar tanto quanto um apoio melodico longo.

## Decisao teorica

A melodia nao e apenas uma lista de alturas. Para harmonizar, o sistema precisa diferenciar:

- apoio estrutural;
- nota de passagem;
- ornamento curto;
- nota final de frase;
- repeticao melodica relevante.

Essa camada nao cria contraponto completo. Ela cria uma nocao minima de peso melodico para orientar a escolha harmonica e preparar uma futura camada de conducao de vozes.

## Comportamento implementado

Foi criado um classificador inicial com tres papeis:

```text
structural  -> apoio melodico, nota longa, inicio forte ou final de frase
passing     -> nota intermediaria que ainda pode carregar algum peso
ornamental  -> nota curta, pouco repetida, sem funcao estrutural clara
```

A escolha de acordes agora usa peso melodico em vez de apenas contagem bruta de notas ou duracao isolada.

Isso afeta:

- escolha de I/IV/V por compasso;
- deteccao de altura melodica proeminente;
- selecao de acordes de cobertura;
- selecao de acordes em centro modal;
- selecao de acordes no menor funcional.

## Detalhe importante

O classificador diferencia dois contextos:

- frase inteira: a ultima nota recebe peso cadencial;
- janela/compasso: o bonus de final e desligado para nao tratar todo compasso como cadencia.

Esse detalhe preserva casos modais como `Dm -> C -> Bb -> Dm`, onde a raiz do bVII deve continuar vencendo quando aparece como apoio real do compasso.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/MelodicAnchorClassifier.ts
src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts
```

Mudancas:

- `classifyMelodicAnchors` produz `role` e `weight`;
- `pitchProminence` calcula proeminencia por peso melodico;
- scores de cobertura harmonica usam `melodicAnchorWeight`;
- escolhas modais e menores aplicam bonus de raiz apenas quando a raiz e apoio estrutural no compasso.

## Testes

Coberto por:

```text
scripts/melodic-anchor-classifier.spec.ts
scripts/modal-center-strategy.spec.ts
scripts/minor-functional-strategy.spec.ts
scripts/minor-modal-boundary.spec.ts
```

## Fora do escopo

- Resolver suspensoes e retardos como eventos contrapontisticos completos.
- Modelar aproximacao cromatica por direcao intervalar.
- Gerar voicings ou linhas internas.
- Penalizar saltos reais entre vozes.

## Seguimento implementado

F36.1 levou essa mesma nocao de peso para os validadores de cobertura melodica.

```text
docs/f36-1-weighted-melodic-coverage.md
```
