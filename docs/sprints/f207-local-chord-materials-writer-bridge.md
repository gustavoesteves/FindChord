# F207 - Ponte local de materiais para o Escrever

## Objetivo

Criar uma camada própria para `Escrever > Materiais do acorde`, sem exigir que a tela chame diretamente o motor contextual do `Harmonizar`.

O `Escrever` trabalha com um acorde isolado desenhado pelo usuário. Ele pode reaproveitar a inteligência material-first, mas não deve fingir que possui:

- progressão anterior;
- acorde seguinte;
- centro tonal confiável;
- alvo de resolução.

## Mudança

Foi criado `localChordMaterials.ts`.

Ele expõe:

```ts
buildLocalChordMaterialReadings(chord)
```

Essa função:

- pega os mapas-fonte do acorde;
- chama o núcleo material-first com contexto local mínimo;
- associa cada fonte a seu candidato musical;
- ordena a lista priorizando materiais tocáveis antes de simples mapas escalares.

## Impacto na UI

`ScaleOverlayPanel` deixou de montar manualmente:

- mapas de escala-fonte;
- candidatos contextuais;
- índice por tipo;
- regra de prioridade.

A tela agora consome uma leitura local já pronta para renderização.

## Por que isso importa

Essa ponte deixa mais clara a diferença entre:

- `Harmonizar`: materiais condicionados por melodia, função e resolução;
- `Escrever`: materiais locais sugeridos por um acorde desenhado.

Os dois módulos continuam compartilhando inteligência, mas não misturam responsabilidades.
