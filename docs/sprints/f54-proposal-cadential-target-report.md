# F54 — Alvo cadencial da proposta no relatorio real

## Objetivo

Separar no relatorio real duas ideias que podem divergir:

- centro escolhido para a frase;
- alvo cadencial da proposta primaria.

## Problema

Uma janela pode ter centro de referencia em `Eb`, mas a proposta primaria pode criar uma cadencia local para `A`.

Sem um campo proprio, o relatorio mistura essas leituras e parece contraditorio.

## Decisao

O relatorio passa a exibir, quando detectavel:

```text
- Alvo cadencial da proposta: A
```

Por enquanto, o alvo e inferido das explicacoes explicitas de cadencia local:

```text
cria uma cadência local para A
reconhece célula ii-V local em A
```

## Exemplo

```text
- Centro escolhido: Eb major
- Origem do centro: referencia harmonica da janela
- Alvo cadencial da proposta: A
- Proposta primaria: Estratégia — Gramática funcional ii-V
```

Essa leitura diz:

- a janela foi compreendida em `Eb`;
- a proposta criada dentro dela toniciza `A` localmente.

## Limite

Esta fase nao cria um modelo novo de alvo cadencial no contrato da proposta. Ela apenas torna o relatorio mais legivel a partir das evidencias ja existentes.

O proximo passo natural e promover `cadentialTarget` para campo estruturado da proposta, em vez de inferi-lo por texto.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/real-music-audit-report.spec.ts`
- `npm run report:real-music`
