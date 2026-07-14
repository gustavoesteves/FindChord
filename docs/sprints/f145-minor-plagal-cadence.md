# F145 - Cadencia plagal menor

## Objetivo

Dar um passo alem de "temos vocabulario cromatico" e comecar a qualificar quando uma cor e musicalmente justificada.

O alvo foi a familia do exemplo `l` do Almada: mistura modal, inversoes e cadencia plagal menor.

## Problema

O sistema ja reconhecia emprestimos modais como `bVI` e `bVII`, e tambem conseguia trocar `IV` por `iv` quando a melodia trazia a nota caracteristica `b6`.

Isso era correto, mas estreito demais. Uma cadencia plagal menor pode ser justificada por conducao interna:

`iv -> I` com `b6 -> 5`

Nesse caso, a melodia nao precisa necessariamente cantar o `b6`; a cor pode estar em uma voz interna do arranjo.

## Alteracao

`ModalBorrowingAnalysis` agora reconhece `iv menor` como cor do modo paralelo menor:

- `Fm`
- `Fm7`
- `Fm6`
- `Fm6/9`
- `Fm9`
- `Fm11`

Em C maior, essa familia e analisada como:

`BORROWED_MINOR_IV`, funcao predominante aparente, emprestada do paralelo menor.

## Geracao

`StrategyGuidedHarmonizer` ganhou a proposta:

`Estratégia — Cadência plagal menor`

A proposta insere `iv -> I` no fim da frase quando:

- o centro esta em modo maior;
- a frase tem ao menos quatro compassos;
- ha uma chegada clara em tonica no ultimo compasso;
- a melodia do ultimo compasso e sustentada pelo acorde de tonica;
- a cobertura melodica geral permanece suficiente.

## Resultado no Almada

`docs/reports/f79-almada-example-comparison.md` foi atualizado:

- Propostas geradas: 16
- Exemplos cobertos: 4
- Familias parcialmente contempladas: 8
- Lacunas praticas de vocabulario: 0

O exemplo `l` agora aponta para `Estratégia — Cadência plagal menor` como melhor proposta parcial:

`C -> Am -> F -> F/C -> Bm7b5 -> G7 -> Fm -> C`

Isso nao tenta copiar toda a densidade cromatica do Almada. O ganho e mais importante: o motor passa a reconhecer a cadencia plagal menor como familia propria e justificada por conducao de vozes.

## Proximo refinamento

O bloco seguinte deve atacar mediantes e mistura modal densa com criterios graduais:

- quando `bIII`, `bVI` e `bVII` sao regioes momentaneas, e nao apenas cores;
- quando uma cadeia cromatica deve ficar como alternativa exploratoria;
- quando a referencia do autor autoriza maior densidade harmonica;
- como explicar essas decisoes sem expor linguagem interna do motor.
