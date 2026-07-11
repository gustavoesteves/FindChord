# F126 - Fundacao Ligon para notas-guia no improviso

## Fonte

`docs/theory/bert ligon - connecting chords with linear harmony.pdf`

O OCR atual ja permite leitura dirigida do livro. A introducao diferencia
improvisacao por especificidade harmonica, generalizacao harmonica e
ambiguidade deliberada. Para o nosso motor, a ideia mais importante neste
momento e que a improvisacao deve conseguir revelar a harmonia mesmo sem a
secao ritmica.

## Problema

A F125 ja mostrava um foco pratico para cada escala contextual, mas ainda
falava em escala de forma ampla. Faltava um primeiro vinculo com linha melodica:
quais notas do acorde sustentam a clareza harmonica?

## Decisao

Cada `ContextualScaleCandidate` passa a carregar:

- `guideTones`: terceira e setima estimadas do acorde;
- `guideToneTargets`: alvos proximos no acorde de resolucao, quando houver.

O `practiceHint` passa a mencionar essas notas quando elas ajudam a construir a
direcao da linha.

## Exemplo

Em `G7 -> C`:

- notas-guia: `B` e `F`;
- alvo estimado: `C`;
- foco pratico: apoiar `B` e `F`, explorar tensoes com direcao e conduzir para
  `C`.

## Limite atual

Ainda nao geramos linhas melodicas. Esta sprint apenas prepara a informacao que
uma proxima camada podera usar para:

- sugerir resolucoes de terças e setimas;
- desenhar aproximacoes cromaticas;
- diferenciar generalizacao regional de especificidade harmonica local.
