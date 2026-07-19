# F196 — Painel contextual de materiais

## Objetivo

Remover mais um nome legado da UI do `Harmonizar`: o painel de improviso já era material-first, mas o componente ainda se chamava `ContextualScaleSuggestionsPanel`.

## Mudança

- `ContextualScaleSuggestionsPanel.tsx` foi renomeado para `ContextualMaterialSuggestionsPanel.tsx`.
- A interface de props passou de `ContextualScaleSuggestionsPanelProps` para `ContextualMaterialSuggestionsPanelProps`.
- `HarmonizerScreen` agora importa e renderiza `ContextualMaterialSuggestionsPanel`.

## Critério

O nome do componente deve refletir a função real:

> mostrar materiais, linhas e fontes contextuais para a harmonia selecionada.

## Próximo passo

Migrar gradualmente scripts/specs que ainda usam builders antigos com `Scale` no nome, preservando aliases enquanto houver dependência externa.
