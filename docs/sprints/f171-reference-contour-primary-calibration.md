# F171 - Calibracao do contorno de referencia como proposta primaria

## Objetivo

Refinar a escolha da proposta primaria quando a partitura de referencia traz uma rota harmonica confiavel, especialmente em casos com pedal de baixo e mistura modal controlada.

## Caso-guia

`docs/musics/a child is born.musicxml` expunha uma referencia clara:

- centro local em `Bb major`;
- alternancia estrutural `Bb -> Ebm/Bb`;
- baixo pedal preservado ate a chegada `Am7b5 -> D7(#9)`;
- concordancia funcional e de raiz possivel em toda a janela.

Antes desta calibracao, a proposta primaria era `Estrategia — Tonal Classico`, que reduzia a ideia a poucos acordes e perdia o pedal da referencia.

## Ajustes

- O ranking passou a premiar com mais forca `Rearmonizacao — contorno da partitura` quando a proposta preserva 100% das funcoes e raizes da referencia.
- A apresentacao ja permitia esse tipo de proposta como primaria em modo equilibrado; o gargalo estava no score do ranking.
- A simplificacao de cifras do contorno passou a preservar cores estruturalmente perigosas, como `m7b5`, diminutos e dominantes alteradas.
- O teste de regressao garante que `Am7b5` nao vire `Am` e que `D7(#9)` nao vire apenas `D7`.

## Resultado no catalogo real

Em `a child is born.musicxml`, a primaria passou a ser:

```text
Rearmonizacao — contorno da partitura
1:Bb6 | 2:Ebm7/Bb | 3:Bb6 | 4:Ebm7/Bb | 5:Bb6 | 6:Ebm7/B | 7:Am7b5 | 8:D7(#9)
```

O baixo da referencia passou de `2/4` para `8/8` na janela auditada.

## Estado apos a F171

A triagem de baixo da referencia ficou inicialmente reduzida a um unico caso:

```text
Ain't it the truth.musicxml: baixo pouco preservado; 1/4; proposta Estrategia — Tonal Classico
```

Depois da correcao da armadura de clave da partitura para `Db`, o caso confirmou a hipotese: a melodia sozinha preferia o relativo `Bb minor`, mas armadura + referencia apontavam para `Db major`.

O ajuste complementar foi aceitar uma referencia fraca quando ela confirma um candidato tonal forte ja presente na analise melodica. Com isso, `Ain't it the truth.musicxml` passou para:

```text
Rearmonizacao — contorno da partitura
Referencia alinhada; funcao 6/6; raiz 6/6; baixo 8/8
```

A triagem do F39 passou a nomear esses casos como ambiguidade relativa resolvida, em vez de erro de centro:

```text
hipotese: relativo maior/menor resolvido pela referencia
Leitura da divergencia: a harmonia escrita resolve a ambiguidade relativo maior/menor
```

A triagem de baixo da referencia ficou zerada no relatorio F39.

## Proximo passo sugerido

Seguir para a proxima fila de refinamento musical, agora que os problemas de baixo contra referencia parecem estar resolvidos no corpus principal.
