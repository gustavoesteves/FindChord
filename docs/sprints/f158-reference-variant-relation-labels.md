# F158 - Etiquetas nas leituras proximas da referencia

## Objetivo

Completar a linguagem da F157 dentro das leituras agrupadas sob a harmonia da partitura.

Antes, o card da referencia ja dizia:

```text
Leituras próximas
Usar leitura
```

Agora cada leitura agrupada tambem pode mostrar sua relacao musical com a partitura:

```text
Próxima da harmonia da partitura
Varia a partitura mantendo função
```

## Decisao de produto

Uma leitura agrupada nao deve parecer uma variacao anonima. Ela precisa dizer rapidamente por que esta perto da cifra autoral.

Isso ajuda o compositor a diferenciar:

- uma simples coloracao/extensao da cifra;
- uma variacao funcional ainda ligada ao gesto do autor;
- uma alternativa mais independente que deve continuar como card proprio.

## Validacao

- `scripts/harmonization-proposal-card-labels.spec.ts` protege a linguagem das variantes agrupadas.
- `npm run build` passou.
