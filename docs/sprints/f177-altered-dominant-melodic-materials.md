# F177 - Materiais melodicos para dominante alterado

## Objetivo

Expandir `melodicMaterials` para dominantes alterados, indo alem da indicação de escala `altered`.

## Mudanca

Escalas contextuais do tipo `altered` agora recebem:

```text
Células da escala alterada
```

Para `A7alt -> Dmaj7`, as celulas sao:

```text
Bb-C-C#
D#-F-G
C#->D
G->F#
```

Para `A7alt -> Dm7`, a resolucao da setima muda:

```text
G->F
```

Isso evita uma leitura generica demais: o material olha para o acorde-alvo quando ele existe.

## Leitura teorica

O material vem da familia Levine/Berklee de acorde-escala e tensoes alteradas, mas e apresentado como celula praticavel:

- `b9-#9-3`;
- `#11-b13-b7`;
- terceira do dominante resolvendo na tonica do alvo;
- setima do dominante resolvendo na terca do alvo.

## UI

A exibicao usa o mesmo campo `Materiais` dentro de `Ver leitura`, sem adicionar peso na tela principal.

## Validacao

- `npm run test:curated -- scripts/contextual-scale-candidates.spec.ts`
