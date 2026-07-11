# F130 - Fragmentos lineares para improvisacao

## Problema

A F129 separou notas de passagem de tensoes sustentaveis, mas a UI ainda
mostrava essa informacao como lista. Para estudo de improvisacao, a informacao
mais musical e uma pequena celula praticavel.

Exemplo em `G7`:

```text
F# = passagem cromatica
F-F#-G = fragmento linear
```

## Decisao

Cada candidata contextual passa a expor `linearFragments`.

Inicialmente o campo combina:

- resolucoes de notas-guia, como `B->C` e `F->E`;
- fragmentos idiomaticos de passagem, como `F-F#-G` na `bebop dominant`.

Isso ainda nao gera solo. O objetivo e mostrar material minimo de estudo ligado
ao acorde e ao alvo harmonico.

## Efeito na UI

O detalhe `Ver leitura` mostra `Fragmentos` junto de notas-guia, resolucoes,
tensoes, passagens e notas a evitar.

Assim, a leitura deixa de ser apenas "qual escala usar" e comeca a apontar
"como mover a linha" dentro daquela escolha.

## Proximo passo

Os fragmentos ainda sao atomicos. Um proximo refinamento pode agrupar fragmentos
por compasso ou por cadencia, criando pequenas rotas lineares sem transformar o
Harmonizar em um gerador automatico de solos.
