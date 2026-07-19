# F238 - Rota efetiva de materiais

## Objetivo

Evitar que `Materiais do acorde` abra uma rota vazia quando o acorde nao oferece itens naquela intencao.

## Alterações

- Criado `resolveWriterMaterialRoute`.
- A UI preserva a rota preferida, mas usa a primeira rota com conteudo quando a preferida esta vazia.

## Resultado

A tela fica mais robusta: sempre que houver alguma ideia disponivel, o compositor ve conteudo imediatamente.
