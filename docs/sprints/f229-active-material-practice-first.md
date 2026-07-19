# F229 - Material ativo orientado ao gesto

## Objetivo

Reposicionar a lateral direita de `Materiais do acorde` para priorizar a acao musical imediata.

## Alterações

- A frase de estudo passou a abrir a lateral como `Tocar agora`.
- O presenter `writerActiveMaterialPanel` passou a entregar `displayNotes`, evitando formatacao de notas no JSX.
- A lista de materiais internos passou a ser `Vocabulário útil`.
- O antigo `Mapa teórico` virou `Mapa de apoio`, em posicao secundaria.

## Resultado

O painel ativo passa a guiar o compositor pelo gesto: primeiro tocar uma ideia, depois ver vocabulário relacionado, por fim consultar o mapa teorico.
