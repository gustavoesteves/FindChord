# F37 — Diagnosticos de Conducao de Vozes

## Objetivo

Transformar a regua de conducao de vozes em diagnostico local de proposta.

F28 ja ranqueava propostas por conducao. F37 consolida esse resultado dentro do mesmo contrato de diagnosticos usado nas camadas recentes.

## Decisao teorica

Conducao de vozes continua sendo criterio de ranking e explicacao.

Ela nao substitui:

- funcao harmonica;
- cobertura melodica;
- idioma harmonico;
- evidencia de referencia.

Depois que uma proposta e aceitavel, a conducao ajuda a decidir se ela se conecta bem.

## Comportamento implementado

Cada proposta ranqueada pode receber diagnostico local:

```text
Conducao de vozes favoravel
Conducao de vozes aspera
```

O diagnostico favoravel aparece quando a transicao preserva notas comuns ou resolve guide tones/tendencias importantes.

O diagnostico de atrito aparece quando ha tendencia sem resolucao clara ou saltos internos relevantes.

Esses diagnosticos entram como:

```text
source: generation
category: compatibility
```

porque descrevem a compatibilidade interna da progressao gerada.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/VoiceLeadingProposalRanker.ts
src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator.ts
src/utils/music/analysis/models/ReharmonizationProposal.ts
```

Mudancas:

- `evaluateProposalVoiceLeading` preserva os relatórios de transicao internamente;
- o ranker cria diagnostico favoravel quando score/evidencias sustentam boa conexao;
- o ranker cria diagnostico de atrito quando ha tendencia nao resolvida ou saltos internos;
- os diagnosticos entram no card da proposta via `proposal.diagnostics`.

## Testes

Coberto por:

```text
scripts/voice-leading-ranking.spec.ts
scripts/proposal-presentation-planner.spec.ts
```

## Fora do escopo

- Gerar voicings reais.
- Escolher inversoes automaticamente.
- Resolver cruzamento de vozes.
- Fazer conducao por instrumento.

## Seguimento implementado

F37.1 usou a mesma regua para sugerir inversoes simples no baixo, sem abrir geracao completa de voicings.

```text
docs/f37-1-bass-inversion-suggestions.md
```
