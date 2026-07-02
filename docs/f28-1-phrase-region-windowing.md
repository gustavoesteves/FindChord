# F28.1 — Frase, Região e Janela de Harmonização

## Objetivo

Formalizar a camada de frase antes de expandir o vocabulário cromático do Harmonizar.

A F28 introduziu condução de vozes como critério de ranqueamento. A F28.1 coloca um degrau anterior em ordem: o sistema precisa saber qual unidade musical está harmonizando antes de escolher substituições, dominantes auxiliares, SubV7 ou empréstimos.

## Tese

Harmonizar uma melodia inteira como se ela fosse uma unidade homogênea é musicalmente frágil. Uma parte A pode pedir repouso e confirmação tonal; uma parte B pode pedir resposta, abertura, subdominante, dominante local ou outro alvo de frase.

Por isso, a hierarquia prática fica:

1. detectar ou inferir a frase;
2. preservar as notas estruturais dessa frase;
3. escolher o centro e o alvo local;
4. gerar progressão funcional;
5. ranquear por condução de vozes;
6. explicar a decisão.

## Escopo Implementado

### 1. Origem da seção

`FormalSection` agora distingue se a unidade veio da partitura ou se foi inferida pelo sistema:

```ts
source: "score" | "inferred-phrase-window"
```

Isso evita tratar uma janela automática como se fosse uma seção formal declarada pelo compositor.

### 2. Janelas de frase inferidas

Quando a partitura não traz seções explícitas, o sistema continua criando blocos de 8 compassos:

```text
Parte A: compassos 1-8
Parte B: compassos 9-16
```

Agora esses blocos são nomeados internamente como janelas de frase inferidas.

### 3. UI

Quando todas as unidades disponíveis são inferidas, o seletor apresenta `Frases` em vez de `Seções`.

Essa pequena diferença importa: ela comunica ao músico que o sistema está propondo uma unidade de trabalho, não lendo uma marcação formal definitiva da partitura.

### 4. Diagnóstico de Asa Branca

A Parte B de Asa Branca virou caso de controle. A validação protege que a janela 9-16 seja lida como uma frase própria e que os compassos com F estrutural possam responder com subdominante, sem forçar a continuação do repouso da Parte A.

## Fora de Escopo

- Detector completo de forma musical.
- Segmentação por motivo, semifrase ou período.
- Resolver região funcional interna dentro da frase.
- SubV7 amplo.
- Empréstimo modal.
- Gramáticas modal/blues.

## Critérios de Aceitação

- Partituras com seções explícitas preservam `source: "score"`.
- Partituras sem seções geram janelas inferidas com `source: "inferred-phrase-window"`.
- Uma melodia de 16 compassos sem seções explícitas gera Parte A e Parte B de 8 compassos.
- O seletor usa linguagem de frase quando as unidades são inferidas.
- O diagnóstico de Asa Branca mantém a Parte B como janela própria.
- A suíte curada, build e lint continuam verdes.

## Próximo Passo

O próximo ciclo deve transformar a janela de frase em região funcional interna.

Perguntas para F28.2:

- Onde a frase estabelece repouso?
- Onde ela abre caminho para subdominante?
- Onde aparece preparação predominante?
- Onde há dominante ou meia-cadência?
- Qual é o alvo cadencial local?
- A frase termina fechada, suspensa ou em resposta?

Esse passo prepara o terreno para SubV7, ii-subV7 e empréstimos modais sem deixar que o cromatismo entre antes da leitura formal.
