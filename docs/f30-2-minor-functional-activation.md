# F30.2 — Ativação Explícita do Menor Funcional

## Objetivo

Permitir que a tabela `minor-functional` seja validada quando o idioma menor é pedido explicitamente.

A F30.1 catalogou substituições de menor, mas não as ativou. A F30.2 adiciona o primeiro contrato operacional: o classificador e o validador conseguem trabalhar em modo `minor-functional`.

## Tese

Menor funcional não deve ser tratado como maior funcional com acidentes. Ele tem funções próprias:

```text
T  -> i, bIII
PD -> iiø, iv
D  -> V7, vii°
```

Nesta fatia, ativamos o mínimo necessário para validar substituições da tabela:

```text
Am  -> C
Dm  -> Bm7(b5)
E7  -> E7b13
```

## Escopo Implementado

### 1. Classificação funcional por modo

Foi adicionado:

```ts
classifyFunctionInMode(chord, center, mode)
```

Modos atuais:

```ts
"major-functional"
"minor-functional"
```

O modo maior continua sendo o padrão de `classifyFunction`.

### 2. Validação de substituição em menor

`FunctionPreservingSubstitution` agora aceita:

```ts
classificationMode: "minor-functional"
```

Isso permite validar:

- `bIII` como repouso menor;
- `iiø` como predominante menor;
- `V7b13` como dominante menor.

### 3. Geração controlada explícita

`generateControlledSubstitutionProposals` também aceita idioma explícito.

O padrão continua:

```ts
"major-functional"
```

Ou seja, nada muda automaticamente para o usuário até existir detecção de idioma confiável.

## Fora de Escopo

- Detectar tonalidade menor automaticamente.
- Aplicar menor funcional em qualquer frase ambígua.
- Modelar menor melódico/harmônico em profundidade.
- Modal e blues.
- Equivalência enharmônica completa.

## Critérios de Aceitação

- `C` em A menor pode ser classificado como função T.
- `Bm7(b5)` em A menor pode ser classificado como função PD.
- `E7b13` em A menor pode ser classificado como função D.
- O validador aceita substituições minor-functional quando o modo é explícito.
- A geração controlada consegue usar o catálogo menor quando solicitada.
- O comportamento padrão continua maior funcional.

## Próximo Passo

A F30.3 deve decidir como inferir idioma.

Uma regra inicial segura:

- se a frase contém iiø-V-i ou V7b13-i, candidato forte a menor funcional;
- se a frase contém I7/IV7 sem resolução dominante, candidato a blues;
- se evita V-I e gira em torno de centro estável, candidato modal.

Essa inferência deve ser diagnóstica primeiro, antes de ligar geração automática.
