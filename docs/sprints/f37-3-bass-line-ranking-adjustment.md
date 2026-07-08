# F37.3 — Ajuste Fino de Ranking por Linha de Baixo

## Objetivo

Usar o perfil da linha de baixo como ajuste fino no ranking das propostas.

F37.2 classificou a linha de baixo. F37.3 transforma essa classificacao em um pequeno bonus ou penalidade dentro do ranking combinado.

## Decisao teorica

A linha de baixo ajuda a escolher entre propostas proximas.

Ela nao deve superar:

- funcao harmonica;
- cobertura melodica;
- conducao de vozes geral;
- coerencia da rota harmonica.

Por isso, o peso do baixo e deliberadamente pequeno. Ele desempata e refina, mas nao troca a hierarquia musical principal.

## Comportamento implementado

Cada proposta passa a carregar:

```text
bassLineRankBonus
```

Pesos iniciais:

```text
stepwise    -> bonus leve
chromatic   -> bonus leve
functional  -> bonus minimo
pedal       -> bonus minimo
mixed       -> neutro
leaping     -> penalidade leve
```

O score combinado agora considera:

```text
conducao_de_vozes - custo_de_rota * peso_pequeno + bonus_de_baixo
```

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/BassLineProfile.ts
src/utils/music/analysis/strategies/VoiceLeadingProposalRanker.ts
src/utils/music/analysis/models/ReharmonizationProposal.ts
```

Mudancas:

- `ReharmonizationProposal` ganhou `bassLineRankBonus`;
- `BassLineProfile` calcula bonus por perfil;
- `VoiceLeadingProposalRanker` soma esse bonus ao score combinado;
- testes garantem que o baixo desempata casos proximos, mas nao supera conducao claramente melhor.

## Testes

Coberto por:

```text
scripts/voice-leading-ranking.spec.ts
scripts/harmonic-route-distance.spec.ts
```

## Fora do escopo

- Ajustar pesos por estilo.
- Usar baixo para validar/rejeitar propostas.
- Criar baixo independente.
- Gerar voicings completos.

## Proxima fatia

F38 pode consolidar o ciclo F35-F37 com limpeza, auditoria em musicas reais e commit. A etapa ja esta grande o bastante para estabilizar antes de abrir outro eixo teorico.
