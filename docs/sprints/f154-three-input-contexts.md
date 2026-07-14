# F154 - Tres contextos de entrada do Harmonizar

## Ideia central

O Harmonizar nao tem apenas dois casos de uso. Existem tres contextos de entrada possiveis, e eles nao devem ser tratados como variacoes superficiais da mesma operacao.

```text
1. Melodia sem harmonia
2. Melodia com harmonia autoral
3. Harmonia autoral sem melodia
```

O contrato mais importante e este:

> Quando existe melodia, ela continua sendo a soberana. A harmonia autoral pode orientar, comparar e explicar, mas nao deve substituir a leitura melodica.

Este documento complementa `docs/sprints/f142-two-path-harmonizer-contract.md`. O F142 define os dois movimentos internos do motor: reducao regressiva ao fundamento e expansao progressiva em rearmonizacoes. O F154 define qual material musical chegou antes desses movimentos.

## Contexto 1 - Melodia sem harmonia

Pergunta musical:

```text
Que harmonia esta melodia permite?
```

Comportamento esperado:

- inferir centro, frase e alvo cadencial a partir da melodia;
- gerar primeiro um fundamento harmonico simples;
- aceitar que a primeira leitura pode ser I-IV-V, mas tambem pode precisar de `Melodia primeiro` quando I-IV-V nao cobre bem as notas estruturais;
- depois propor expansoes, dominantes secundarias, diminutos, SubV, mistura modal e cromatismos dirigidos.

Risco:

- inventar uma harmonia rica antes de garantir o chao funcional.

Regra:

```text
melodia -> fundamento -> alternativas progressivas
```

## Contexto 2 - Melodia com harmonia autoral

Pergunta musical:

```text
O que a harmonia autoral revela, e que outras leituras a melodia ainda permite?
```

Comportamento esperado:

- usar a melodia como foco principal;
- usar a harmonia autoral como referencia escrita, nao como gabarito;
- inferir centro, densidade, ritmo harmonico e regioes sugeridas pela harmonia da partitura;
- comparar propostas geradas com a referencia autoral;
- explicar convergencias e divergencias em linguagem musical.

O sistema pode aproveitar a harmonia autoral para:

- reconhecer centros locais que a melodia isolada nao declara;
- preservar ritmo harmonico caracteristico;
- detectar baixo estrutural, slash chords e movimento cromatico;
- entender quando a obra ja esta rearmonizada ou usa uma linguagem menos cadencial;
- propor variacoes sem apagar a solucao do compositor.

Risco:

- tratar a cifra escrita como resposta correta absoluta e, com isso, deixar de harmonizar a melodia.

Regra:

```text
melodia soberana + harmonia autoral como evidencia comparativa
```

## Contexto 3 - Harmonia autoral sem melodia

Pergunta musical:

```text
Como esta progressao funciona, e que transformacoes harmonicas ela permite?
```

Este contexto ainda nao e o Harmonizar no sentido estrito, porque falta a restricao melodica. Sem melodia, o sistema nao pode dizer se uma rearmonizacao sustenta a obra; ele pode apenas analisar e transformar a progressao.

Comportamento possivel:

- analisar centro, regioes, cadencias e funcoes;
- identificar dominantes secundarias, SubV, diminutos, emprestimos modais e funcoes aparentes;
- mapear baixo estrutural e densidade harmonica;
- reduzir a progressao a um fundamento funcional;
- sugerir variacoes por substituicao funcional, com aviso de que falta validacao melodica.

Risco:

- vender uma transformacao de progressao como se fosse harmonizacao completa.

Regra:

```text
sem melodia, o sistema analisa progressao e sugere variantes; nao valida compatibilidade melodica
```

## Modelo operacional sugerido

O motor deve carregar um `inputContext` explicito:

| Contexto | Melodia | Harmonia autoral | Operacao principal |
| --- | --- | --- | --- |
| `melody-only` | sim | nao | harmonizar a melodia |
| `melody-with-reference-harmony` | sim | sim | harmonizar a melodia com referencia comparativa |
| `harmony-only-analysis` | nao | sim | analisar e transformar progressao |

Essa distincao deve afetar principalmente:

- selecao de janela/frase;
- inferencia de centro;
- peso da harmonia autoral;
- nome e papel dos cards;
- explicacoes exibidas ao compositor;
- alertas quando uma proposta nao tem validacao melodica.

## Implicacoes para a UI

O compositor nao precisa ver nomes internos como `melody-only` ou `harmony-only-analysis`. A UI pode traduzir assim:

| Contexto interno | Linguagem para o compositor |
| --- | --- |
| `melody-only` | Criado a partir da melodia |
| `melody-with-reference-harmony` | Comparado com a harmonia da partitura |
| `harmony-only-analysis` | Analise da progressao |

No terceiro caso, a UI deve evitar prometer "harmonizacao". Termos melhores:

- leitura da progressao;
- reducao funcional;
- variacoes da progressao;
- substituicoes possiveis;
- analise do baixo e das cadencias.

## Proximo passo recomendado

Antes de implementar o terceiro contexto, o melhor proximo passo e consolidar o segundo:

```text
melodia com harmonia autoral
```

Motivo: este e o caso mais rico do nosso catalogo real. Ele permite comparar o que o motor gera com a partitura sem transformar a cifra do autor em gabarito absoluto. Tambem prepara o terreno para o terceiro contexto, porque muitas rotinas de analise harmonica da referencia serao reaproveitadas depois.

