# F137 - Tipo de apoio melodico na leitura por acorde

## Problema

A F136 mostrou quais notas da melodia apoiam uma leitura, mas ainda nao dizia
por que essas notas eram relevantes.

`B` em `G7 -> C`, por exemplo, pode ser mais do que uma nota presente no
fragmento: ela e a terca do dominante, portanto uma nota-guia.

## Decisao

Cada `ContextualScaleCandidate` passa a expor `melodySupportRoles`, agrupando o
papel de cada nota de apoio:

- `guide-tone`;
- `resolution-target`;
- `passing-tone`;
- `linear-fragment`.

A UI traduz esses papeis como:

- `nota-guia`;
- `alvo`;
- `passagem`;
- `fragmento`.

## Efeito musical

Em `G7 -> C`, a leitura:

```text
B->C / F->E
```

pode mostrar:

```text
Apoio: B (nota-guia), C (alvo)
```

Na `bebop dominant`, se a melodia contem `F#`, a UI mostra:

```text
Apoio: F# (passagem)
```

Isso preserva a distincao essencial: `F#` explica uma passagem cromatica, nao
uma tensao sustentavel sobre o dominante.

## Proximo passo

Um proximo refinamento pode usar esses papeis para graduar o peso do apoio:
nota-guia e alvo cadencial podem valer mais do que um contato generico de
fragmento.
