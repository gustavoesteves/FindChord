# F160 - Auditoria do corpus real principal

## Objetivo

Rodar o Harmonizar no conjunto principal de musicas reais em `docs/musics` depois dos refinamentos de contexto, referencia e curadoria.

## Escopo

A F39 audita apenas arquivos `.musicxml` no nivel raiz de `docs/musics`.

```text
18 arquivos principais
```

As subpastas importadas entram nas auditorias amplas:

```text
F108/F109 - 199 partituras
```

## Resultado F39

```text
Arquivos auditados: 18
Arquivos harmonizados: 18
Arquivos apenas com referencia harmonica: 0
Arquivos sem proposta na janela auditada: 0
Obras com cores funcionais: 11
Cores funcionais geradas: 23
Referencia muda centro: 10
Referencia destrava harmonizacao: 1
Triagem revisar centro inferido: 0
Triagem vocabulario melodia-only: 0
```

## Leitura musical

O motor segue saudavel no corpus principal: todas as obras tiveram proposta harmonica na janela auditada.

O ponto mais importante e que a harmonia autoral esta funcionando como contexto, nao como gabarito. Em 10 obras ela desloca o centro percebido para uma leitura local, e em `Actual proof.musicxml` ela destrava uma harmonizacao que a melodia sozinha nao gerou.

Isso confirma o contrato recente:

```text
melodia soberana + harmonia autoral como evidencia comparativa
```

## Proximo foco sugerido

A proxima investigacao musical deve olhar os casos em que a referencia muda centro, mas a comparacao com a propria referencia segue divergente. Esses casos parecem menos erro de centro e mais diferenca entre:

- preservar centro local;
- preservar a cifra/rota autoral;
- propor uma harmonizacao melodicamente suficiente.
