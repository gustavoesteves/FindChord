# F165 - Triagem de mesmo centro com rota enriquecida pela referencia

## Objetivo

Depois de fechar a fila de centros alterados, revisar a categoria:

```text
mesmo centro, harmonizacao diferente
```

Essa categoria podia parecer problema, mas os casos atuais mostram outra coisa: a melodia sozinha e a referencia concordam no centro, mas a cifra autoral traz uma rota mais especifica.

## Mudanca

A F39 agora separa os casos de mesmo centro em:

```text
Mesmo centro, referencia enriquece rota
Mesmo centro, revisar rota da referencia
```

E adiciona a secao:

```text
Triagem de mesmo centro
```

## Resultado atual

```text
Mesmo centro, harmonizacao diferente: 4
Mesmo centro, referencia enriquece rota: 4
Mesmo centro, revisar rota da referencia: 0
```

Casos classificados como referencia enriquecendo rota:

```text
Air mail special.musicxml
affirmation.musicxml
afro blue.musicxml
autum leaves.musicxml
```

Todos estao alinhados com a referencia quando a harmonia autoral entra no caminho:

```text
Air mail special.musicxml -> função 7/7; raiz 7/7
affirmation.musicxml -> função 4/4; raiz 4/4
afro blue.musicxml -> função 8/8; raiz 8/8
autum leaves.musicxml -> função 3/3; raiz 3/3
```

## Decisao musical

Mesmo centro com harmonizacao diferente nao deve ser tratado automaticamente como problema.

Quando a referencia esta alinhada, a leitura correta e:

```text
a melodia define o centro;
a cifra autoral enriquece rota, ritmo harmonico, baixo ou densidade.
```

Isso fortalece o contrato do Harmonizar:

```text
melodia soberana para coerencia;
referencia autoral como evidencia de rota quando disponivel.
```

## Proximo caminho

O proximo bloco pode olhar as obras em que:

- a referencia destrava a harmonizacao;
- o contorno da partitura aparece como proposta primaria;
- ainda existem diagnosticos de apoio melodico descoberto apesar da comparacao com referencia estar alinhada.
