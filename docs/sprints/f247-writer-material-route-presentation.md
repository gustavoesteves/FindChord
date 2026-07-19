# F247 - Presenter visual da rota de materiais

## Objetivo

Remover decisoes de apresentacao da rota de dentro do componente Materiais do acorde.

## Alteracoes

- `presentWriterMaterialRoute` centraliza a leitura de rota esparsa.
- O presenter devolve marcador, classes da lista e classes dos cards.
- A UI deixa de calcular `rota objetiva` diretamente.
- Os testes de rotas cobrem tanto a rota objetiva quanto a grade compacta.

## Resultado

A tela fica mais simples e a regra visual de curadoria por quantidade passa a ser testavel.
