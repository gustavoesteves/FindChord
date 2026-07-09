# F98 - Triagem melodica das dominantes alteradas sem alvo local

## Contexto

Depois da F97, a fila F93 caiu para 8 casos `unresolved-review`.

Esses casos nao devem ser absorvidos por uma regra harmonica larga. Muitos podem envolver cromatismo real, erro de cifra, chegada lateral, pedal, blues, ou tensao expressiva sustentada pela melodia.

## Decisao

Criar a auditoria `scripts/audit-unresolved-dominant-melody.ts`.

A auditoria cruza cada dominante ainda `unresolved` com as notas melodicas que soam durante a duracao do acorde e mede:

- cobertura da propria dominante;
- cobertura do primeiro acorde lateral seguinte;
- presenca da raiz do alvo funcional esperado.

## Classes

- `melody-supports-dominant`: a melodia sustenta a dominante alterada.
- `melody-supports-side-arrival`: a melodia sustenta melhor a chegada lateral que o alvo esperado.
- `melody-ambiguous`: a melodia cabe na dominante e na chegada lateral.
- `melody-weak-evidence`: a melodia nao oferece suporte suficiente para liberar o caso.
- `no-melody-data`: nao ha notas importadas no trecho.

## Resultado no corpus

F98 analisou os 8 casos restantes:

- `melody-supports-dominant`: 3
- `melody-supports-side-arrival`: 2
- `melody-weak-evidence`: 2
- `melody-ambiguous`: 1

## Leitura musical

O resultado sugere que nem todo `unresolved-review` e erro ou dominante solta.

Alguns casos parecem tensoes expressivas sustentadas pela melodia; outros parecem chegada lateral real. A regra futura, se existir, deve ser mais especifica que "cromatismo lateral e valido".

## Proximo refinamento

O proximo passo saudavel e investigar os 2 `melody-supports-side-arrival` e o caso `melody-ambiguous`:

- se houver padrao recorrente de chegada por semitom/vizinhanca ao alvo;
- se a melodia confirma a chegada lateral como centro momentaneo;
- se a cifra do corpus parece confiavel naquele ponto.

Os 2 `melody-weak-evidence` devem continuar penalizados ate aparecer outra justificativa musical.
