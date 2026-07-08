# F33.2 — Migracao de Funcao Aparente e Conducao para o Resolvedor

## Objetivo

Continuar a retirada gradual de dependencias diretas do Tonal para leitura semantica de cifras.

A F33.1 migrou idioma, ii-V e baixo estrutural. A F33.2 migra:

- `ApparentFunctionAnalysis`;
- `VoiceLeadingTransitionEvaluator`;
- pontos internos de raiz/baixo/notas em `StrategyGuidedHarmonizer`.

## Migracoes feitas

### ApparentFunctionAnalysis

Agora usa `resolveChordSymbol` para reconhecer:

- `sus`, `7sus`, `9sus`, `13sus`;
- dominantes simples e alterados;
- `m6` e `m6/9`;
- diminutos por `dim`, `o`, `°`;
- meio-diminutos por `m7(b5)`, `m7b5`, `ø`.

Casos protegidos:

```text
G7sus -> G7alt
B° -> C7M
F#ø -> F7M
```

### VoiceLeadingTransitionEvaluator

Agora monta o conjunto de notas pelo resolvedor.

Isso evita zerar condução quando a cifra e valida musicalmente, mas nao era entendida pelo Tonal.

Casos protegidos:

```text
D-7 -> G7alt -> C7M
Bø -> E7(b13)
```

### StrategyGuidedHarmonizer

Agora usa helpers baseados no resolvedor para:

- raiz de acorde;
- baixo explicito ou raiz;
- pitch classes de acorde;
- bassLine de propostas geradas.

Com isso, grafias pedagogicas como:

```text
Bm7(b5)
```

podem permanecer na proposta sem prejudicar cobertura melodica ou baixo.

## Garantia tecnica

Nesta fatia, os arquivos abaixo deixaram de chamar diretamente:

```text
Chord.get
Chord.tokenize
```

Arquivos:

- `src/utils/music/analysis/strategies/ApparentFunctionAnalysis.ts`
- `src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator.ts`
- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`

## Fora do escopo

- Migrar todos os motores antigos fora da camada de estrategias.
- Resolver polychords.
- Exportar/importar MusicXML semantico.
- Criar preferencia de perfil de exibicao na UI.

## Testes

Coberto por:

- `scripts/apparent-function-analysis.spec.ts`
- `scripts/voice-leading-ranking.spec.ts`
- `scripts/minor-functional-strategy.spec.ts`
- `scripts/ii-v-functional-grammar.spec.ts`
- `scripts/chord-symbol-resolver.spec.ts`

Os testes verificam:

- `sus` e dominantes alterados;
- diminutos com simbolo `°`;
- meio-diminutos com `ø`;
- condução ii-V-I com `D-7`, `G7alt`, `C7M`;
- condução menor com `Bø -> E7(b13)`;
- preservacao de `Bm7(b5)` em proposta menor funcional.

## Proxima fatia

F33.3 ataca a compatibilidade de repertorio real:

1. extrair todas as cifras de `docs/musics`;
2. gerar um relatorio de resolucao por cifra;
3. transformar cifras nao resolvidas em novos casos do contrato;
4. so depois migrar engines antigas fora do Harmonizar.

Implementado em `docs/f33-3-real-music-chord-compatibility.md`.
