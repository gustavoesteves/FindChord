# F250 - Componente de leitura do material ativo

## Objetivo

Separar a leitura lateral de Materiais do acorde do componente principal.

## Alteracoes

- Criado `WriterMaterialInsightPanel`.
- O painel concentra `Leitura rapida`, `Vocabulario util` e `Mapa de apoio`.
- `ScaleOverlayPanel` passa apenas o painel ativo e o estado de abertura do mapa de apoio.

## Resultado

O componente principal fica mais perto de uma camada de orquestracao. A leitura teorica/pratica do material passa a ter um ponto proprio para evoluir.
