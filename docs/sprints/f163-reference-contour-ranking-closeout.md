# F163 - Fechamento da fila divergente de centros alterados

## Objetivo

Resolver o caso restante da F162:

```text
after you.musicxml
```

O contorno da partitura ja existia e estava alinhado com a referencia, mas ainda perdia para uma leitura tonal classica por causa da penalizacao de rota cromatica.

## Diagnostico

Em `after you.musicxml`, a proposta `Rearmonização — contorno da partitura` tinha:

```text
função 7/7
raiz 7/7
```

Mesmo assim, a leitura tonal classica vencia por ter rota mais barata e conducao abstratamente suave.

Musicalmente, isso era um erro de ranking: quando a rota cromatica vem da propria partitura e preserva raiz/funcao da referencia, ela nao deve ser tratada como afastamento sem lastro.

## Mudanca

O bonus de referencia para `controlled-reference-contour` ficou mais forte quando a proposta esta alinhada com a referencia.

Isso permite que o contorno estrutural da obra supere propostas genericamente diatonicas quando:

- a referencia esta presente;
- a comparacao confirma mesma funcao;
- a comparacao confirma mesma raiz;
- a rota cromatica vem da partitura.

## Resultado F39

Depois do ajuste:

```text
Centros alterados alinhados com a referencia: 9
Centros alterados parcialmente alinhados: 1
Centros alterados ainda divergentes: 0
```

`after you.musicxml` passou a escolher:

```text
Rearmonização — contorno da partitura
função 7/7
raiz 7/7
```

## Pendencia

A fila divergente foi fechada.

O proximo refinamento musical deve olhar o unico parcial:

```text
a fine romance.musicxml
```

Esse caso provavelmente nao e mais sobre promover o contorno, mas sobre entender melhor centro local, cadencia e/ou densidade harmonica dentro da janela.
