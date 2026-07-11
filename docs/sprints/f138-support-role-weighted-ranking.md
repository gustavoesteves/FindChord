# F138 - Peso por tipo de apoio melodico

## Problema

A F137 classificou o apoio melodico, mas o ranking ainda tratava todo encaixe
`aligned` com o mesmo bonus.

Isso perdia uma diferenca musical importante: uma nota-guia ou alvo cadencial
costuma ser mais estrutural do que um contato generico de fragmento.

## Decisao

O ajuste melodico do ranking passa a considerar o papel da nota de apoio:

- `guide-tone`: apoio estrutural forte;
- `resolution-target`: apoio estrutural forte;
- `passing-tone`: apoio linear controlado;
- `linear-fragment`: apoio local mais leve.

O bonus continua limitado para nao sobrepor compatibilidade harmonica, funcao e
cobertura da melodia.

## Efeito musical

Em `G7 -> C`, uma leitura apoiada por:

```text
B (nota-guia), C (alvo)
```

recebe mais prioridade do que uma leitura apoiada apenas por:

```text
F# (passagem)
```

No entanto, a passagem cromatica continua sendo valorizada quando explica a
melodia, especialmente na `bebop dominant`.

## Proximo passo

O proximo refinamento pode expor esse peso de forma discreta no diagnostico da
leitura, sem transformar a UI em painel de numeros.
