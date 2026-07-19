# F201 — Extração dos materiais melódicos contextuais

## Objetivo

Separar a geração de vocabulário melódico do antigo motor `contextualScaleCandidates.ts`.

## Mudança

- Criado `src/utils/music/theory/contextualMelodicMaterials.ts`.
- Movida para esse módulo a geração de materiais como:
  - arpejos diminutos H/W;
  - células da escala alterada;
  - dominante natural/bebop;
  - SubV lídio dominante;
  - iiø lócrio #2;
  - diminuto resolvido;
  - m7 dórico / 6;
  - maj7 lídio / tríade do II;
  - dominante sus / pentatônica;
  - tons inteiros / aumentado;
  - menor-maior melódica/harmônica;
  - add9 maior / pentatônica;
  - power chord / pentatônica.
- `contextualScaleCandidates.ts` agora chama `buildContextualMelodicMaterials`.
- Criada `scripts/contextual-melodic-materials.spec.ts`.
- A spec nova foi incluída em `vitest.curated.config.ts`.

## Critério

O motor contextual não deve misturar todas as responsabilidades:

- ele ainda interpreta contexto, função, melodia e ranking;
- o novo módulo fica responsável pelo vocabulário melódico tocável.

## Próximo passo

Extrair a leitura de função/contexto ou o ranking para módulos próprios.
