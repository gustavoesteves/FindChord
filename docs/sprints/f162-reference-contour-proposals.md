# F162 - Propostas por contorno da partitura

## Objetivo

Refinar os casos da F161 em que a harmonia autoral mudava o centro, mas a proposta primaria ainda divergia da referencia.

O problema identificado foi que a estrategia `Centro de referencia` recebia o centro local, mas nao recebia a rota harmonica da partitura. Assim, ela podia acertar `Eb minor`, `C minor` ou `Bb major`, mas ainda propor um campo funcional generico demais.

## Mudanca

Foi adicionada a proposta controlada:

```text
Rearmonização — contorno da partitura
```

Ela preserva:

- a rota harmonica indicada pela partitura;
- as raizes de referencia;
- o ritmo harmonico da janela;
- a validacao melodica da proposta.

E simplifica:

- extensoes locais;
- cores nao essenciais;
- cifras muito especificas quando a melodia permite.

## Resultado F39

Antes deste ajuste, a triagem de centros alterados estava em:

```text
alinhados: 4
parciais: 2
divergentes: 4
```

Depois do contorno de referencia:

```text
alinhados: 8
parciais: 1
divergentes: 1
```

Casos que melhoraram diretamente:

```text
african flower.musicxml -> alinhada; função 4/4; raiz 4/4
afron-centric.musicxml -> alinhada; função 2/2; raiz 2/2
after you've gone.musicxml -> alinhada; função 8/8; raiz 8/8
```

Tambem passaram a usar o contorno como leitura primaria em alguns casos ja saudaveis, como `Bright Size Life.musicxml` e `afternoon in Paris.musicxml`.

## Limpeza de produto

O contorno da partitura nao deve ser tratado como "cor funcional". Ele e uma leitura estrutural da obra.

Por isso, a UI e a auditoria deixam de classificar propostas `reference-rhythm` e `reference-contour` como cores funcionais apenas por terem bonus de referencia.

## Pendencia

O caso restante e:

```text
after you.musicxml
```

A partitura tem muitos eventos de cifra dentro do mesmo compasso, com baixos e slash chords importantes. A proposta de contorno existe como alternativa, mas ainda nao vence a leitura tonal classica.

Esse parece ser o proximo refinamento: melhorar a comparacao e o ranking para progressões densas com multiplas cifras por compasso, baixo estrutural e acordes sobre pedal/suspensao.
