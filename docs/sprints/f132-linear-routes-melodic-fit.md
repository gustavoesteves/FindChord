# F132 - Apoio melodico nas rotas lineares

## Problema

A F131 criou `linearRoutes`, mas a rota ainda nao dizia se o material sugerido
dialogava com a melodia real do trecho.

Isso e importante porque uma rota teoricamente correta pode ser pouco util se
brigar com uma nota estrutural da frase.

## Decisao

Cada rota linear passa a expor:

- `melodyNotes`: notas da melodia consideradas naquela leitura;
- `melodyMatches`: notas da melodia que aparecem nos fragmentos;
- `melodicFit`: `aligned`, `neutral` ou `caution`.

Por enquanto o sistema nao remove rotas automaticamente. Ele marca a relacao
com a melodia para que a UI e os proximos refinamentos tenham uma base mais
honesta.

## Efeito musical

Em uma cadencia:

```text
G7 -> C
```

se a melodia traz `B`, a rota:

```text
B->C / F->E
```

aparece como apoiada pela melodia, porque uma das notas estruturais da frase ja
esta dentro do movimento sugerido.

## Efeito na UI

`Rotas lineares` passa a mostrar um selo de encaixe melodico:

- `Melodia apoia`;
- `Neutra`;
- `Revisar com a melodia`.

Quando houver contato direto, a UI tambem mostra as notas da melodia que apoiam
a rota.

## Proximo passo

O proximo refinamento pode usar `melodicFit` no ranking das leituras de
improvisacao, rebaixando rotas marcadas como `caution` e priorizando rotas
`aligned` em contextos cadenciais.
