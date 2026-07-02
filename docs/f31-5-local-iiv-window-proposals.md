# F31.5 — Células ii-V Locais em Janelas Reais

## Objetivo

Fechar a lacuna encontrada ao rodar o motor nas músicas reais.

Em `Autumn Leaves`, o sistema já reconhecia células ii-V na harmonia de referência, mas a geração ainda pensava demais na seção inteira. A F31.5 adiciona uma ponte:

> reconhecer e propor pequenas células ii-V dentro de uma seção maior.

## Problema observado

A seção A de `Autumn Leaves` contém progressões locais como:

```text
Am7 -> D7 -> Gmaj7
F#m7(b5) -> B7(b13) -> Em6
```

A análise detectava essas células, mas a geração de propostas não as trazia como material local de harmonização.

## Implementação

Arquivo:

- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`

O harmonizador agora constrói propostas ii-V de duas formas:

1. cadência final da frase, comportamento que já existia;
2. janelas internas de três compassos, quando há centro local plausível.

## Restrição importante

A primeira tentativa usava a nota mais proeminente do terceiro compasso como tônica local. Em `Autumn Leaves`, isso gerou centros soltos como A maior e C# menor.

A versão final restringe centros internos a:

- centro selecionado;
- relativo maior/menor do centro selecionado.

O alvo cadencial da frase inteira continua reservado para a proposta de final de frase.

## Resultado em Autumn Leaves

Para a seção A, o sistema passa a gerar células locais em G maior:

```text
Am7 -> D7 -> Gmaj7
```

E deixa de gerar centros laterais inadequados como:

```text
Bm7 -> E7 -> Amaj7
```

## Testes

Coberto por:

- `scripts/autumn-leaves-diagnostic.spec.ts`
- `scripts/ii-v-functional-grammar.spec.ts`
- `scripts/palhaco-diagnostic.spec.ts`

Os testes verificam:

- `Autumn Leaves` detecta células ii-V reais na referência;
- a geração passa a oferecer `Am7 -> D7 -> Gmaj7`;
- a geração não oferece `Bm7 -> E7 -> Amaj7` para essa seção;
- `Palhaço` continua com janela inicial estável.

## Próxima fronteira

Com F31 consolidada em repertório real, F32 pode começar com mais segurança:

- modal sem dependência de V-I;
- blues com I7/IV7 como estabilidade;
- menor profundo além do iiø-V-i pontual.
