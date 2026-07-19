# F178 - Material melodico para SubV lidio dominante

## Objetivo

Adicionar materiais melodicos para `SubV7`, sem tratar toda escala `lydian dominant` como substituicao de tritono.

## Mudanca

Escalas contextuais `lydian dominant` agora recebem o material:

```text
SubV lídio dominante
```

somente quando a raiz do acorde esta um semitom acima do alvo de resolucao.

Exemplo:

```text
Db7 -> Cmaj7
```

gera:

```text
Db-G-Cb
Db->C
F->E
Cb->C
```

## Leitura teorica

O material combina:

- `#11` como cor caracteristica do lidio dominante;
- raiz do SubV resolvendo cromaticamente para o alvo;
- terceira do SubV resolvendo para a terceira do alvo;
- setima do SubV resolvendo para a tonica do alvo.

A grafia `Cb->C` e preservada porque comunica a setima de `Db7`, mesmo que enarmonicamente seja `B->C`.

## Controle

`G7 -> Cmaj7` pode oferecer `lydian dominant` como cor, mas nao recebe o material `SubV lídio dominante`, pois nao ha resolucao cromatica por semitom na raiz.

## Validacao

- `npm run test:curated -- scripts/contextual-scale-candidates.spec.ts`
