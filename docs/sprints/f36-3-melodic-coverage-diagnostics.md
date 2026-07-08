# F36.3 — Diagnosticos de Cobertura Melodica

## Objetivo

Expor a inteligencia de cobertura melodica como diagnostico musical.

F36.2 passou a reconhecer suspensao, aproximacao cromatica e passagem por grau conjunto. F36.3 transforma esses comportamentos em mensagens estruturadas para a UI.

## Problema

Sem diagnostico, a engine pode aceitar corretamente uma dissonancia resolvida, mas o usuario nao sabe por que isso nao foi tratado como erro.

Tambem pode haver o caso inverso: uma nota estrutural fica descoberta e a proposta ainda passa por cobertura global suficiente. Nesse caso, o sistema precisa avisar musicalmente.

## Decisao teorica

Diagnostico de cobertura nao deve mostrar porcentagens como explicacao principal.

Ele deve dizer qual comportamento musical foi reconhecido:

```text
Suspensao resolvida
Aproximacao cromatica aceita
Passagem por grau conjunto aceita
Apoio melodico descoberto
```

Essas mensagens entram como `source: generation` e `category: compatibility`, porque nascem da compatibilidade entre melodia e harmonia.

## Comportamento implementado

A geracao agora analisa a primeira proposta musical aceita e emite diagnosticos quando encontra:

- apoio estrutural nao resolvido;
- suspensao/retardo resolvido;
- aproximacao cromatica;
- passagem por grau conjunto.

Visibilidade:

- apoio descoberto aparece em todos os modos;
- suspensao resolvida aparece em equilibrado e exploratorio;
- aproximacao cromatica e passagem por grau conjunto aparecem apenas no modo exploratorio.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/engines/GravityFieldManager.ts
src/utils/music/analysis/strategies/MelodicCoverage.ts
src/utils/music/analysis/models/HarmonicDiagnostic.ts
```

Mudancas:

- `MelodicCoverageEntry` passou a expor o papel melodico (`role`);
- `GravityFieldManager` gera diagnosticos de compatibilidade melodica;
- os diagnosticos reutilizam o contrato `HarmonicDiagnostic`;
- os testes validam suspensao resolvida e aproximacao cromatica exploratoria.

## Testes

Coberto por:

```text
scripts/omitted-strategy-diagnostics.spec.ts
scripts/melodic-anchor-classifier.spec.ts
scripts/harmonic-strategy-properties.spec.ts
```

## Fora do escopo

- Mostrar diagnosticos por acorde dentro do card.
- Destacar a nota exata na partitura.
- Diferenciar especies de suspensao.
- Calibrar texto por idioma harmonico.

## Seguimento implementado

F37 iniciou a camada de conducao de vozes como diagnostico/ranking local de propostas.

```text
docs/f37-voice-leading-diagnostics.md
```
