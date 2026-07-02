# F34.3 — Papel Comparativo na Apresentacao

## Objetivo

Separar propostas que sao alternativas reais de propostas que aparecem como comparacao musical.

Na fronteira menor funcional/modal, uma progressao pode cobrir a melodia e ainda assim contrariar a leitura da referencia. Nesses casos, ela nao deve desaparecer, mas tambem nao deve ser apresentada como resposta equivalente.

## Decisao teorica

O Harmonizar passa a distinguir:

```text
Principal   -> resposta recomendada naquele contexto
Alternativa -> outra resposta musicalmente plausivel
Comparação  -> proposta util para comparar com a referencia, mas subordinada a uma evidencia contextual
Exploração  -> afastamento mais radical ou experimental
```

Isso preserva a curiosidade musical sem diluir a hierarquia.

## Comportamento implementado

### Referencia modal clara

Quando a referencia sugere centro modal sem sensivel cadencial, alternativas tonais aparecem como:

```text
Comparação
```

Explicacao:

```text
Comparação: a referência sugere centro modal sem sensível cadencial
```

### Referencia menor funcional

Quando a referencia confirma menor funcional por cadencia, uma proposta menor funcional pode ser `Principal`, e leituras concorrentes aparecem como:

```text
Comparação
```

Explicacao:

```text
Comparação: a referência confirma menor funcional por cadência
```

### Propostas radicais

Uma proposta radical continua como:

```text
Exploração
```

Mesmo quando ela recebe explicacao comparativa:

```text
Exploração mantida como comparação: a referência confirma menor funcional por cadência
```

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/models/ReharmonizationProposal.ts
src/utils/music/analysis/strategies/ProposalPresentationPlanner.ts
src/domains/harmonizer/components/HarmonizationProposalCard.tsx
```

Mudancas:

- `ReharmonizationPresentationRole` agora inclui `comparative`;
- a UI exibe `Comparação` como etiqueta propria;
- `ProposalPresentationPlanner` usa `comparative` quando ha evidencia de fronteira menor/modal;
- propostas radicais preservam o papel `adventurous`.

## Testes

Coberto por:

```text
scripts/proposal-presentation-planner.spec.ts
```

## Fora do escopo

- Esconder propostas comparativas.
- Criar uma secao visual separada para comparacoes.
- Listar todos os motivos de omissao de estrategias ainda nao geradas.

## Proxima fatia

F34.4 criou diagnosticos de omissao:

1. "menor funcional omitido por falta de sensivel";
2. "cadencia dominante evitada por centro modal claro";
3. "modo exploratorio reabilitou alternativa apesar da referencia".

Ver:

```text
docs/f34-4-omitted-strategy-diagnostics.md
```
