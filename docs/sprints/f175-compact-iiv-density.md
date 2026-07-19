# F175 - Densidade por ii-V compacto

## Objetivo

Transformar a leitura de densidade do F113 em um refinamento musical do motor, sem criar excecoes por musica.

O diagnostico mostrou que muitas referencias densas nao estavam pedindo "mais acordes" de forma generica. Elas usavam, com muita frequencia, celulas `ii-V` no mesmo compasso.

## Mudanca

Foi adicionada uma proposta nova:

- `Estratégia — ii-V compacto`

Ela nasce da mesma gramatica local ii-V ja existente, mas oferece uma versao condensada:

```text
ii | V | I
```

tambem pode aparecer como:

```text
ii-V | I | I
```

A proposta so e criada quando:

- ha uma janela local ii-V-I plausivel;
- o primeiro compasso sustenta melodicamente tanto a preparacao quanto a dominante;
- a chegada local continua coberta pela melodia;
- o alvo cadencial da frase tambem entra como candidato quando tem confianca suficiente.

## Impacto no catalogo

Antes deste sprint, o F113 mostrava:

- densidade sugerida por propostas da melodia: 85
- densidade coberta apenas por contorno/ritmo da referencia: 84
- lacunas de densidade na leitura melodica: 13

Depois do ii-V compacto:

- densidade sugerida por propostas da melodia: 165
- densidade coberta apenas por contorno/ritmo da referencia: 15
- lacunas de densidade na leitura melodica: 2

## Exemplos observados

- `Airegin.musicxml`: passa a oferecer `Ebm7 Ab7 | Dbmaj7 | Dbmaj7`.
- `Boplicity.musicxml`: passa a oferecer `Fm7 Bb7 | Ebmaj7 | Ebmaj7`.
- `Corcovado.musicxml`: passa a oferecer `Fm7 Bb7 | Ebmaj7 | Ebmaj7`.
- `Dindi.musicxml`: passa a oferecer `Am7 D7 | Gmaj7 | Gmaj7`.

## Leitura musical

Este refinamento e importante porque ele nao aumenta densidade por decoracao. Ele aumenta densidade quando a propria melodia permite comprimir uma funcao predominante-dominante antes de uma chegada local.

O proximo bloco deve olhar os 15 casos ainda classificados como `densidade-apenas-referencia` e os 2 casos `lacuna-de-densidade`. A fila restante parece menos dominada por ii-V e mais ligada a SubV, dominantes aplicadas e diminutos resolvidos.

## Validacao

- `npm run test:curated -- scripts/ii-v-functional-grammar.spec.ts scripts/harmonization-density-audit.spec.ts`
- `npm run report:harmonization-density`
