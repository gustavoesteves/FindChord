# F62 - Camadas de apresentacao das propostas

## Objetivo

Transformar a principal conclusao da F61 em contrato de produto: uma proposta nao deve ser lida apenas como `principal`, `alternativa` ou `comparacao`. Ela tambem precisa dizer em qual camada musical atua.

## Camadas

### Harmonia basica

Propostas que resolvem a melodia com vocabulário simples e baixo risco.

Uso esperado:

- primeira resposta para melodias tonais claras;
- controle contra excesso de substituicoes;
- ponto de partida antes da rearmonizacao.

### Centro de referencia

Propostas guiadas pela harmonia escrita ou por centro local forte inferido da referencia.

Uso esperado:

- separar centro local e centro global;
- preservar leitura autoral quando a referencia e forte;
- explicar por que a melodia-only pode apontar outro centro.

### Rearmonizacao

Propostas de vocabulário mais transformador, cromatico, controlado ou exploratorio.

Uso esperado:

- alternativas criativas;
- densidade harmonica maior;
- substituicoes e campos gerativos que nao devem substituir automaticamente a harmonia basica.

## Decisao importante

Cromatismo nao significa automaticamente rearmonizacao. Se o cromatismo esta a servico de um centro local de referencia, a proposta deve continuar na camada `centro de referencia`.

Por outro lado, propostas vindas de campos exploratorios, rearmonizacao controlada ou substituicoes funcionais continuam na camada `rearmonizacao`, mesmo quando usam o centro inferido da referencia como contexto.

## O que mudou

- `ReharmonizationProposal` ganhou `presentationLayer`.
- O planejador de apresentacao atribui uma camada independente de `presentationRole`.
- A UI passa a mostrar a camada como selo separado do papel da proposta.
- Os relatorios F39 e F61 exibem `Camada da proposta`.

## Resultado no conjunto F61

- `asa branca.musicxml`: harmonia basica.
- `Bright Size Life.musicxml`: centro de referencia.
- `afternoon in Paris.musicxml`: rearmonizacao, porque a proposta primaria vem do campo Tonal Classico.
- `Ain't misbehavin.musicxml`: centro de referencia.
- `Actual proof.musicxml`: centro de referencia.

## Proximo passo

Usar a camada para decidir o comportamento do modo "Harmonizar":

1. mostrar harmonia basica como resposta inicial quando ela existe;
2. mostrar centro de referencia como leitura autoral/contextual;
3. mostrar rearmonizacao como alternativa criativa, sem tomar o lugar da harmonia basica por padrao.
