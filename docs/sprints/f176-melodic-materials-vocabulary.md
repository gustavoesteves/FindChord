# F176 - Materiais melodicos compativeis

## Objetivo

Iniciar a evolucao de `Escalas Compativeis` para uma camada de vocabulario praticavel:

```text
acorde/contexto -> escala -> celula melodica -> resolucao
```

O foco nao e listar mais escalas. E mostrar materiais que o compositor ou improvisador consiga usar.

## Base teorica

Foi criado o documento:

- `docs/theory/melodic_materials_vocabulary.md`

Ele organiza as fontes teoricas por funcao:

- Levine / Berklee: acorde-escala, tensoes, diminuta, alterada e SubV;
- Bert Ligon: linhas de notas-guia e conexao entre acordes;
- Crook / Bergonzi: celulas praticaveis e padroes transportaveis;
- Nelson Faria / Chediak / Turi Collura: aplicacao brasileira e fraseado;
- Almada: funcao harmonica, dominantes, SubV, diminutos e resolucao.

## Implementacao

`ContextualScaleCandidate` ganhou o campo:

```ts
melodicMaterials: ContextualMelodicMaterial[]
```

Cada material carrega:

- nome;
- fonte;
- escala de origem;
- celulas;
- perfil de tensao;
- alvos de resolucao;
- foco pratico.

## Primeira fatia

Dominantes com escala `half-whole diminished` agora recebem o material:

```text
Arpejos diminutos H/W
```

Para `A7(b9)` com resolucao em `D`, as celulas geradas sao:

```text
A-C-C#-E
C-Eb-E-G
Eb-Gb-G-Bb
F#-A-Bb-C#
```

A grafia `Gb -> G` preserva a formula da celula como aproximacao cromatica `b3 -> 3`. Em contexto de funcao sobre `A7`, `Gb` pode ser lido enarmonicamente como `F#`/13.

## UI

O painel de leituras contextuais no `Harmonizar` passa a mostrar:

```text
Materiais: Arpejos diminutos H/W: ...
```

Isso aparece dentro de `Ver leitura`, mantendo a tela principal limpa.

## Proximo passo

Expandir o mesmo contrato para:

- V7alt e celulas da escala alterada;
- SubV7 e lidio dominante;
- iiø-V-i e locrio #2;
- diminutos resolvidos;
- materiais modais simples para m7 e maj7/#11.

## Validacao

- `npm run test:curated -- scripts/contextual-scale-candidates.spec.ts`
- `npm run build`
