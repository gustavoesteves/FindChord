# F29.2 — Ranking de Condução para SubV7

## Objetivo

Comparar dominante original, SubV7 e ii-subV7 por condução de vozes.

A F29 e a F29.1 validam se o cromatismo é funcional. A F29.2 começa a responder outra pergunta:

```text
Entre alternativas válidas, qual conduz melhor?
```

## Tese

SubV7 não deve vencer automaticamente por ser mais sofisticado. Ele deve vencer quando a condução sustenta a escolha.

Em C, o sistema agora consegue comparar:

```text
G7 -> C
Db7 -> C
Abm7 -> Db7 -> C
```

O ranking pode preferir a dominante original sobre o SubV7 isolado se ela conduzir melhor. O ii-subV7 pode subir quando a preparação cromática cria uma linha mais convincente.

## Escopo Implementado

### 1. Resolução de SubV7 no avaliador

`VoiceLeadingTransitionEvaluator` agora reconhece:

- baixo do SubV7 resolvendo por semitom descendente;
- terça do SubV7 conduzindo cromaticamente para a terça do alvo;
- sétima do SubV7 conduzindo cromaticamente para a tônica.

Exemplo:

```text
Db7 -> C
```

### 2. Ranking entre cadências

`VoiceLeadingProposalRanker` consegue comparar propostas como:

```text
C -> F -> G7 -> C
C -> F -> Db7 -> C
C -> F -> Abm7 -> Db7 -> C
```

O ranking esperado na suíte atual é:

```text
ii-subV7
dominante original
SubV7 isolado
```

Isso não é uma regra universal. É o resultado da régua atual para o fixture testado.

### 3. Evidência priorizada

O resumo de condução agora prioriza evidências cromáticas/cadenciais antes de evidências genéricas como notas comuns.

Exemplo:

```text
Condução de vozes: baixo do SubV7 resolve por semitom descendente
```

## Fora de Escopo

- Decidir estilo automaticamente.
- Fazer enharmonia completa.
- Comparar voicings físicos de guitarra.
- Medir distância estética da harmonia original.

## Critérios de Aceitação

- `Db7 -> C` recebe evidência positiva de SubV7 resolvido.
- `G7 -> F#7` não é confundido com SubV7 cadencial em C.
- O ranking compara dominante original, SubV7 e ii-subV7.
- O card preserva evidência cromática relevante na explicação.
- A suíte curada continua passando.

## Próximo Passo

A próxima etapa natural é F30: tabela de substituições por função.

Com F29.2, já temos:

- função;
- região;
- fechamento cadencial;
- SubV7;
- ii-subV7;
- condução de vozes como ranking.

Agora faz sentido sistematizar substitutos de T, PD e D, separando maior, menor e função aparente.
