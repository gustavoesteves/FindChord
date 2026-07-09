# F75 - Calibragem de vamp dominante

## Objetivo

Resolver o caso `f-033-Freight trane.musicxml`, que estava sendo tratado como C maior diatonico comum. A referencia da partitura mostra outro idioma: um vamp dominante/sus em C, com resposta em bVII (`Bb13`), mais proximo de blues/modal dominante do que de harmonia funcional I-IV-V.

## Mudancas

- O classificador de idioma passou a reconhecer dominantes sus recorrentes e bVII7 como sinais de vamp dominante.
- O harmonizador ganhou a estrategia `Vamp dominante`, com `I13`, `I13sus4` e `bVII13`.
- A estrategia fica bloqueada em frases com direcao cadencial clara de meia cadencia ou cadencia deceptiva, para evitar casos como `Blue in green`.
- O ranking ganhou bonus quando proposta e referencia compartilham um idioma nao funcional confirmado.
- O planejador de apresentacao deixa de marcar como aventureira uma proposta blues/modal quando a referencia confirma esse mesmo idioma.
- O comparador de referencia passou a considerar forte coincidencia de raiz como alinhamento valido em idiomas nao funcionais.

## Caso calibrado

`f-033-Freight trane.musicxml`

Antes:

- `C6/9 / C6/9 / Fmaj7 / C6/9/E / Bm7b5/F / C6/9/E / F6 / C`

Depois:

- `C13 / C13 / Bb13 / C13 / Bb13 / C13sus4 / C13 / Bb13sus4 / Bb13 / C13sus4 / C13`

## Guarda-corpo

`b-032-Blue in green.musicxml` continua protegido contra a leitura de vamp dominante. A meia-cadencia para F preserva a resposta basica em Bb, sem promover `Bb13/Ab13` como primeira alternativa.

## Resultado no lote F72

- Base aprovada: 6
- Revisao musical: 0
- Trabalho de motor: 0

## Proxima atencao

O proximo bloco pode continuar em casos reais do F71, agora separando melhor tres reguas:

- harmonia funcional diatonica;
- idiomas estaveis nao funcionais, como modal e blues;
- rearmonizacao cromatica, que deve continuar como camada posterior.
