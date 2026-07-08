# F37.1 — Sugestoes Simples de Inversao no Baixo

## Objetivo

Usar a regua de conducao para sugerir inversoes simples no baixo.

F37 adicionou diagnosticos de conducao. F37.1 aplica uma primeira acao musical pequena: quando uma nota do proprio acorde melhora claramente a continuidade do baixo, o sistema pode transformar o acorde em slash chord.

## Decisao teorica

Inversao aqui nao e voicing completo.

Ela responde apenas:

```text
ha uma nota do acorde que cria uma linha de baixo mais suave?
```

O sistema nao escolhe distribuicao de vozes internas, abertura, registro ou instrumento. Ele apenas sugere baixo alternativo quando isso melhora a ligacao entre acordes.

## Comportamento implementado

A sugestao e conservadora:

- nao mexe no primeiro acorde;
- nao mexe no ultimo acorde;
- nao altera acordes que ja possuem baixo explicito;
- so usa nota pertencente ao proprio acorde;
- exige melhoria clara em relacao ao baixo anterior;
- evita tratar baixo parado como solucao automatica.

Exemplo:

```text
C -> G7 -> C
C -> G7/B -> C
```

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/BassInversionSuggester.ts
src/utils/music/analysis/strategies/VoiceLeadingProposalRanker.ts
```

Mudancas:

- criada camada `BassInversionSuggester`;
- o ranker aplica inversoes antes de avaliar conducao;
- a linha de baixo da proposta e atualizada;
- a proposta recebe diagnostico local de compatibilidade;
- a explicacao do card indica que uma inversao simples suavizou o baixo.

## Testes

Coberto por:

```text
scripts/voice-leading-ranking.spec.ts
scripts/harmonic-route-distance.spec.ts
```

## Fora do escopo

- Gerar voicings completos.
- Escolher inversoes por estilo instrumental.
- Criar baixo independente que nao pertence ao acorde.
- Rearmonizar acordes para forcar linhas cromaticas.

## Seguimento implementado

F37.2 avaliou a linha de baixo como perfil proprio: passo, salto, pedal, baixo cromatico e baixo funcional.

```text
docs/f37-2-bass-line-profile.md
```
