# F35.1 — Agrupamento de Diagnosticos por Origem

## Objetivo

Usar o contrato `HarmonicDiagnostic` para organizar melhor as mensagens exibidas ao usuario.

Antes, a UI mostrava uma lista linear de leituras omitidas. Agora os diagnosticos sao agrupados por origem musical:

```text
Melodia
Referência
Apresentação
```

## Decisao teorica

A mesma frase de omissao pode ter pesos diferentes dependendo da origem.

- `generation`: a melodia ou a geracao nao sustentou a estrategia;
- `reference`: a harmonia original orientou outra leitura;
- `presentation`: a proposta existe, mas foi apresentada como comparacao ou exploracao.

Mostrar a origem ajuda o usuario a entender se a decisao veio da melodia, da partitura original ou da organizacao das alternativas.

## Comportamento implementado

Exemplo de bloco:

```text
Leituras omitidas

Melodia
SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.

Referência
Cadência dominante evitada: a referência favorece centro modal claro.
```

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/models/HarmonicDiagnostic.ts
src/domains/harmonizer/components/HarmonizerProposalList.tsx
```

Mudancas:

- criado `HarmonicDiagnosticGroup`;
- criado `groupDiagnosticsBySource`;
- a UI usa o agrupamento em ordem estavel: geracao, referencia, apresentacao;
- os rotulos visiveis sao musicais: `Melodia`, `Referência`, `Apresentação`.

## Testes

Coberto por:

```text
scripts/omitted-strategy-diagnostics.spec.ts
```

## Fora do escopo

- Criar icones ou estilos diferentes por origem.
- Permitir recolher/expandir grupos.
- Mudar a severidade das mensagens.

## Proxima fatia

F35.2 filtrou mais finamente por modo:

1. modo simples mostra menos diagnosticos especulativos;
2. modo exploratorio revela diagnosticos de risco;
3. modo equilibrado permanece como comportamento padrao.

Ver:

```text
docs/f35-2-diagnostic-mode-visibility.md
```
