# F60 - Auditoria em dois caminhos

## Objetivo

Separar duas perguntas que estavam misturadas:

1. O sistema consegue harmonizar a partir da melodia?
2. O sistema consegue entender a harmonia escrita na partitura?

Para isso, a auditoria das musicas reais agora roda dois caminhos:

- `melodia-only`: ignora cifras existentes e harmoniza apenas pela melodia e armadura.
- `referencia-aware`: usa a harmonia escrita como pista de centro, contexto e comparacao.

## O que mudou

- Cada obra harmonizada passa a registrar os dois caminhos.
- O relatorio mostra centro escolhido, proposta primaria e quantidade de propostas em cada caminho.
- O relatorio aponta divergencias entre caminhos: centro, proposta primaria e cifras.
- O resumo geral contabiliza quantas obras caem em cada leitura de divergencia.
- O resumo geral lista amostras de triagem por categoria para guiar a proxima investigacao, sem tratar o corpus atual como conclusao estatistica.
- O relatorio inclui uma triagem dedicada para obras em que a referencia muda o centro percebido, mostrando centro melodia-only, centro referencia-aware, proposta primaria e leitura do centro da referencia.
- Essa triagem dedicada agora atribui uma hipotese inicial: centro local da referencia, revisar centro inferido ou vocabulario melodia-only insuficiente.
- A divergencia ganhou uma leitura musical inicial:
  - caminhos alinhados;
  - a referencia destrava a harmonizacao;
  - a referencia muda o centro percebido;
  - mesmo centro, harmonizacao diferente.

## Por que isso importa

O caminho melodia-only testa o motor de harmonizacao.

O caminho referencia-aware testa a capacidade analitica do sistema diante da escolha do compositor.

Quando os dois divergem, isso nao e necessariamente erro: pode indicar que a harmonia real usa centro local, plano harmonico, emprestimo, baixo estrutural ou linguagem idiomatica que a melodia sozinha nao determina.

## Leitura inicial

O grupo mais importante para abrir manualmente e o de `referencia muda centro`. Ele mostra onde a melodia isolada leva a uma leitura tonal plausivel, mas a cifra escrita pelo autor aponta outro centro local ou outro plano harmonico. Esse grupo nao deve virar regra automatica de imediato: ele deve primeiro separar tres casos diferentes:

1. centro local autoral correto, que a melodia sozinha realmente nao determina;
2. erro de inferencia do centro a partir da referencia;
3. falta de vocabulario do caminho melodia-only para reconhecer linguagem modal, blues, planar ou cadencial nao diatonica.

A regra implementada nesta sprint e propositalmente conservadora:

1. se a referencia tem centro local ou centro principal com confianca media/forte, a hipotese inicial e centro local da referencia;
2. se a leitura da referencia e fraca ou inconsistente com o centro escolhido, a hipotese inicial e revisar centro inferido;
3. se a referencia aponta idioma nao funcional maior/menor, a hipotese inicial e vocabulario melodia-only insuficiente.

Essas hipoteses servem para escolher quais partituras abrir primeiro. Elas ainda nao devem alterar a geracao automaticamente sem escuta e validacao musical.

## Ajuste de centro local

A primeira passagem da triagem marcou `afternoon in Paris.musicxml` como caso de revisao do centro inferido. A investigacao mostrou que a geracao estava usando o centro da frase completa, mas a comparacao com a referencia inferia o centro local apenas a partir dos compassos exatos onde a proposta colocou cifras. Isso empobrecia a janela quando a proposta tinha baixa densidade harmonica.

O comparador agora infere o centro local da referencia a partir de todas as cifras dentro do intervalo da proposta. Com isso, propostas mais espacadas continuam sendo comparadas contra o contexto harmonico da frase, nao contra um subconjunto acidentalmente ralo.

## Proximo passo

Usar essa auditoria para classificar divergencias:

- divergencia saudavel por contexto autoral;
- falha de centro tonal;
- falha da harmonia fundamental;
- necessidade de vocabulario diatonico ampliado;
- necessidade de leitura modal, blues ou planar.
