# F77 - Calibragem de cromatismo linear

## Objetivo

Atacar o bloco `Cromatico linear` da F71: `Crazeology`, `Detour ahead` e `E.S.P.`.

A pergunta desta sprint foi: quando a proposta primaria usa diminutos, dominantes e baixos cromaticos, o cromatismo esta conduzindo a frase ou apenas deixando a cifra mais complexa?

## Achado

O cromatismo nao era um problema unico.

- `Crazeology` tinha cromatismo com resolucao de guide tones.
- `Detour ahead` tinha cromatismo com forte acordo de raiz com a referencia.
- `E.S.P.` tinha uma proposta cromatica densa em slash chords, sem acordo de raiz e sem resolucao de guide tones.

Ou seja: a regra nao deveria rebaixar todo cromatismo, apenas o cromatismo denso que nao e confirmado nem por raiz nem por resolucao interna.

## Mudancas

- O ranking passou a armazenar `referenceFunctionAgreement` e `referenceRootAgreement`.
- Propostas cromaticas/radicais com slash denso, sem resolucao de guide tones e baixa coincidencia de raiz recebem `chromaticLegibilityPenalty`.
- A auditoria F77 mostra guide tones, tendencias sem resolucao, densidade de slash, penalidade de legibilidade e acordo de raiz no ranking.
- A regressao `chromatic-calibration.spec.ts` fixa os tres casos.

## Resultado por caso

### Crazeology

Mantem `Estratégia — Cromático Linear` como primaria.

Motivo: a proposta tem resolucoes de guide tones e funciona como conducao cromatica.

### Detour ahead

Mantem `Estratégia — Cromático Linear` como primaria.

Motivo: apesar da cifra densa, a proposta tem forte acordo de raiz com a referencia.

### E.S.P.

Rebaixa `Estratégia — Cromático Linear` para alternativa e promove `Estratégia — Tonal Clássico`.

Motivo: a proposta cromatica tinha slash denso, raiz divergente da referencia e nenhuma resolucao clara de guide tone.

## Artefatos

- `docs/reports/f77-chromatic-calibration-audit.md`
- `docs/reports/f77-chromatic-calibration-audit.csv`
- `scripts/audit-chromatic-calibration.ts`
- `scripts/chromatic-calibration.spec.ts`

## Proxima atencao

O proximo bloco natural e `Contraponto de baixo`: `Blueberry hill`, `Another Time` e `Eighty one`.

Ali a pergunta sera se as inversoes suavizam a progressao ou se escondem demais a funcao harmonica.
