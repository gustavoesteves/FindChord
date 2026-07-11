# F125 - Foco pratico nas leituras locais de improviso

## Problema

A F124 separou leituras regionais de leituras locais. Faltava melhorar a
explicacao das leituras locais: em dominantes, SubV e tensoes, o usuario precisa
entender o que fazer com a escala, nao apenas qual escala aparece.

## Decisao

Cada candidata contextual passa a carregar `practiceHint`, uma frase curta
gerada pelo motor.

Exemplos de foco pratico:

- dominante com alvo: explorar tensoes e conduzir para o acorde de resolucao;
- tonica com nota de evitar sustentada: tratar a nota como passagem ou
  suspensao;
- subdominante/preparacao: construir movimento para a proxima tensao;
- repouso: valorizar notas do acorde.

## Efeito na UI

O painel `Ver leitura` mostra o foco pratico antes dos detalhes tecnicos de
tensoes, cobertura melodica e notas de evitar.

Isso deixa a leitura local mais musical: a tabela continua compacta, mas o
usuario consegue abrir uma celula e entender a direcao da improvisacao.

## Limite atual

O texto ainda e uma orientacao curta. Ele nao gera linhas melodicas nem
voice-leading melodico. O proximo refinamento pode ligar esse foco pratico a
notas-guia, aproximacoes cromaticas e resolucoes de terças/setimas.
