# F169 - Auditoria de preservacao do baixo da referencia

## Objetivo

Depois de colocar a cifra da referencia lado a lado com a proposta, o proximo passo foi medir a espinha do baixo.

Preservar funcao e raiz pode ser suficiente harmonicamente, mas para compositor/arranjador o baixo muitas vezes e parte estrutural da ideia. Uma proposta pode estar alinhada por funcao/raiz e ainda alterar demais a conducao do baixo.

## Mudanca

A F39 agora mostra:

```text
Baixo da referencia
Baixo
Preservacao do baixo
```

Exemplo:

```text
Baixo da referencia: Bb -> A -> Eb -> B -> Bb -> D -> E
Baixo: Bb -> A -> Eb -> B -> Bb -> A -> C
Preservacao do baixo: 5/7
```

Tambem foi adicionada a secao:

```text
Triagem de baixo da referencia
```

## Resultado atual

```text
Baixo da referencia preservado parcialmente: 2
Baixo da referencia pouco preservado: 2
```

Fila atual:

```text
Ain't it the truth.musicxml -> baixo pouco preservado; 1/4
a fine romance.musicxml -> baixo pouco preservado; 2/7
a child is born.musicxml -> baixo parcialmente preservado; 2/4
Actual proof.musicxml -> baixo parcialmente preservado; 5/7
```

## Leitura musical

Essa fila nao significa automaticamente erro.

Ela indica onde a proposta primaria talvez esteja:

- simplificando inversoes demais;
- trocando baixo estrutural por raiz;
- criando uma linha de baixo mais suave, mas menos fiel;
- preservando rota harmonica sem preservar arranjo;
- revelando uma referencia estranha que precisa de escuta.

## Proximo caminho

O caso mais promissor para refinamento tecnico parece ser `Actual proof.musicxml`, porque:

- a referencia destrava a harmonizacao;
- a proposta usa ritmo harmonico da partitura;
- funcao/raiz estao alinhadas;
- mas o baixo muda em pontos localmente importantes.

Os outros casos podem precisar de escuta antes de virar regra, especialmente `a fine romance.musicxml`.
