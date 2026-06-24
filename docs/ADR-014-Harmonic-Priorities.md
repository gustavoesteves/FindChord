# ADR-014: Harmonic Priorities vs Gêneros Musicais

**Data:** 23 de Junho de 2026
**Status:** Aceito
**Contexto:** Refatoração F13.7.1

## Decisão
Em vez de modelar preferências estéticas usando rótulos culturais de mercado (ex: `JAZZ`, `POP`, `GOSPEL`), o sistema utilizará um objeto puramente paramétrico chamado `HarmonicPriorities`.

## Consequências
- A engine não sabe o que é "Jazz" ou "Pop". Ela aceita exclusivamente vetores matemáticos (`preserveMelody`, `rewardTension`, `rewardGravity`).
- Isso preserva a pureza da arquitetura ontológica estabelecida na F13, já que o validador lida com tensão e resolução, não com gêneros históricos.
- Presets culturais só existirão, se necessário, na camada visual da UI, traduzindo botões visuais para um objeto `HarmonicPriorities` silencioso que alimenta a API interna.
- O `overallPerspectiveScore` deixa de perguntar "Qual a melhor perspectiva?" e passa a responder "Qual perspectiva é mais alinhada com as prioridades informadas?".
