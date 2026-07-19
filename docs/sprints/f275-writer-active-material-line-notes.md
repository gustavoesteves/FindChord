# F275 - Notas da linha ativa

## Objetivo

Evitar calculo duplicado da linha de estudo em `Materiais do acorde`.

## Alteracoes

- `buildWriterActiveMaterialPanel` calcula as notas da linha sugerida uma unica vez.
- `displayNotes` passa a ser derivado dessa mesma lista.

## Resultado

O painel ativo fica ligeiramente mais simples e evita divergencias futuras entre notas tocadas e notas exibidas.
