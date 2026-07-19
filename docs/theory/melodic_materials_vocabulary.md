# Vocabulário de materiais melódicos compatíveis

## Objetivo

Este documento define a evolução de `Escalas Compatíveis` para uma camada mais musical:

```text
acorde/contexto -> escala -> material praticável -> resolução
```

A ideia não é substituir escalas, mas evitar que elas apareçam como inventário abstrato. Para compositor, arranjador e improvisador, a pergunta útil é:

> O que este acorde sugere como material melódico tocável?

## Princípios

- A escala é fonte de notas; o material é uma forma de usar essas notas.
- O material deve caber no acorde e, quando houver contexto, apontar uma resolução.
- O `Escrever` pode mostrar materiais como exploração do acorde isolado.
- O `Harmonizar` deve promover materiais apenas quando há função, alvo ou melodia que sustentem a escolha.
- A UI deve mostrar células curtas, não explicações longas.

## Fontes por eixo

| Fonte | Contribuição para o sistema |
| --- | --- |
| Levine / Berklee | relação acorde-escala, tensões, menor melódica, diminuta, SubV e dominantes alteradas |
| Bert Ligon | linhas que conectam acordes, notas-guia, resolução de 3as e 7as |
| Hal Crook / Bergonzi | células praticáveis, padrões transportáveis e desenvolvimento motívico |
| Nelson Faria / Chediak / Turi Collura | aplicação brasileira, melodia popular, fraseado e uso prático |
| Almada | função harmônica, rearmonização, dominantes, SubV, diminutos e resolução |

## Contrato de dados

Cada material melódico deve carregar:

```ts
{
  label: string;
  source: "scale" | "guide-tones" | "arpeggio" | "chromatic-approach" | "pentatonic";
  sourceScale?: string;
  cells: string[];
  tensionProfile: string[];
  resolutionTargets: string[];
  practiceHint: string;
}
```

## Tabela inicial

| Contexto | Material | Células | Uso |
| --- | --- | --- | --- |
| V7 natural resolvendo | notas-guia + bebop dominant | `3->1`, `b7->3`, `b7-7-1` | frase interna com resolução clara |
| V7(b9/#9/#11/13) | diminuta H/W por arpejos simétricos | `1-#2-3-5` por terça menor | tensão dominante diminuta |
| V7alt | células da escala alterada | `b9/#9/b5/#5` para notas do alvo | dominante externa com resolução |
| SubV7 | lídio dominante + resolução cromática | `#11`, `b7->3`, raiz descendo semitom | substituição dominante |
| iiø-V-i | lócrio #2 + meio-diminuto | arpejo `1-b3-b5-b7` e sensível do V | preparação menor |
| dim7 de passagem | diminuta simétrica | arpejo dim7 + nota resolvendo por semitom | passagem/resolução |
| m7 modal | dórico/pentatônica + 6 | `1-b3-5-6`, pentatônica menor com 6 | cor modal sem excesso cromático |
| maj7/#11 | lídio / tríades superiores | `1-3-5-7`, tríade do II | repouso colorido |

## Primeira implementação

A primeira fatia deve entrar nos dominantes com escala `half-whole diminished`.

Para `A7`, a escala H/W contém:

```text
A Bb C C# Eb E F# G
```

O material inicial é o conjunto de quatro arpejos `1-#2-3-5` partindo das notas de `A°7`:

```text
A-C-C#-E
C-Eb-E-G
Eb-Gb-G-Bb
F#-A-Bb-C#
```

Uso no sistema:

- `Escrever`: material possível para dominante diminuta/alterada.
- `Harmonizar`: promover quando o acorde é dominante com tensão diminuta ou resolução funcional.

## Próximos passos

## Materiais implementados

### Dominante diminuta H/W

Status: implementado em F176.

Exemplo em `A7(b9) -> Dmaj7`:

```text
A-C-C#-E
C-Eb-E-G
Eb-Gb-G-Bb
F#-A-Bb-C#
```

### Dominante alterado

Status: implementado em F177.

Exemplo em `A7alt -> Dmaj7`:

```text
Bb-C-C#
D#-F-G
C#->D
G->F#
```

Exemplo em `A7alt -> Dm7`:

```text
Bb-C-C#
D#-F-G
C#->D
G->F
```

A diferença entre `G->F#` e `G->F` depende do acorde-alvo. Essa é a razão para o material alterado pertencer principalmente ao `Harmonizar`, onde existe contexto de resolução.

### SubV lídio dominante

Status: implementado em F178.

Exemplo em `Db7 -> Cmaj7`:

```text
Db-G-Cb
Db->C
F->E
Cb->C
```

O material só aparece como SubV quando a raiz do dominante substituto está um semitom acima do alvo. Assim, `G7 -> Cmaj7` pode ter `lydian dominant` como cor de tensão, mas não recebe o rótulo `SubV lídio dominante`.

### iiø lócrio #2

Status: implementado em F179.

Exemplo em `Bm7b5 -> E7(b13) -> Am`:

```text
B-D-F-A
C#-D-B
A->G#
D->C
```

O material usa o arpejo meio-diminuto, preserva a 9 natural do lócrio #2 e aponta resoluções para a dominante menor seguinte.

### Diminuto resolvido

Status: implementado em F181.

Exemplo em `G#dim7 -> Am`:

```text
G#-B-D-F
G#->A
B->C
F->E
```

O material trata o diminuto como acorde de passagem/resolução. A célula principal é o arpejo diminuto completo; quando há acorde-alvo, o sistema extrai conduções por semitom para notas reais do acorde seguinte.

### m7 dórico / 6

Status: implementado em F183.

Exemplo em `Dm7`:

```text
D-F-A-C
D-F-A-B
E-F-D
```

O material preserva o arpejo menor com 7 e acrescenta a 6 maior como cor dórica. É uma leitura útil para acordes menores estáveis ou predominantes sem transformar a escolha em linguagem de gênero.

### maj7 lídio / tríade do II

Status: implementado em F183.

Exemplo em `Cmaj7` com leitura lídia:

```text
C-E-G-B
D-F#-A
F#->G
```

O material usa a tríade do II grau para destacar 9, #11 e 13 sobre o acorde maior com sétima. A #11 aparece como cor, mas pode ser conduzida para a quinta quando a frase pedir repouso.

### dominante sus / pentatônica

Status: implementado em F183.

Exemplo em `G7sus4 -> G7`:

```text
G-C-D-F
A-C-D-G
C->B
```

O material trata a quarta como suspensão estrutural. Quando o acorde seguinte abre para a dominante, o sistema explicita a resolução local da quarta para a terça.

### dominante natural / bebop

Status: implementado em F186.

Exemplo em `G7 -> Cmaj7`:

```text
G-B-D-F
B->C
F->E
```

Exemplo em `G7` com leitura bebop:

```text
G-B-D-F
F-F#-G
B->C
F->E
```

O material trata dominantes comuns como vocabulário interno antes de recorrer a tensões externas. A leitura bebop acrescenta a passagem cromática `b7-7-1`.

### tons inteiros / aumentado

Status: implementado em F187.

Exemplo em `G7(#5)`:

```text
G-B-D#
G-A-B-D#
```

O material usa o arpejo aumentado e uma célula de tons inteiros como cor simétrica. Ele não força resolução funcional.

### menor-maior

Status: implementado em F187.

Exemplo em `AmM7`:

```text
A-C-E-G#
F#-G#-A
```

O material trata a sétima maior como sensível interna do acorde menor. A leitura melódica menor preserva a 6 maior; a harmônica menor preserva a b6.

### add9 maior / pentatônica

Status: implementado em F187.

Exemplo em `Bbadd9`:

```text
Bb-C-D-F
Bb-C-D-F-G
```

O material destaca a 9 como cor de repouso e usa a pentatônica maior para manter o acorde aberto, sem transformar o acorde em maj7.

### power chord / pentatônica

Status: implementado em F187.

Exemplo em `F#5`:

```text
F#-C#-G#
F#-G#-C#-D#
```

O material usa pentatônica aberta para não impor terça maior ou menor ao power chord.

## Uso no Escrever

Status: primeira ponte implementada em F180.

O `Escrever` passa a reaproveitar `melodicMaterials` quando o acorde isolado permite um material seguro. Nesse módulo, materiais aparecem como exploração local do acorde, sem prometer resolução funcional quando ela não existe.

Exemplos:

- `A7(b9)` pode mostrar arpejos diminutos H/W, mas sem alvo de resolução;
- `Bm7b5` pode mostrar `iiø lócrio #2`, mas sem afirmar uma cadência menor completa;
- `Dm7` pode mostrar material dórico com 6 maior;
- `Cmaj7` pode mostrar tríade superior lídia;
- `G7` pode mostrar arpejo dominante, notas-guia e passagem bebop;
- `G7(#5)`, `AmM7` e `Bbadd9` passam a ter materiais próprios;
- `F#5` pode mostrar pentatônica aberta sem definir modo;
- materiais como `SubV lídio dominante` continuam dependendo de alvo cromático e portanto aparecem principalmente no `Harmonizar`.

## Próximos passos

1. Refinar a UI para diferenciar material estável, material tensional e material com resolução obrigatória.
2. Reauditar lacunas restantes e decidir se vale adicionar materiais de acordes de sexta/6-9 e dominantes aumentados com alvo local.
3. Auditar o catálogo real para ver quais materiais aparecem com mais frequência nas músicas importadas.
