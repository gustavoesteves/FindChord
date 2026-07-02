# F30.3 — Inferência de Idioma para Substituições

## Objetivo

Escolher o idioma da tabela de substituições antes de gerar propostas.

A F30.2 permitiu usar `minor-functional` quando solicitado explicitamente. A F30.3 adiciona uma camada pequena de inferência para evitar dois erros:

1. aplicar substituições maiores em uma frase claramente menor;
2. tratar blues ou modal como maior funcional incompleto.

## Contrato

A inferência retorna:

- `idiom`: `major-functional`, `minor-functional`, `modal` ou `blues`;
- `confidence`: força da evidência;
- `evidence`: motivos musicais legíveis.

O idioma inferido é usado por `generateControlledSubstitutionProposals` quando o parâmetro de idioma está em `auto`.

## Regras iniciais

### Menor funcional

O sistema escolhe `minor-functional` quando encontra sinais fortes como:

- centro aparecendo como acorde menor;
- dominante maior resolvendo em tônica menor;
- `iiø` preparando dominante.

Exemplo em A menor:

```text
E7 -> Am -> Dm -> E7 -> Am
```

Esse percurso ativa a tabela menor e permite substituições como:

```text
Am -> C
```

desde que a melodia seja coberta e a função seja preservada.

### Blues

O sistema escolhe `blues` quando encontra `I7` e `IV7` como estabilidade local.

Nesta fatia, isso não gera substituições porque a tabela blues ainda está vazia. O ganho é defensivo: o sistema deixa de forçar uma leitura maior funcional sobre uma gramática que não depende de dominante resolvida.

### Modal

O sistema escolhe `modal` quando encontra:

- centro recorrente;
- `bVII`;
- ausência de cadência dominante.

Também aqui a tabela modal permanece vazia. A inferência serve para preservar o idioma até que F32 modele substituições modais.

### Maior funcional

Sem sinais fortes de menor, blues ou modal, o sistema usa `major-functional`.

## Decisões importantes

- `functionalSubstitutionsFor` continua com padrão `major-functional`.
- A inferência automática entra na geração controlada, não no catálogo bruto.
- Modal e blues são reconhecidos, mas não inventam substituições.
- A classificação funcional menor continua mínima: suficiente para `bIII`, `iiø` e `V7b13`.

## Fora do escopo

- Inferência probabilística.
- Troca de idioma dentro da mesma frase.
- Modalismo avançado.
- Blues funcional completo.
- Menor natural, harmônico e melódico como três gramáticas separadas.

## Testes

Coberto por:

- `scripts/functional-substitution-idiom-inference.spec.ts`
- `scripts/controlled-substitution-proposals.spec.ts`

Os testes verificam:

- menor funcional por `V7 -> i`;
- menor funcional por `iiø -> V`;
- blues por `I7` e `IV7`;
- modal por centro recorrente, `bVII` e ausência de dominante;
- fallback para maior funcional;
- geração automática de substituição menor;
- bloqueio defensivo de substituições maiores sobre blues detectado.

## Próxima fronteira

A F31 pode avançar para distância e rotas:

- medir distância funcional entre acordes;
- escolher rotas de substituição por custo;
- comparar diatonismo, cromatismo e condução de vozes;
- permitir múltiplas alternativas sem perder explicabilidade.
