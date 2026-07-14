# F150 - Curadoria de cromatismos exploratórios

## Objetivo

Refinar a apresentação das propostas cromáticas densas no Harmonizar.

Depois da F141-F149, o motor já cobria famílias avançadas do exemplo do Almada. A lacuna deixou de ser vocabulário puro e passou a ser curadoria: quando uma rota cromática deve aparecer como alternativa forte, e quando deve ser tratada como exploração que exige escuta.

## Mudança

- `ProposalPresentationPlanner` passou a considerar como `adventurous`:
  - rotas cromáticas com `chromaticLegibilityPenalty >= 1`;
  - `Estratégia — Chegada deceptiva cromática` quando o alvo cadencial não coincide com o centro provável da frase.
- O diagnóstico de apresentação separa:
  - afastamento harmônico amplo;
  - cromatismo mantido como exploração para escuta cuidadosa.
- A geração não foi reduzida. O vocabulário continua disponível, mas a UI deixa mais claro o papel musical da proposta.

## Evidência

No exemplo do Almada, a `Chegada deceptiva cromática` continua cobrindo o exemplo `m`, mas agora aparece como `adventurous` em vez de simples alternativa.

Isso é desejável: a solução é musicalmente válida, mas desloca o ponto de chegada para `Am7`; portanto deve ser lida como rearmonização exploratória, não como resposta central da frase em `C`.

## Validação

- `npx vitest run scripts/proposal-presentation-planner.spec.ts --config vitest.curated.config.ts`
- `npm run import:audit-almada-example`
- `npm run test:curated`
- `npm run build`
- `git diff --check`

## Próximo Passo

O próximo refinamento musical deve atacar as famílias parcialmente contempladas no Almada:

- dominantes secundárias com densidade mais próxima do exemplo;
- diminutos de passagem com baixo dirigido;
- cadência plagal menor com cromatismo preparatório mais rico.
