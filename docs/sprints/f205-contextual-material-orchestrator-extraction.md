# F205 - Extração do orquestrador de materiais contextuais

## Objetivo

Fechar a separação conceitual entre o modelo antigo de "escala compatível" e o modelo novo de "materiais do acorde".

Até aqui, a maior parte do vocabulário já havia sido separada em módulos próprios:

- tipos canônicos de material;
- leitura funcional;
- vocabulário melódico;
- ranking;
- apresentação.

Mas o orquestrador principal ainda morava em `contextualScaleCandidates.ts`, e `contextualMaterialCandidates.ts` era apenas uma fachada. Isso mantinha o centro do sistema semanticamente preso ao vocabulário antigo.

## Mudança

`contextualMaterialCandidates.ts` passou a ser o dono real de `buildContextualMaterialCandidates`.

Ele agora coordena:

- resolução da cifra;
- escolha das fontes de material;
- leitura funcional do acorde;
- notas-guia e tendências de resolução;
- cobertura melódica;
- materiais melódicos praticáveis;
- ranking;
- textos de apresentação.

`contextualScaleCandidates.ts` foi reduzido a um adaptador de compatibilidade:

- preserva `buildContextualScaleCandidates`;
- preserva os tipos antigos;
- delega tudo para `buildContextualMaterialCandidates`.

## Por que isso importa

Essa mudança coloca o sistema no caminho que estamos definindo teoricamente:

- a UI deve entregar material útil ao compositor/arranjador;
- "escala" é uma fonte possível, não a resposta final;
- o motor pode sugerir arpejos, fragmentos, aproximações, notas-guia e vocabulário funcional sem depender de uma leitura meramente escalar;
- o módulo Escrever e o módulo Harmonizar passam a compartilhar a mesma inteligência musical.

## Estado após a sprint

O núcleo material-first já tem uma API própria e canônica:

```ts
buildContextualMaterialCandidates(context)
```

A API antiga segue viva apenas para compatibilidade:

```ts
buildContextualScaleCandidates(context)
```

Próximo refinamento natural: reduzir as chamadas antigas nos testes e telas restantes, deixando `contextualScaleCandidates.ts` como uma camada cada vez menos usada.
