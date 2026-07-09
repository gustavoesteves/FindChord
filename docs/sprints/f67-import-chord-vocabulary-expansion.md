# F67 - Expansao do vocabulario de cifras importadas

## Objetivo

Reduzir falsos itens de revisao na auditoria do staging importado, aceitando cifras jazz comuns que apareceram no relatorio F66.

## Fonte

O backlog veio de `docs/reports/f66-import-split-audit-report.md`, especialmente da secao "Padroes de cifra fora do contrato".

## Cifras incorporadas

- Dominantes estendidas alteradas: `9(#11)`, `9(#5)`, `9(b5)`, `9(#9)`, `13(b9)`, `13(#11)`, `13(b9,#11)`.
- Menores com extensao explicita: `m7(9)`, `m7(11)`, `m6(9)`, `m13`.
- Menores com grau entre parenteses: `m(6)`, `m(7)`.
- Menor com nona adicionada: `m(add9)`.
- Suspensos importados com graus MusicXML: `sus4(7,13)`, `sus4(7,b9)`.
- Maior com quinta diminuta explicita: `(b5)`.
- Aumentado com setima: `aug7`.

## Resultado medido

Depois da expansao:

- candidatos tecnicos: 181 de 213;
- itens em revisao: 32 de 213;
- erros de parse: 0.

Antes desta expansao, a F66 apontava 144 candidatos e 69 itens em revisao.

## Limite deliberado

Alguns tokens continuam em revisao porque parecem marcacoes de partitura ou exportacoes ambivalentes, nao cifras confiaveis:

- `Break`;
- `pedal`;
- `r.fill`;
- `An`;
- `F*`;
- `Fft/C`;
- `Adi`.

Esses casos devem ser tratados em uma camada separada de limpeza/importacao, nao como acordes validos por enquanto.
