# F56 — Funcoes aparentes como contrato de substituicao

## Objetivo

Transformar a leitura de acordes de funcao aparente em um contrato mais explicito para comparacao, validacao e explicacao.

Esta sprint nasce da auditoria Masson F55: acordes como sus, diminutos, m6, Im(b6) e #IVm7(b5) nao devem ser aceitos por soarem sofisticados. Eles precisam declarar qual funcao preservam, qual estrutura implicam e em que contexto fazem sentido.

## Problema

Antes desta sprint, `ApparentFunctionAnalysis` ja conseguia dizer se um acorde aparente estava resolvido ou ambiguo, mas ainda falava pouco sobre o acorde real/subentendido.

Isso limitava duas leituras:

- o comparador podia saber que uma funcao foi preservada, mas nao explicar o mecanismo;
- a validacao de substituicao aceitava funcao aparente sem expor claramente "o que esta por tras" da cifra.

## Decisao

`ApparentFunctionAnalysis` passa a retornar dois campos estruturados:

```ts
apparentRole
impliedChordSymbols
```

`apparentRole` separa papeis que antes ficavam misturados no mesmo tipo:

- `SUS_DOMINANT`
- `SUS_SUBDOMINANT`
- `SUS_SUBDOMINANT_MINOR`
- `DIMINISHED_DOMINANT`
- `DIMINISHED_SUBDOMINANT`
- `DIMINISHED_CHROMATIC_DESCENDING`
- `MINOR_SIXTH_CONTEXTUAL`
- `IM_FLAT6_SUBDOMINANT`
- `SHARP_IV_PREDOMINANT`
- `AMBIGUOUS`

`impliedChordSymbols` guarda as cifras que explicam a funcao aparente.

Exemplos:

```text
Gsus4 antes de G7        -> Dm7/G
Gsus4 resolvendo em C    -> G7
Gsus(b9) antes de G7(b9) -> Dm7b5/G
Bdim resolvendo em C     -> G7(b9)
Cdim em C                -> F7
Dm6 antes de G7          -> Bm7b5 ou G7
Cm(b6) em C menor        -> Fm7 ou Abmaj7
F#m7(b5) em C            -> Fmaj7
```

## O que mudou

### Sus

O sus agora diferencia:

- dominante suspenso quando resolve por quarta ascendente;
- subdominante aparente quando antecede dominante;
- subdominante menor quando carrega b9 antes de dominante.

### Diminuto

O diminuto agora diferencia:

- dominante aparente quando resolve meio tom acima;
- cromatico descendente quando caminha meio tom abaixo;
- subdominante aparente quando aparece como Idim.

### m6

O m6 agora expõe seus acordes implicitos:

- Xm7(b5) a partir da sexta maior;
- X7 a partir da quarta justa.

Ele continua cauteloso: so conta como funcao clara quando o contexto aponta para o alvo. Isso evita transformar todo m6 em dominante automaticamente.

### Im(b6)

O Im(b6) passa a ser reconhecido como cor subdominante em menor, implicando IVm7 ou bVImaj7.

### #IVm7(b5)

O #IVm7(b5) passa a explicitar seu papel como predominante cromatico e a estrutura IVmaj7 implicita.

## Efeito na validacao

`FunctionPreservingSubstitution` agora inclui uma evidencia musical quando uma funcao aparente foi aceita:

```text
acorde aparente implica Fmaj7
```

Isso prepara o caminho para uma UI mais clara no "Por que funciona?" e para relatorios que diferenciem:

- divergencia real;
- substituicao funcional;
- cor cromatica aceitavel;
- funcao aparente sem contexto suficiente.

## Efeito na comparacao com referencia

`ReferenceHarmonyComparator` passa a carregar a leitura aparente em cada ponto comparado:

```ts
proposalApparentRole
referenceApparentRole
proposalImpliedChordSymbols
referenceImpliedChordSymbols
```

Quando a funcao comparada e preservada por um acorde aparente, a comparacao adiciona a causa:

```text
apparent-function-preserved
```

E a evidencia explica o mecanismo:

```text
Função aparente reconhecida na comparação: F#m7(b5) implica Fmaj7.
```

No corpus real atual, essa causa ainda nao apareceu automaticamente no relatorio regenerado. Isso e aceitavel: o teste sintetico garante o comportamento, mas o relatorio nao deve forcar funcao aparente quando a referencia nao oferece contexto suficiente.

## Efeito no ranking e nos diagnosticos de propostas

`VoiceLeadingProposalRanker` tambem passa a anotar propostas que contenham funcao aparente resolvida.

Quando uma proposta usa um acorde aparente com estrutura implicita clara, a explicacao recebe:

```text
Função aparente: F#m7(b5) implica Fmaj7
```

E o diagnostico recebe:

```text
Função aparente resolvida: a cifra sugere uma estrutura funcional implícita no contexto.
```

Essa etapa ainda nao altera diretamente o peso do ranking. A decisao foi deliberada: primeiro explicamos e auditamos a funcao aparente; depois, se os relatorios reais confirmarem bom comportamento, podemos usar a leitura como bonus de ranking para substituicoes funcionais bem resolvidas.

## Efeito na geracao do Harmonizar

`StrategyGuidedHarmonizer` passa a gerar uma primeira proposta controlada de funcao aparente:

```text
IV -> #IVm7(b5)
V7sus4 -> V7
viidim -> I
iim6 -> V7
```

Essa proposta aparece como:

```text
Estratégia — Função aparente
kind: controlled-reharmonization
```

A regra e deliberadamente estreita:

- so atua em contexto maior;
- parte de uma expansao funcional diatonica ja aceita;
- procura um IV claro na harmonia-base para o caso `#IVm7(b5)`;
- procura uma dominante com preparacao predominante recente para o caso `V7sus4`;
- procura uma dominante cadencial resolvendo em I para o caso `viidim`;
- procura uma dominante seguinte para o caso `iim6` contextual;
- exige que a melodia do compasso seja integralmente coberta pelo substituto;
- valida a troca por `FunctionPreservingSubstitution`;
- altera apenas um ponto da harmonia, ou insere a funcao aparente diretamente antes da dominante.

Em C maior, por exemplo, a troca aceita e:

```text
F -> F#m7(b5)
```

A explicacao registra o mecanismo:

```text
acorde aparente implica Fmaj7
preserva função PD
```

Para o sus predominante, a leitura aceita e:

```text
G7sus4 antes de G7 -> Dm7/G
```

Com evidencia:

```text
acorde aparente implica Dm7/G
preserva função PD
```

Para o diminuto de sensivel, a leitura aceita e:

```text
Bdim antes de C -> G7(b9)
```

Com evidencia:

```text
acorde aparente implica G7(b9)
preserva função D
```

Para o `m6` contextual, a leitura aceita e:

```text
Dm6 antes de G7 -> Bm7b5 ou G7
```

Com evidencia:

```text
acorde aparente implica Bm7b5 ou G7
preserva função D
```

Isso transforma os casos Masson/Almada de `#IVm7(b5)`, sus predominante, diminuto funcional e `m6` contextual em propostas audiveis do motor sem ainda abrir uma geracao ampla de substituicoes cromaticas.

## Efeito no ranking com referencia

`VoiceLeadingProposalRanker` passa a aceitar harmonias de referencia como entrada opcional.

Quando a comparacao com a referencia esta alinhada e inclui a causa:

```text
apparent-function-preserved
```

a proposta recebe um bonus pequeno:

```text
apparentFunctionReferenceBonus: 0.15
```

E a explicacao recebe:

```text
Referência: confirma função aparente no mesmo contexto
```

Sem referencia, ou quando a referencia nao confirma a funcao aparente, o bonus permanece zero. A auditoria real atual nao acionou essa evidencia, o que indica que a regra ficou conservadora no corpus disponivel.

## Efeito na comparacao intra-compasso

`ReferenceHarmonyComparator` deixa de depender apenas do primeiro acorde da proposta em cada compasso.

Quando um compasso da proposta tem mais de um acorde, o comparador avalia os acordes internos contra a cifra de referencia do compasso e escolhe o melhor ponto comparavel, mantendo a metrica em um ponto por compasso.

Isso evita falsos divergentes em casos como:

```text
proposta:   G7sus4 / G7
referencia: G7
```

e:

```text
proposta:   Dm6 / G7
referencia: G7
```

Nesses casos, a comparacao pode reconhecer o `G7` interno como alinhado com a referencia, sem contar dois acertos dentro do mesmo compasso.

## Auditoria de cores funcionais

O relatorio real passa a registrar quantas propostas de funcao aparente apareceram e quantas ficaram como alternativas nao primarias.

No corpus atual:

```text
Obras com cores funcionais: 3
Cores funcionais geradas: 8
Cores funcionais como alternativas: 8
```

Exemplos observados:

```text
Bdim/F implica G7(b9)
Bdim7/Cb implica G7(b9)
Cdim7 implica F7
Dm6 implica Bm7b5 ou G7
F#m7(b5) implica Fmaj7
```

Leitura: as cores funcionais ja aparecem como camada de rearmonizacao, mas nao tomam a frente da harmonia primaria. Isso favorece expor esse material como camada/aba/filtro de "cores funcionais" em vez de misturar tudo na lista principal.

## Efeito na UI do Harmonizar

`HarmonizerProposalList` passa a separar propostas de funcao aparente em uma secao propria:

```text
Cores funcionais
```

A lista principal continua mostrando as harmonizacoes estruturais. As cores funcionais aparecem abaixo, agrupadas como camada de rearmonizacao, preservando a leitura observada na auditoria real: elas sao alternativas musicais, nao substitutas automaticas da harmonia basica.

Uma proposta entra nessa secao quando:

- tem nome `Estratégia — Função aparente`;
- ou traz explicacao `Função aparente: ...`;
- ou recebeu `apparentFunctionReferenceBonus`.

No modo recolhido, a lista mostra ate tres cores funcionais antes de depender de "Mostrar Mais Harmonizações".

## Limites

Esta sprint ainda nao cria:

- painel visual da tabela completa de substituicoes;
- detector modal completo;
- gramática blues;
- geracao ampla de todas as substituicoes Masson.

O passo foi intencionalmente menor: fortalecer o contrato antes de aumentar a quantidade de acordes gerados.

## Verificacao

- `npm exec vitest -- run scripts/apparent-function-strategy.spec.ts scripts/apparent-function-analysis.spec.ts scripts/function-preserving-substitution.spec.ts`
- `npm exec vitest -- run scripts/apparent-function-strategy.spec.ts scripts/apparent-function-analysis.spec.ts scripts/function-preserving-substitution.spec.ts scripts/voice-leading-ranking.spec.ts`
- `npm exec vitest -- run scripts/apparent-function-strategy.spec.ts scripts/apparent-function-analysis.spec.ts scripts/function-preserving-substitution.spec.ts scripts/voice-leading-ranking.spec.ts scripts/reference-harmony-comparator.spec.ts`
- `npm exec vitest -- run scripts/reference-harmony-comparator.spec.ts`
- `npm exec vitest -- run scripts/voice-leading-ranking.spec.ts scripts/reference-harmony-comparator.spec.ts`
- `npm exec vitest -- run scripts/apparent-function-analysis.spec.ts`
- `npm exec vitest -- run scripts/apparent-function-analysis.spec.ts scripts/function-preserving-substitution.spec.ts scripts/reference-harmony-comparator.spec.ts`
- `npm exec vitest -- run scripts/voice-leading-ranking.spec.ts`
- `npm run report:real-music`
- `npm run test:curated`
- `npm run build`
- `npm run lint`

## Proximo passo

Auditar no corpus real quando as funcoes aparentes aparecem como alternativas nao primarias, para decidir se a UI deve expor uma aba ou filtro de "cores funcionais" sem misturar isso com a harmonia basica.
