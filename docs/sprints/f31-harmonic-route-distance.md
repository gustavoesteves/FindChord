# F31 — Distância e Rotas Harmônicas

## Objetivo

Criar uma métrica explícita de custo para comparar rotas harmônicas.

Até aqui, o sistema já conseguia validar função, aceitar cromatismos resolvidos, ranquear propostas por condução de vozes e separar substituições por idioma.

A F31 começa a juntar esses sinais em uma pergunta mais geral:

> Qual caminho harmônico custa menos musicalmente?

## Ideia central

Uma rota não é apenas uma lista de acordes. Ela tem:

- direção funcional;
- distância cromática entre raízes;
- resolução ou não de tendências;
- suavidade de condução;
- evidência musical explicável.

A métrica de F31 transforma cada transição em custo. Custo menor significa rota mais natural dentro do idioma escolhido.

## Implementação inicial

Arquivo:

- `src/utils/music/analysis/strategies/HarmonicRouteDistance.ts`

Função principal:

```ts
evaluateHarmonicRouteDistance({
  chords,
  center,
  classificationMode
})
```

Retorna:

- custo total;
- número de transições;
- média de condução de vozes;
- penalidade funcional;
- penalidade cromática;
- penalidade por tendência não resolvida;
- passos individuais;
- evidências musicais.

## O que entra no custo

### 1. Função

Transições claras como:

```text
PD -> D -> T
```

tendem a custar menos que movimentos sem função direta ou retrocessos fortes.

### 2. Cromatismo

Cromatismo não é erro automático. Ele só encarece quando aparece como salto distante sem compensação por função ou condução.

### 3. Condução de vozes

A métrica reaproveita `VoiceLeadingTransitionEvaluator`.

Guide tones resolvidos, notas comuns e movimento conjunto reduzem custo. Tendências não resolvidas e saltos internos aumentam custo.

### 4. Idioma

A métrica aceita `classificationMode`.

Isso permite avaliar rotas em maior funcional ou menor funcional sem misturar os mapas.

Exemplo:

```text
Am -> Bm7(b5) -> E7b13 -> Am
```

em `minor-functional` é lido como:

```text
T -> PD -> D -> T
```

## O que a F31 ainda não faz

- Não substitui o ranking atual.
- Não gera rotas novas.
- Não escolhe automaticamente entre todas as alternativas.
- Não modela modal/blues em profundidade.

Esta fatia é uma régua. A próxima pode conectar essa régua ao ranqueamento de propostas.

## Testes

Coberto por:

- `scripts/harmonic-route-distance.spec.ts`

Os testes verificam:

- `ii-V-I` custa menos que rota cromática distante;
- SubV7 resolvido custa menos que dominante cromática não resolvida;
- menor funcional usa `T -> PD -> D -> T`;
- rota com um único acorde retorna custo neutro.

## Próxima fatia

F31.1 deve conectar `HarmonicRouteDistance` ao ranking das propostas:

1. anotar cada proposta com custo de rota;
2. preservar o score de condução;
3. ordenar por custo quando houver múltiplas propostas válidas;
4. explicar a escolha em linguagem musical.

Implementado em `docs/f31-1-route-aware-proposal-ranking.md` com uma decisão de calibração: custo de rota entra como refinamento combinado, não como substituto puro da condução de vozes.
