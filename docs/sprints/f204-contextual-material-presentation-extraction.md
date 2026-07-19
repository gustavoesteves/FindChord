# F204 — Extração da apresentação contextual

## Objetivo

Separar a camada textual dos candidatos contextuais de material.

## Mudança

- Criado `src/utils/music/theory/contextualMaterialPresentation.ts`.
- O novo módulo concentra:
  - `describeMaterialCandidate`;
  - `practiceHintForMaterialCandidate`.
- `contextualScaleCandidates.ts` passou a usar essas funções externas.
- Criada `scripts/contextual-material-presentation.spec.ts`.
- A spec nova foi incluída em `vitest.curated.config.ts`.

## Critério

Descrição e dica prática são apresentação, não ranking nem geração.

Essa separação permite:

- mudar texto de UI sem alterar score;
- esconder/mostrar explicações de forma mais controlada;
- adaptar linguagem para `Escrever` e `Harmonizar` separadamente.

## Próximo passo

Extrair o orquestrador final de candidatos contextuais ou começar a usar os módulos separados diretamente no `Escrever`.
