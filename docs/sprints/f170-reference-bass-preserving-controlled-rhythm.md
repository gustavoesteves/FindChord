# F170 - Preservacao de baixo em ritmo harmonico da referencia

## Objetivo

Refinar o primeiro caso acionavel da fila F169:

```text
Actual proof.musicxml
```

Ele estava alinhado com a referencia por funcao/raiz, mas a proposta `Rearmonização — ritmo harmônico da partitura` alterava o baixo em dois pontos.

## Diagnostico

A mudanca de baixo vinha de dois mecanismos:

- substituicao funcional com ganho melodico pequeno;
- sugestao automatica de inversao para suavizar conducao.

Em proposta estrutural da referencia, esse comportamento era arriscado: o baixo escrito pode ser parte da ideia autoral.

## Mudancas

1. Propostas estruturais da referencia nao recebem inversoes automaticas de baixo:

```text
controlled-reference-rhythm
controlled-reference-contour
```

2. A substituicao funcional no ritmo da referencia ficou mais conservadora:

```text
so troca se o ganho melodico for claro
```

3. A explicacao da proposta distingue substituicao real de simples normalizacao:

```text
normaliza a cifragem mantendo a harmonia escrita
```

## Resultado F39

`Actual proof.musicxml` passou de:

```text
Preservacao do baixo: 5/7
```

para:

```text
Preservacao do baixo: 7/7
```

E a proposta ficou:

```text
Referencia na janela: 7:Gb/Bb | 9:A13sus4 | 11:Ebm7b5 | 12:B7sus4, C#7sus4/Bb, Dm7, Em7
Cifras: 7:Gb/Bb | 9:A13sus4 | 11:Ebm7b5 | 12:B7sus4, C#7sus4/Bb, Dm7, Em7
```

## Leitura musical

Quando a referencia destrava a harmonizacao, preservar o baixo escrito deve ter prioridade sobre suavizar automaticamente a conducao.

Esse ajuste torna a proposta controlada menos invasiva: ela continua podendo normalizar cifra e validar a rota, mas nao reescreve baixo autoral sem necessidade clara.
