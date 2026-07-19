# F168 - Comparacao direta entre referencia e proposta na F39

## Objetivo

Facilitar a escuta critica das propostas controladas.

Depois da melhora de legibilidade das cifras, ainda faltava uma informacao importante no relatorio: ver lado a lado o que a partitura trazia na janela e o que a proposta primaria gerou.

## Mudanca

A F39 agora mostra:

```text
Referencia na janela
Cifras
```

Exemplo:

```text
Referencia na janela: 12:B7sus4, C#7sus4/Bb, Dm7, Em7
Cifras: 12:B7sus4, C#7sus4/Bb, Dm7/A, Cmaj7
```

## Decisao de leitura

A linha `Referencia na janela` usa a mesma normalizacao de cifra das propostas controladas:

```text
Asus4(7,9,11,13) -> A13sus4
```

E usa virgula para separar multiplas cifras no mesmo compasso, mantendo `/` apenas para slash chord ou baixo escrito.

## Valor musical

Agora fica mais facil avaliar se uma proposta controlada:

- preservou a rota da partitura;
- simplificou apenas cor;
- alterou baixo;
- substituiu uma cifra por leitura funcional equivalente;
- simplificou demais e deve ser revisada.

Isso melhora a auditoria sem mudar o motor de harmonizacao.

## Proximo caminho

A partir dessa comparacao, o proximo refinamento pode mirar casos em que:

- a proposta esta alinhada por funcao/raiz, mas altera baixo estrutural relevante;
- a simplificacao remove uma cor importante;
- o contorno da partitura deveria preservar mais a cifra original;
- o ritmo harmonico da partitura deveria ser preferido ao contorno simplificado.
