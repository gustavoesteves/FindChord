# F35 — Contrato de Diagnosticos Harmonicos

## Objetivo

Transformar diagnosticos de omissao em um contrato estruturado.

Antes, a UI recebia apenas uma lista de textos. Agora cada diagnostico carrega:

```text
id
source
category
message
visibleIn
```

Isso permite deduplicar mensagens, separar origem musical e controlar visibilidade por modo de ousadia.

## Decisao teorica

Diagnostico harmonico nao e apenas copy de interface. Ele faz parte da explicabilidade do sistema.

Origem:

```text
generation   -> algo surgiu ou foi omitido durante a geracao
reference    -> a partitura original orientou a leitura
presentation -> a ordenacao/apresentacao alterou o papel da proposta
```

Categoria inicial:

```text
omission      -> uma leitura foi evitada
comparison    -> uma proposta ficou como comparacao
compatibility -> algo falhou por cobertura, condução ou encaixe
```

## Comportamento implementado

Os diagnosticos agora sao objetos `HarmonicDiagnostic`.

Exemplo:

```text
{
  id: "subv7-omitted-melody-coverage",
  source: "generation",
  category: "omission",
  message: "SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.",
  visibleIn: ["simple", "balanced", "exploratory"]
}
```

A UI continua exibindo apenas `message`, mas o pipeline preserva a semantica.

## Implementacao

Arquivo principal:

```text
src/utils/music/analysis/models/HarmonicDiagnostic.ts
```

Arquivos integrados:

```text
src/utils/music/analysis/engines/GravityFieldManager.ts
src/domains/harmonizer/hooks/useHarmonizerProposals.ts
src/domains/harmonizer/components/HarmonizerProposalList.tsx
```

Mudancas:

- `GravityProposalGenerationResult.omittedStrategyDiagnostics` agora retorna `HarmonicDiagnostic[]`;
- diagnosticos de referencia sao criados com `source: "reference"`;
- `diagnosticsForMode` filtra mensagens por modo simples/equilibrado/exploratorio;
- `dedupeDiagnostics` evita mensagens repetidas por `id`;
- a UI renderiza `diagnostic.message`.

## Testes

Coberto por:

```text
scripts/omitted-strategy-diagnostics.spec.ts
scripts/minor-modal-boundary.spec.ts
```

## Fora do escopo

- Criar severidade.
- Criar agrupamento visual por origem.
- Gerar diagnosticos para toda regra interna do motor.

## Proxima fatia

F35.1 usou esse contrato para melhorar a UI:

1. agrupar diagnosticos por `source`;
2. mostrar menos diagnosticos em modo simples;
3. permitir que modo exploratorio revele mensagens mais especulativas.

Ver:

```text
docs/f35-1-diagnostic-source-grouping.md
```
