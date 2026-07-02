# F34.4 — Diagnosticos de Omissao Harmonica

## Objetivo

Explicar por que certas leituras nao foram apresentadas como resposta principal.

O sistema nao deve apenas mostrar o que gerou. Ele tambem deve revelar, com parcimonia, quando uma rota foi evitada por falta de evidencia musical.

## Decisao teorica

Na fronteira menor funcional/modal, a omissao tambem tem valor musical.

Exemplos:

```text
Menor funcional omitido: a melodia não traz sensível nem sexta maior para sustentar cadência dominante.
Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
Cadência dominante evitada: a referência favorece centro modal claro.
Centro modal subordinado: a referência confirma menor funcional por cadência.
```

Essas frases nao acusam erro. Elas explicam a hierarquia de leitura.

## Comportamento implementado

### Diagnostico por melodia

Quando a melodia em menor tem vocabulario modal, mas nao traz sensivel nem sexta maior, o motor informa que menor funcional foi omitido.

Quando a melodia traz sensivel ou sexta maior, o motor informa que centro modal foi omitido.

### Diagnostico por referencia

Quando a harmonia da partitura sugere centro modal claro, a UI informa que cadencia dominante foi evitada.

Quando a harmonia da partitura confirma menor funcional, a UI informa que centro modal ficou subordinado.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/engines/GravityFieldManager.ts
src/domains/harmonizer/hooks/useHarmonizerProposals.ts
src/domains/harmonizer/components/HarmonizerProposalList.tsx
src/domains/harmonizer/HarmonizerScreen.tsx
```

Mudancas:

- `GravityProposalGenerationResult` agora retorna `omittedStrategyDiagnostics`;
- o hook soma diagnosticos de melodia com diagnosticos vindos da harmonia de referencia;
- a lista de propostas exibe um bloco `Leituras omitidas`;
- o contador de exploracoes rejeitadas continua separado.

## Testes

Coberto por:

```text
scripts/minor-modal-boundary.spec.ts
scripts/proposal-presentation-planner.spec.ts
```

## Fora do escopo

- Criar diagnosticos para todas as estrategias do sistema.
- Explicar cada acorde omitido individualmente.
- Bloquear modo exploratorio por causa dos diagnosticos.

## Proxima fatia

F34.5 ampliou diagnosticos para outros idiomas e estrategias:

1. blues funcional omitido por cor blues parcial;
2. ii-V local omitido quando a frase nao sustenta alvo local;
3. SubV7 omitido quando a substituicao cromatica nao cobre a melodia.

Ver:

```text
docs/f34-5-expanded-omitted-strategy-diagnostics.md
```
