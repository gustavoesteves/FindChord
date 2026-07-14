# F147 - Curadoria de cromatismo dirigido

## Objetivo

Depois de adicionar vocabulario cromatico suficiente para cobrir melhor o exemplo do Almada, o problema deixou de ser "temos esse acorde?" e passou a ser "como apresentar essa rota sem confundir fundamento com exploracao?".

Esta sprint ajusta ranking e apresentacao para diferenciar:

- cromatismo dirigido, com percurso musical claro;
- cromatismo coloristico ou distante, que deve ficar mais atras;
- chegada deceptiva, que pode ser util, mas nao deve substituir a resposta principal da frase.

## Alteracao no ranking

`VoiceLeadingProposalRanker` ganhou `directedChromaticRankBonus`.

O bonus e pequeno e so vale para propostas controladas com rota cromatica dirigida:

- `Estratégia — Mistura modal densa`;
- `Estratégia — Cadência plagal menor`;
- `Estratégia — Chegada deceptiva cromática`.

Isso nao transforma cromatismo em fundamento. Ele apenas evita que uma rota com direcao clara seja tratada igual a uma cor cromatica generica.

## Alteracao na apresentacao

`ProposalPresentationPlanner` agora evita promover como principal, em modo equilibrado, uma proposta cujo alvo cadencial nao coincide com a tonica da frase.

Assim, uma chegada deceptiva como `... -> Am7` em C maior continua aparecendo como alternativa musicalmente interessante, mas nao ocupa o lugar da harmonizacao principal centrada em C.

## Resultado no Almada

`docs/reports/f79-almada-example-comparison.md` continua com:

- Propostas geradas: 17
- Exemplos cobertos: 5
- Familias parcialmente contempladas: 7
- Lacunas praticas de vocabulario: 0

A ordem ficou mais coerente:

- `Estratégia — Tonal Clássico` permanece como leitura principal;
- `Estratégia — Mistura modal densa` aparece como alternativa forte;
- `Estratégia — Chegada deceptiva cromática` permanece alternativa;
- `Estratégia — SubV funcional` segue como exploracao mais distante.

## Proximo refinamento

O proximo bloco pode olhar para o exemplo `k`, que ainda e parcial: cromatismo denso com diminutos, SubV e regioes momentaneas. O desafio nao e apenas gerar mais acordes, mas saber quando uma cadeia cromatica e legivel para compositor/arranjador.
