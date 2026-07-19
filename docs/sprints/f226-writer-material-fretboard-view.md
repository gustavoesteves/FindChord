# F226 - View model do fretboard de materiais

## Objetivo

Remover do `ScaleOverlayPanel` a montagem das notas, cordas e geometria do fretboard de `Materiais do acorde`.

## Alterações

- Criado `writerMaterialFretboardView`.
- O painel passou a pedir um view model pronto e entregar esse modelo ao `FretboardRenderer`.
- Adicionados testes para geometria, cordas, rotulos, notas absolutas e destaque de notas caracteristicas.

## Resultado

`Materiais do acorde` agora separa melhor:

- escolha do material ativo e controles na UI;
- montagem musical/visual no serviço;
- desenho no renderer compartilhado.

Isso deixa a tela mais preparada para uma reorganizacao composicional mais profunda.
