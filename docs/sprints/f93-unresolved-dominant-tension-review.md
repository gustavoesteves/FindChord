# F93 - Fila de dominantes alteradas sem alvo local

## Objetivo

Transformar os casos restantes de dominante alterada sem alvo local em uma fila concreta de revisão.

Depois da F92, a quantidade de casos realmente sem alvo local caiu bastante. A F93 separa esses casos restantes por hipótese de escuta antes de qualquer novo ajuste no motor.

## Implementação

Foi criado o script:

- `scripts/audit-unresolved-dominant-tension.ts`

Ele gera:

- `docs/reports/f93-unresolved-dominant-tension-audit.md`
- `docs/reports/f93-unresolved-dominant-tension-audit.csv`

## Classes de revisão

- `terminal-dominant`: dominante alterada no fim da janela.
- `long-delayed-resolution`: o alvo aparece fora da janela curta.
- `chromatic-side-step`: a dominante escorrega cromaticamente para outro acorde.
- `possible-deceptive-color`: a chegada lembra região deceptiva, mas não entrou na regra curta.
- `unresolved-review`: sem alvo funcional claro na janela.

## Decisão

O motor não deve ampliar a janela de resolução cegamente.

A fila da F93 serve para escuta e revisão manual. Se muitos casos forem `long-delayed-resolution`, aumentamos a janela com cuidado. Se predominarem `unresolved-review`, mantemos a penalidade da F92. Se aparecerem muitos `chromatic-side-step`, precisamos de uma regra própria para encadeamento cromático de dominantes.

## Continuação F94

O maior grupo inicial da fila era `possible-deceptive-color`.

Esses casos apontavam para chegadas por terça em relação ao alvo esperado da dominante. A regra de resolução deceptiva foi então ampliada para aceitar regiões de terça do alvo (`bIII`, `III`, `bVI` e `VI`) como suporte contextual, mantendo fora os casos sem relação funcional clara.
