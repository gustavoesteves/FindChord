# F227 - Paleta composicional de materiais

## Objetivo

Comecar a reposicionar `Materiais do acorde` como ferramenta de criacao musical, nao como lista de escalas compativeis.

## Alterações

- Criado `writerMaterialPalette`, que transforma leituras teoricas em itens de paleta para a UI.
- Os cards passam a priorizar a ideia tocavel (`primaryMaterial`) como titulo.
- A escala/fonte fica como mapa secundario.
- A UI passa de `Materiais disponíveis` para `Ideias para tocar`.

## Resultado

A tela continua tecnicamente equivalente, mas a leitura fica mais orientada ao compositor: primeiro aparece o que pode virar frase, depois aparece o mapa teorico que sustenta a escolha.
