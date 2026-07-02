# F30.1 — Idiomas no Catálogo de Substituições

## Objetivo

Separar substituições por idioma harmônico.

A F30 criou uma tabela inicial de substituições por função. A F30.1 adiciona o eixo de idioma, para evitar que uma regra de maior funcional seja aplicada automaticamente a menor, modal ou blues.

## Tese

A função harmônica depende do idioma.

Um acorde que é substituição segura em maior funcional pode ser inadequado em menor tonal, modal ou blues. Por isso, o catálogo precisa responder duas perguntas:

```text
Qual função está sendo preservada?
Em qual idioma essa substituição vale?
```

## Escopo Implementado

### 1. Tipo de idioma

Foi adicionado:

```ts
type FunctionalSubstitutionIdiom =
  | "major-functional"
  | "minor-functional"
  | "modal"
  | "blues";
```

### 2. Maior funcional como padrão

As chamadas existentes continuam usando `major-functional` por padrão.

Isso preserva o comportamento atual do gerador de substituições controladas.

### 3. Menor funcional catalogado

Entradas iniciais em menor:

| Função | Template | Exemplo em A menor | Sentido |
| --- | --- | --- | --- |
| T | `bIII` | `C` | relativo maior prolonga repouso menor |
| PD | `iiø` | `Bm7(b5)` | preparação meio-diminuta |
| D | `V7b13` | `E7b13` | dominante alterada em menor |

Essas entradas já existem no catálogo, mas ainda não são ativadas automaticamente no gerador.

### 4. Modal e blues declarados, mas vazios

`modal` e `blues` já existem como idiomas possíveis, mas retornam lista vazia.

Essa decisão é intencional: esses idiomas precisam de gramática própria, não de reaproveitamento apressado das regras tonais.

## Critérios de Aceitação

- O catálogo filtra substituições por idioma.
- `major-functional` continua sendo o padrão.
- `minor-functional` materializa bIII, iiø e V7b13.
- `modal` e `blues` existem como idiomas, mas ainda não oferecem substituições.
- A substituição controlada continua com comportamento anterior por padrão.

## Fora de Escopo

- Ativar menor automaticamente.
- Detectar idioma da frase.
- Modelar modal e blues.
- Validar função menor completa no classificador funcional.
- Resolver equivalência enharmônica.

## Próximo Passo

A F30.2 deve escolher entre dois caminhos:

1. ativar menor funcional no validador/classificador;
2. criar detector de idioma para impedir que regras tonais sejam aplicadas em frases modais ou blues.

O caminho mais seguro é ativar menor primeiro, porque já temos iiø-V-i em outras partes do sistema.
