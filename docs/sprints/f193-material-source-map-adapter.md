# F193 — Adaptador de mapas de material

## Objetivo

Começar a tirar o sistema da linguagem antiga de “escalas compatíveis” sem quebrar os contratos existentes.

## Mudança

- Criado `MaterialSourceMap` como alias explícito para a escala usada como fonte/mapa.
- Criados os adaptadores:
  - `getMaterialSourceMapTypes`;
  - `getMaterialSourceMapsForQuality`;
  - `getMaterialSourceMaps`.
- `getCompatibleScaleTypes`, `getCompatibleScalesForQuality` e `getCompatibleScales` continuam existindo como compatibilidade.
- O painel **Materiais do acorde** passou a consumir `getMaterialSourceMaps`.
- O motor contextual passou a usar `getMaterialSourceMapsForQuality` como fonte inicial.

## Critério

A escala continua útil, mas agora o nome da API deixa claro que ela é:

- fonte de notas;
- mapa do braço;
- infraestrutura para materiais.

Ela não deve ser entendida como resposta final ao compositor.

## Próximo passo

Renomear gradualmente tipos e componentes que ainda carregam `Scale` no nome quando o comportamento real já for material-first.
