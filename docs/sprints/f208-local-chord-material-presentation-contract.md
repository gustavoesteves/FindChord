# F208 - Contrato de apresentação dos materiais locais

## Objetivo

Reduzir o conhecimento musical embutido na UI de `Escrever > Materiais do acorde`.

Depois da criação de `buildLocalChordMaterialReadings`, a tela ainda calculava:

- qual material deveria aparecer como principal;
- quantos materiais adicionais existiam para a mesma fonte.

Essa decisão pertence à camada local de materiais, não ao componente.

## Mudança

`LocalChordMaterialReading` agora entrega:

```ts
primaryMaterial
extraMaterialCount
```

`ScaleOverlayPanel` passou a consumir esses campos diretamente.

## Por que isso importa

O componente fica mais próximo de uma camada de renderização:

- recebe leituras prontas;
- mostra fonte, células e contagem;
- não precisa conhecer a estrutura interna de ranking dos candidatos.

Isso deixa mais fácil evoluir o motor para materiais cada vez menos escalares sem reescrever a UI a cada mudança.
