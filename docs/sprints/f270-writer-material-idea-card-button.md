# F270 - Cards de ideia como botoes

## Objetivo

Melhorar a semantica e a acessibilidade dos cards em `Materiais do acorde`.

## Alteracoes

- `WriterMaterialIdeaCard` passa de `div` clicavel para `button`.
- O card usa `type="button"` para evitar comportamento implicito de formulario.
- O estado ativo passa a ser exposto com `aria-pressed`.

## Resultado

Os cards continuam com a mesma aparencia, mas agora funcionam melhor como controles reais de navegacao musical.
