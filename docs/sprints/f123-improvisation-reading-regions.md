# F123 - Regioes de leitura para improviso

## Problema

A F122 separou as escalas por intencao musical, mas a leitura ainda era
essencialmente acorde-a-acorde. Isso funciona para progressoes densas, mas fica
fraco quando a propria harmonia indica uma area sustentada.

Exemplo: uma proposta como:

```text
Comp. 1-4  Cmaj7
Comp. 5-9  Fmaj7
```

nao deve ser percebida como uma escala pontual no compasso 1. Ela representa
uma regiao de leitura.

## Decisao

Cada sugestao de escala passa a carregar um alcance:

- `measure`: compasso onde o acorde aparece;
- `endMeasure`: ultimo compasso coberto antes do proximo acorde conhecido.

A partir disso, o `Harmonizar` cria `SectionScaleReadingRegion`, agrupando
leituras que sustentam uma area maior ou repetem a mesma leitura em acordes
consecutivos.

## Efeito na UI

A aba `Improviso` agora mostra, quando existirem, `Leituras regionais` antes da
tabela acorde-a-acorde.

Isso permite enxergar primeiro o mapa musical mais amplo:

- regioes tonicas sustentadas;
- regioes subdominantes longas;
- repeticoes de uma mesma leitura interna;
- areas em que uma mesma cor funcional atravessa mais de um acorde.

## Limite atual

O agrupamento ainda e conservador: ele usa a escala principal, a intencao e a
funcao harmonica local. Ainda nao faz uma analise sofisticada de fraseado,
motivo melodico ou densidade ritmica.

O proximo passo natural e decidir quando uma leitura regional deve se sobrepor
a leituras locais de acorde, especialmente em rearmonizacoes com dominantes,
subV e movimentos cromaticos.
