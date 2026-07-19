# F194 — Linguagem material-first no Harmonizar

## Objetivo

Aplicar o contrato composer-first ao painel de materiais do `Harmonizar`, removendo a hierarquia visual antiga em que a escala aparecia como resposta principal.

## Mudança

- O componente interno de leitura principal passou de `ScaleReading` para `MaterialReading`.
- A alternativa compacta passou de `AlternativeScaleReading` para `AlternativeMaterialReading`.
- A leitura principal agora mostra o material melódico no topo quando ele existe.
- A escala aparece como **Fonte**, deixando claro que é mapa/origem.
- A seção **Regiões de escala** passou a se chamar **Regiões de material**.

## Critério

O painel deve responder primeiro:

> Que material posso usar sobre esta harmonia?

Só depois ele informa de qual escala/mapa esse material vem.

## Próximo passo

Renomear gradualmente os modelos de serviço (`SectionScaleSuggestion`, `SectionScaleSuggestionSet`, `ContextualScaleCandidate`) quando a migração puder ser feita sem ampliar demais o risco.
