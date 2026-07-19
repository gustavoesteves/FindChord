# F304 - Materiais locais como vamp no Escrever

## Objetivo

Separar a premissa do `Escrever` da premissa do `Harmonizar`.

## Decisao

O `Escrever` nao tem contexto harmonico, nao sabe o proximo acorde, nao conhece centro tonal e nao deve inventar alvo de resolucao. A leitura correta e tratar o acorde desenhado como um vamp local: um campo de possibilidades melodicas sobre uma sonoridade fixa.

O `Harmonizar`, por outro lado, continua sendo o lugar de contexto: melodia, acorde anterior, proximo acorde, centro tonal e resolucao.

## Alteracoes

- Criado `localChordVampMaterials`.
- `buildLocalChordMaterialReadings` passa a usar candidatos locais de vamp, nao candidatos contextuais.
- Candidatos locais carregam:
  - mapa-fonte;
  - notas do acorde;
  - notas-guia;
  - intencao local;
  - materiais melodicos;
  - dica pratica;
  - confianca local estavel.
- Dominantes isolados passam a ser tratados como vamp, preservando materiais como:
  - dominante natural / notas-guia;
  - dominante bebop / notas-guia;
  - ii menor sobre dominante;
  - arpejos diminutos H/W quando a fonte permitir.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-active-material-panel.spec.ts scripts/contextual-material-candidate-behavior.spec.ts scripts/contextual-material-candidates.spec.ts`
- `npm run build`
