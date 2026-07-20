# F326 - Catalogo compartilhado em materiais contextuais

## Objetivo

Permitir que o `Harmonizar` consuma o catalogo curado de materiais locais sem acoplar a analise contextual a UI do `Escrever`.

## Alteracoes

- `buildContextualMaterialCandidates` passou a adaptar candidatos do `LOCAL_CHORD_VAMP_MATERIAL_CATALOG`.
- Os materiais curados entram na mesma fila contextual das leituras por escala/mapa.
- Cada material do catalogo preserva sua intencao (`inside`, `functional`, `tension`, `outside`) e ganha funcao harmonica, alvo de resolucao, cobertura melodica e ordenacao contextual.
- A prioridade inicial e conservadora: o catalogo enriquece a lista sem derrubar leituras-base ja calibradas.
- Adicionado teste garantindo que um dominante contextual recebe materiais como `dominant upper triad colors` e `dominant diminished axis`.

## Decisao

O `Escrever` continua tratando o acorde como vamp local. O `Harmonizar`, por outro lado, deve reaproveitar o mesmo vocabulario somente depois de passar pelo filtro de contexto: funcao, melodia, proximo acorde e alvo de resolucao.

Esse passo prepara o caminho para uma camada de improviso mais musical: a tela podera sugerir materiais por acorde/progressao sem duplicar catalogos nem transformar exemplos reais em regras particulares.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/contextual-material-candidates.spec.ts scripts/contextual-material-candidate-behavior.spec.ts scripts/local-chord-vamp-material-catalog.spec.ts`
