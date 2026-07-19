# F276 - Nota tocavel no fallback de material

## Objetivo

Evitar que a acao fallback de `Materiais do acorde` duplique oitavas ao montar notas para audio.

## Alteracoes

- Extraida `playableWriterMaterialNote`.
- Notas sem oitava recebem a oitava padrao.
- Notas que ja possuem oitava sao preservadas.

## Resultado

O fallback `Ouvir notas` fica mais robusto para fontes que eventualmente ja tragam alturas completas.
