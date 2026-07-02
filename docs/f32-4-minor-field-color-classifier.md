# F32.4 — Cores do Campo Menor no Classificador

## Objetivo

Aprofundar o reconhecimento de menor sem criar ainda um motor novo de harmonização.

A F32 ja distinguia `minor-functional` de maior, modal e blues. A F32.4 adiciona evidencias internas para separar tres fontes comuns de cor menor:

- menor natural;
- menor harmonico;
- menor melodico.

## Decisao teorica

O sistema continua retornando o idioma principal como:

```ts
minor-functional
```

As variantes natural, harmonica e melodica entram como evidencias, nao como idiomas separados.

Isso evita uma proliferacao prematura de motores. Em repertorio real, esses campos frequentemente convivem dentro da mesma frase: a harmonia pode usar `bVI`/`bVII`, em seguida `V7 -> i`, e ainda trazer `i6` ou outra cor de sexta maior.

## Evidencias novas

### Menor natural

Reconhecido quando a tonica menor aparece junto de `bVI` e/ou `bVII`.

Exemplo em A menor:

```text
Am -> G -> F -> E7 -> Am
```

Evidencia:

```text
menor natural aparece por bVI e bVII
```

### Menor harmonico

Reconhecido quando ha sensivel funcional:

- `V7 -> i`;
- ou diminuto sobre a sensivel.

Exemplo em A menor:

```text
E7 -> Am
G#dim -> Am
```

Evidencia:

```text
sensivel sustenta menor harmonico
```

### Menor melodico

Reconhecido quando a sexta maior aparece como cor dentro do campo menor.

Exemplo em A menor:

```text
Am6 -> Bm7(b5) -> E7 -> Am6
```

Evidencia:

```text
sexta maior sugere cor de menor melodico
```

## Fora do escopo

- Gerar progressao menor nova.
- Separar menor natural/harmonico/melodico como tres motores independentes.
- Modelar menor melodico ascendente/descendente como regra melodica completa.
- Criar tabela completa de subdominantes menores, napolitano e sexta aumentada.

## Testes

Coberto por:

- `scripts/harmonic-idiom-classifier.spec.ts`
- `scripts/reference-harmony-analysis.spec.ts`

Os testes verificam:

- menor funcional por tonica menor e dominante;
- bVI/bVII como evidencia de menor natural;
- sensivel funcional como evidencia de menor harmonico;
- sexta maior como evidencia de menor melodico;
- exposicao da evidencia pela analise de harmonia de referencia.

## Proxima fatia

F32.5 usa essas evidencias para gerar a primeira estrategia menor controlada:

1. harmonizacao menor natural simples quando a melodia pede `bVI`/`bVII`;
2. fechamento `V7 -> i` quando houver sensivel ou gesto cadencial;
3. uso restrito de `i6`/cor melodica apenas quando a melodia sustenta a sexta maior.

Implementado em `docs/f32-5-minor-functional-strategy.md`.
