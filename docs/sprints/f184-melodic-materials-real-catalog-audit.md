# F184 - Auditoria de materiais melodicos no catalogo real

## Objetivo

Medir como o vocabulário de materiais melódicos aparece nas cifras reais do catálogo e nas propostas primárias geradas pelo harmonizador.

## Artefatos

- `scripts/audit-melodic-materials.ts`
- `scripts/generate-melodic-materials-audit.ts`
- `scripts/melodic-materials-audit.spec.ts`
- `docs/reports/f184-melodic-materials-audit.md`
- `docs/reports/f184-melodic-materials-audit.csv`

## Resultado

- 199 arquivos analisados.
- 9.323 leituras analisadas.
- 7.431 leituras vieram da referência escrita.
- 1.892 leituras vieram da proposta primária gerada.
- 6.886 leituras têm material no candidato principal.
- 2.437 leituras têm material apenas em candidato secundário.
- Nenhuma leitura ficou sem material melódico.
- Nenhuma leitura ficou sem candidata de escala.

## Leitura musical

O vocabulário cobre uma parte grande do corpus em termos de disponibilidade, mas ainda há um problema claro de apresentação/ranking: muitos materiais aparecem apenas em candidatos secundários. Isso é especialmente visível em leituras lídias.

Após a F185, materiais de escala alterada ficaram restritos a cifras explicitamente alteradas. Isso reduziu bastante o ruído secundário. A F186 fechou a lacuna seguinte com vocabulário próprio para dominantes naturais/bebop. A F187 zerou a ausência bruta de materiais no corpus auditado.

As lacunas restantes deixam de ser ausência de material e passam a ser qualidade de promoção/apresentação: o que deve aparecer como leitura principal e o que deve ficar como alternativa.

## Próximo passo sugerido

Auditar materiais secundários: especialmente `dominante bebop / notas-guia`, `maj7 lídio / tríade do II` e `menor-maior harmônica`, para decidir quando devem subir ou permanecer como alternativa.
