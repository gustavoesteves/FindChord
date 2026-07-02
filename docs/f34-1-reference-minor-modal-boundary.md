# F34.1 — Referência Harmônica na Fronteira Menor/Modal

## Objetivo

Usar a harmonia ja escrita na partitura como evidencia para separar:

- menor funcional cadencial;
- centro modal/eolio sem dominante cadencial.

A melodia continua decidindo a geracao principal. A cifra de referencia entra como leitura do material existente e como explicacao para o usuario.

## Decisao teorica

Uma sequencia com `i`, `bVII` e `bVI` nao e automaticamente menor funcional. Ela pode ser apenas um centro modal.

A referencia passa a confirmar menor funcional quando encontra:

```text
V7 -> i
iiø -> V7 -> i
```

E passa a favorecer centro modal quando encontra:

```text
i -> bVII/bVI -> i
```

sem dominante cadencial para a tonica menor.

## Comportamento implementado

### Menor funcional por cadencia

```text
Am -> G -> F -> E7 -> Am
```

Evidencia:

```text
referência usa V7 -> i em menor
```

Explicacao:

```text
Fronteira menor/modal: referência confirma menor funcional por cadência
```

### Menor funcional por iiø-V-i

```text
Bm7(b5) -> E7(b13) -> Am6
```

Evidencias:

```text
referência usa V7 -> i em menor
referência usa iiø-V-i em menor
```

### Centro modal

```text
Dm -> C -> Bb -> C -> Dm
```

Evidencia:

```text
referência gira em i-bVII/bVI sem sensível cadencial
```

Explicacao:

```text
Fronteira menor/modal: referência favorece centro modal sem sensível
```

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis.ts
```

Mudancas:

- `ReferenceHarmonyAnalysis` agora retorna `minorModalBoundary`;
- a deteccao usa `ChordSymbolResolver`, nao comparacao textual de cifras;
- cadencias podem inferir a tonica pelo acorde de chegada;
- a explicacao aparece na proposta `Referência — Harmonia da partitura`.

## Testes

Coberto por:

```text
scripts/reference-harmony-analysis.spec.ts
scripts/minor-modal-boundary.spec.ts
scripts/harmonic-idiom-classifier.spec.ts
```

## Fora do escopo

- Usar a referencia para bloquear automaticamente todas as alternativas.
- Criar ranking entre modal e menor funcional quando ambos forem plausiveis.
- Nomear modos especificos, como eolio ou dorico.

## Proxima fatia

F34.2 transformou essa evidencia em apresentacao mais inteligente:

1. preservar mais fortemente a referencia quando ela for modal clara;
2. explicar por que uma alternativa menor funcional foi omitida;
3. comparar a proposta gerada com a harmonia original sem confundir "diferente" com "errado".

Ver:

```text
docs/f34-2-minor-modal-presentation-priority.md
```
