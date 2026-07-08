# F44 — Novo lote de repertorio real

## Objetivo

A F44 incorpora mais sete MusicXML ao corpus real:

- `affirmation.musicxml`
- `african flower.musicxml`
- `afro blue.musicxml`
- `afron-centric.musicxml`
- `after you've gone.musicxml`
- `after you.musicxml`
- `afternoon in Paris.musicxml`

O objetivo e ampliar a auditoria com mais standards, jazz modal/funk e repertorio com harmonia de referencia rica.

## Impacto no corpus

O corpus passou de 11 para 18 arquivos MusicXML.

O relatorio real passou a mostrar:

- 18 arquivos auditados;
- 17 arquivos harmonizados;
- 1 arquivo apenas com referencia harmonica;
- 0 arquivos sem proposta na janela auditada.

## Impacto no vocabulário de cifras

O vocabulário unico de cifras reais passou de 88 para 135 simbolos.

Diferente da expansao anterior, este lote nao exigiu novas regras no resolvedor de cifras: os simbolos foram resolvidos pelo contrato atual.

## Leituras novas no relatorio

As novas musicas aumentaram a quantidade de casos com:

- cadencia de referencia nao acompanhada;
- centro divergente;
- idioma de referencia relevante;
- funcao preservada com outra raiz;
- divergencia ampla de raiz na janela comparavel.

Exemplos iniciais:

- `affirmation.musicxml`: divergencia com cadencia de referencia nao acompanhada;
- `african flower.musicxml`: funcao alinhada, mas com raizes diferentes;
- `afro blue.musicxml`: idioma de referencia relevante;
- `after you've gone.musicxml`: centro divergente e cadencia de referencia nao acompanhada;
- `after you.musicxml`: comparacao parcial, com funcao preservada apesar de raizes diferentes;
- `afternoon in Paris.musicxml`: cadencia de referencia nao acompanhada.

## Leitura musical

O corpus esta mostrando que a comparacao com referencia ja funciona como instrumento de escuta, mas tambem que o proximo gargalo e a inferencia de centro da referencia.

Em repertorio jazz, o primeiro acorde raramente deve ser tratado como centro. Ele pode ser:

- ii de uma cadencia local;
- dominante secundaria;
- turnaround;
- acorde de aproximacao;
- inicio anacrústico da forma;
- cor modal sem funcao tonal direta.

## Proximo passo

A F45 deve melhorar a inferencia de centro da referencia.

Essa inferencia deve considerar:

- armadura da partitura;
- cadencias ii-V-I e iiø-V-i;
- acordes de repouso recorrentes;
- duracao e posicao formal dos acordes;
- evitar usar o primeiro acorde como centro quando ele participa de uma cadencia clara.

Essa melhoria deve reduzir falsos alertas de `centro divergente` e tornar a comparacao com referencia mais justa para standards.
