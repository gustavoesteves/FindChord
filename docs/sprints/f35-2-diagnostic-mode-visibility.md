# F35.2 — Visibilidade de Diagnosticos por Modo

## Objetivo

Usar `visibleIn` para calibrar quais diagnosticos aparecem em cada modo:

```text
Simples
Equilibrado
Exploratório
```

O objetivo e reduzir ruido no modo simples e permitir que o modo exploratorio revele mais riscos harmonicos.

## Decisao teorica

Nem toda omissao tem o mesmo peso para todo usuario.

No modo simples, o sistema deve mostrar apenas diagnosticos que ajudam a entender a rota principal.

No modo equilibrado, o sistema pode mostrar omissoes relevantes para comparacao, como blues parcial e ii-V local sem cobertura suficiente.

No modo exploratorio, o sistema pode revelar diagnosticos de risco cromatico, como SubV7 omitido por incompatibilidade melodica.

## Comportamento implementado

### Visiveis em todos os modos

Diagnosticos centrais de fronteira menor/modal:

```text
Menor funcional omitido: a melodia não traz sensível nem sexta maior para sustentar cadência dominante.
Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
```

### Equilibrado e exploratorio

Diagnosticos de idioma/localidade:

```text
Blues funcional omitido: a melodia sugere cor blues parcial, mas não sustenta b3 e b7 como estrutura.
ii-V local omitido: a chegada em G não teve cobertura melódica suficiente para uma cadência local.
```

### Apenas exploratorio

Diagnostico cromatico:

```text
SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
```

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/engines/GravityFieldManager.ts
```

Contrato usado:

```text
src/utils/music/analysis/models/HarmonicDiagnostic.ts
```

Mudancas:

- blues parcial usa `visibleIn: ["balanced", "exploratory"]`;
- ii-V local omitido usa `visibleIn: ["balanced", "exploratory"]`;
- SubV7 omitido usa `visibleIn: ["exploratory"]`;
- menor/modal mantem visibilidade padrao em todos os modos.

## Testes

Coberto por:

```text
scripts/omitted-strategy-diagnostics.spec.ts
```

## Fora do escopo

- Criar preferencia persistente de usuario.
- Mostrar contador de diagnosticos ocultos.
- Adicionar severidade visual.

## Proxima fatia

F35.3 melhorou a UI do bloco de diagnosticos:

1. indicar o modo que ocultou ou revelou cada diagnostico;
2. permitir expandir diagnosticos avancados;
3. separar omissao, comparacao e compatibilidade visualmente.

Ver:

```text
docs/f35-3-diagnostic-category-labels.md
```
