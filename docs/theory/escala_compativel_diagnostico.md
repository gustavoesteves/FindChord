# Diagnostico - Escalas compativeis

## Escopo

Este documento avalia a funcionalidade `Escalas Compatíveis` da aba `Escrever`
e a compara com o mapa de improvisacao em `docs/theory/improvisação.md`.

O objetivo nao e aumentar a quantidade de escalas exibidas. E fazer com que a
escala sugerida responda a uma pergunta musical clara: **que papel este acorde
esta desempenhando, quais notas sao estaveis, quais tensoes sao possiveis e
como a linha deve conduzir para o proximo evento?**

## Como funciona hoje

O caminho atual e:

1. o `ChordCandidate` fornece `root` e `quality`;
2. `getCompatibleScales` escolhe uma lista fixa de nomes a partir da qualidade;
3. `TonalScale.get` materializa as notas;
4. a tela lista todas as escalas no mesmo nivel;
5. ao clicar, o braco mostra notas do campo e uma classificacao visual local.

As referencias principais sao:

- `src/utils/music/theory/musicTheory.ts`;
- `src/domains/writer/components/ScaleOverlayPanel.tsx`;
- `src/domains/writer/context/WriterContext.tsx`;
- `src/utils/music/constants/chordRegistry.ts`.

O sistema ja possui bons elementos de visualizacao: notas do acorde, tônica,
graus, tensoes, notas de evitar, alternancia entre nome da nota e grau, escuta
das notas e mapa no braço. O problema principal esta antes da visualizacao: a
inteligencia que escolhe e ordena as escalas ainda e rasa.

## Problemas confirmados

### 1. A lista e por qualidade, nao por contexto

O acorde dominante recebe uma lista fixa de Mixolídio, blues, bebop, Frígio
Dominante, alterada e Lídio Dominante. Isso mistura situações diferentes:

- dominante que resolve em maior;
- dominante que resolve em menor;
- dominante estática;
- dominante com #11;
- dominante alterada;
- dominante substituta ou cromática.

Sem o próximo acorde, a mesma escala pode ser uma escolha central, uma cor
alternativa ou uma opção inadequada. A interface hoje não diferencia essas
leituras.

### 2. Há um erro de cobertura para qualidades estendidas e alteradas

O ramo de dominantes reconhece apenas algumas qualidades (`dominant7th`,
`dominant9th`, `dominant11th`, `dominant13th` e `dominant7sus4`). Qualidades
como `dominant7b9` e `dominant7b13` caem no fallback geral e podem receber
`C major` e `C minor pentatonic` para um `C7(b9)` ou `C7(b13)`.

Esse comportamento e perigoso porque a lista parece valida, mas omite a
informacao que tornou a cifra alterada musicalmente relevante.

### 3. As escalas nao sao ranqueadas

Todas as opcoes sao apresentadas como igualmente compativeis. Nao ha:

- cobertura das notas estruturais do acorde;
- identificacao de tensoes disponiveis;
- identificacao de notas de evitar;
- relacao entre escala e alvo de resolucao;
- apoio das notas da melodia;
- indicacao de confianca ou motivo da escolha.

Isso transforma uma decisao musical em um inventario.

### 4. Algumas associacoes sao teoricamente largas demais

- `m7` recebe Dórico, Eólio, Frígio, pentatônica menor, blues e menor
  melódica sem saber se o acorde e tônico, predominante, modal ou parte de um
  ii-V.
- `m7(b5)` recebe meio-tom/tom diminuto, embora a escolha mais natural dependa
  do papel: Lócrio em contexto maior e Lócrio #2 em iiø de tonalidade menor.
- `dim7` recebe Lócrio, que não e a leitura padrão de um acorde diminuto de
  sétima; a escala diminuta tom-semitom e a candidata estrutural.
- a escala alterada aparece como opção geral para dominante, sem exigir tensão
  escrita, alvo funcional ou justificativa de resolução.

### 5. A classificação visual mistura conceitos

`ScaleOverlayPanel` classifica uma nota como nota do acorde antes de aplicar
algumas regras de nota característica. A classificação e útil como mapa visual,
mas ainda não e um contrato analítico de tensões: ela não informa se a nota e
uma extensão realmente disponível para aquela qualidade e contexto.

### 6. A camada pedagógica e expressiva, mas nao suficientemente precisa

Descrições como “impossível de soar errada”, “mood” e referências de estilo
funcionam como linguagem de inspiração, mas podem sugerir uma segurança maior
do que a teoria permite. Uma escala pode conter as notas do acorde e ainda
entrar em conflito com a resolução, a melodia ou o baixo.

## O que o documento de improvisacao acrescenta

`docs/theory/improvisação.md` e um mapa bibliografico, não uma tabela de
escala-acorde pronta. A contribuição mais importante para o produto e
metodológica:

- Mark Levine organiza a relação acorde-escala, tensões e funções;
- Bert Ligon desloca o foco para linhas que conectam acordes;
- Hal Crook e Turi Collura lembram que improvisação e construção melódica,
  ritmo e prática, não apenas seleção de escalas;
- Nelson Faria e Chediak aproximam a aplicação do repertório brasileiro;
- o texto recomenda começar por melodia, linhas, repertório e transcrição, e
  não por acumular mais escalas.

Portanto, a funcionalidade deve evoluir de **lista de escalas compatíveis** para
**orientação de escala, tensão e linha para o acorde no contexto atual**.

## Contrato teorico proposto

Cada sugestao deveria carregar, além de nome e notas:

- família da escala: diatônica, menor melódica, menor harmônica, diminuta,
  pentatônica ou blues;
- papel: base, cor modal, dominante alterada, aproximação ou passagem;
- função contextual: tônica, predominante, dominante, substituta ou modal;
- notas estruturais cobertas;
- tensões disponíveis;
- notas de evitar e motivo;
- alvo de resolução, quando houver;
- apoio ou conflito com a melodia;
- nível de confiança;
- explicação curta e musical.

Uma escala não deve aparecer apenas porque foi gerada pelo Tonal. Ela deve
aparecer porque sua coleção de notas e seu uso fazem sentido para aquele
acorde, naquele ponto da progressão.

## Ordem de decisão

O futuro motor pode seguir esta sequência:

1. interpretar a cifra com o resolvedor semântico, incluindo tensões,
   omissões, baixo e qualidade real;
2. verificar se existe melodia e quais notas ocupam posições fortes;
3. analisar o acorde anterior e o próximo, identificando ii-V-I, dominante
   secundária, SubV, acorde modal, passagem cromática ou pedal;
4. gerar candidatas por função e qualidade, não por uma lista única;
5. eliminar escalas que não cobrem a terça, a sétima ou a alteração escrita;
6. marcar tensões e notas de evitar a partir da relação com os chord tones;
7. ranquear pela compatibilidade estrutural, contexto, melodia e legibilidade;
8. mostrar uma opção principal e poucas alternativas justificadas.

## Primeira tabela de regras

| Situação | Principal | Alternativas condicionais |
| --- | --- | --- |
| Maior ou maj7 estável | Jônio | Lídio se #11/ambiente permitir; pentatônica como linguagem simples |
| Maior com #11 | Lídio | Jônio como leitura mais estável |
| m7 tônico modal | Dórico ou Eólio conforme o centro | Frígio se b2 for característica explícita |
| m7 em ii de ii-V | Dórico do centro maior | menor melódica somente se o contexto justificar cor específica |
| mMaj7 | Menor melódica | menor harmônica conforme a 7M e o contexto |
| V7 para acorde maior | Mixolídio | alterada, Lídio dominante ou diminuta conforme tensões e alvo |
| V7 para acorde menor | Mixolídio b9/b13 ou Frígio dominante | menor melódica alterada e diminuta conforme a cifra e a resolução |
| V7(b9), V7(b13), V7alt | candidata que explica a alteração | nunca cair no fallback de escala maior/pentatônica sem justificativa |
| iiø em tonalidade menor | Lócrio #2 | Lócrio se o contexto modal/maior justificar |
| m7(b5) sem contexto suficiente | Lócrio com confiança reduzida | pedir contexto ou apresentar as duas leituras claramente |
| dim7 de passagem | Diminuta tom-semitom | leitura simétrica contextual, não Lócrio por padrão |

Essa tabela e um ponto de partida para testes, não uma lista final de receitas.

## Plano de refinamento

### F114 - Corrigir o contrato de qualidade e cobertura

Criar testes para todas as qualidades registradas e eliminar o fallback
incorreto de dominantes alteradas, meio-diminutos e diminutos. **Concluido em
F114:** o registro explicito por qualidade e os testes focados ja estao no
motor.

### F115 - Criar o modelo de sugestao contextual

Separar escala candidata, tensões, avoid notes, função, alvo e justificativa.
Manter `getCompatibleScales` como adaptador temporário até a nova camada estar
validada.

### F116 - Ranqueamento por melodia e resolução

Usar as notas fortes do acorde e os eventos vizinhos para ordenar as opções.
Uma escala sem contexto pode continuar disponível, mas nunca deve aparecer como
equivalente a uma escolha sustentada pela resolução. **Concluído em F116:** o
ranqueamento passou a registrar cobertura melódica ponderada, chord tones,
suporte à resolução e penalidade de nota de evitar.

### F117 - Reorganização da interface

Exibir `Principal`, `Cores possíveis` e `Tensões de resolução`, com o mapa do
braço preservando a distinção entre chord tones, tensões e notas de evitar.

## Conclusao

A funcionalidade atual e um bom mapa visual de exploração, mas ainda não e um
orientador confiável de improvisação. O maior risco não é faltar uma escala: é
mostrar uma escala ampla demais, sem dizer por que ela serve, quando ela serve
e para onde a frase deve conduzir.

O caminho saudável é contextualizar primeiro, ranquear depois e só então
expandir o vocabulário. Isso preserva a filosofia do documento de improvisação:
melodia, linha, tensão e resolução antes de acumular nomes de escalas.

## Decisao de arquitetura: contexto pertence ao Harmonizar

A funcionalidade contextual de escala-acorde deve viver principalmente no
`Harmonizar`, porque ali o sistema pode conhecer:

- a melodia e suas notas estruturais;
- o acorde anterior e o seguinte;
- o centro tonal local e global;
- a função do acorde;
- a densidade e o ritmo harmônico;
- a referência escrita pelo compositor;
- a resolução esperada da tensão.

No `Escrever`, o usuário normalmente está examinando um acorde desenhado ou
selecionado no instrumento. Nesse ponto, o sistema não deve afirmar que uma
escala é a escolha correta para a frase inteira. O papel local do `Escrever` é
mais modesto e útil:

- mostrar o campo de notas do acorde;
- mapear chord tones, tensões e possíveis notas de evitar;
- permitir ouvir e visualizar a escala no braço;
- explorar uma sonoridade sem transformá-la em diagnóstico funcional.

Por isso, a aba pode futuramente trocar `Escalas Compatíveis` por um nome menos
absoluto, como `Mapa do acorde` ou `Escalas para explorar`. Ela continuaria
recebendo o mesmo motor de candidatas, mas sem prometer contexto que não possui.

O `Harmonizar` pode então exibir, por acorde ou por trecho, algo como:

- `Escala principal para esta resolução`;
- `Cor alternativa`;
- `Tensões sustentadas pela melodia`;
- `Notas a resolver na chegada`.

O motor de candidatas deve ser compartilhado entre as duas áreas. O que muda é
o contexto fornecido e o contrato de apresentação: o `Escrever` explora o
acorde isolado; o `Harmonizar` explica a escolha dentro da música.
