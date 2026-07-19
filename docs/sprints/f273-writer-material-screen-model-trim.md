# F273 - Enxugamento do modelo da tela

## Objetivo

Evitar que `ScaleOverlayPanel` dependa de estruturas internas da construcao dos materiais.

## Alteracoes

- `buildWriterMaterialScreenModel` deixa de expor `materialReadings`.
- A tela passa a usar `hasMaterials` para decidir entre conteudo e estado vazio.
- Teste do modelo foi atualizado para o contrato novo.

## Resultado

O componente recebe uma resposta mais direta e o processo de leitura dos materiais fica encapsulado no service.
