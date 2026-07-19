# F181 - Materiais de diminuto resolvido

## Objetivo

Adicionar ao vocabulário funcional de improviso o caso de acordes diminutos resolvidos, evitando que a UI mostre apenas a escala diminuta como inventário abstrato.

## Implementação

- `whole-half diminished` passa a gerar o material `Diminuto resolvido`.
- A célula principal é o arpejo diminuto completo.
- Quando existe `nextChord`, o sistema procura resoluções por semitom para notas reais do acorde seguinte.
- O mesmo material também pode aparecer no `Escrever` em acordes isolados, mas sem alvo de resolução.

## Exemplo

`G#dim7 -> Am`

```text
G#-B-D-F
G#->A
B->C
F->E
```

## Critério musical

O diminuto resolvido é útil quando o acorde funciona como passagem ou aproximação cromática. A leitura mais importante para o compositor/arranjador não é apenas a escala disponível, mas a condução das notas do diminuto para o acorde-alvo.
