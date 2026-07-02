# F32.5 — Estrategia Menor Funcional Minima

## Objetivo

Gerar a primeira proposta menor controlada a partir das evidencias criadas na F32.4.

A ideia nao e criar um motor completo de tonalidade menor. Esta fatia cobre apenas um caso musical seguro:

- centro menor selecionado;
- melodia com cor menor clara;
- frase terminando na tonica;
- fechamento cadencial `V7 -> i`.

## Regra de ativacao

A estrategia aparece quando:

- o centro selecionado esta em modo menor;
- a melodia contem a tonica;
- a melodia contem alguma cor menor:
  - `bVI` ou `bVII`;
  - sensivel;
  - sexta maior;
- ha pelo menos quatro compassos;
- a ultima nota estrutural resolve na tonica.

## Harmonia gerada

A primeira versao usa uma paleta curta:

```text
i
i6
bVII
bVI
iiø
V7
```

O final da frase e reservado para:

```text
V7 -> i
```

Antes da cadencia, cada compasso escolhe o acorde da paleta que melhor cobre a melodia local.

## Exemplos

Em A menor natural/harmonico:

```text
Am -> G -> F -> E7 -> Am
```

Em A menor com cor melodica:

```text
Am6 -> Bm7b5 -> E7 -> Am
```

## Decisao de grafia

O acorde meio-diminuto e emitido como `m7b5`, nao `m7(b5)`, porque essa grafia e resolvida corretamente pelo parser harmonico usado na cobertura melodica.

Musicalmente, ele representa o mesmo `iiø`.

## Fora do escopo

- Harmonizacao menor sem cadencia final.
- Cadencia frigia.
- Napolitano.
- Sextas aumentadas.
- Subdominantes menores completas.
- Alternancia historica entre menor natural, harmonico e melodico como tres motores independentes.

## Testes

Coberto por:

- `scripts/minor-functional-strategy.spec.ts`
- `scripts/modal-center-strategy.spec.ts`
- `scripts/harmonic-idiom-classifier.spec.ts`

Os testes verificam:

- geracao de `Am -> G -> F -> E7 -> Am`;
- uso de `Am6` quando a melodia carrega sexta maior;
- uso de `Bm7b5` como preparacao menor;
- nao ativacao em melodia maior funcional comum;
- convivencia com a estrategia modal.

## Proxima fatia

F32.6 pode refinar a convivencia entre menor funcional e modal:

1. decidir quando `i-bVII-bVI` e campo menor natural funcional ou centro modal;
2. ranquear menor funcional contra modal quando ambas as propostas sao plausiveis;
3. explicar para o usuario a diferenca entre "menor com cadencia" e "centro modal".
