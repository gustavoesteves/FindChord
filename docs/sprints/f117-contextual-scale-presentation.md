# F117 - Apresentacao contextual de escalas

## Objetivo

Levar as candidatas contextuais para o `Harmonizar` sem transformar a tela em
um catalogo de escalas ou expor a pontuacao interna ao compositor.

## Interface

Foi adicionado o painel `Leituras de escala por contexto`, organizado por
acorde e compasso. Cada linha mostra:

- a escala principal;
- a funcao local em linguagem musical;
- o alvo de resolucao, quando existe;
- uma cor alternativa curta;
- uma leitura expandivel com tensoes, cobertura da melodia e notas de evitar.

O painel aparece antes das propostas de harmonizacao e reutiliza exatamente as
candidatas produzidas pelo hook contextual. Nao existe uma segunda regra de
ranqueamento na interface.

## Decisao de produto

O `Harmonizar` agora responde duas perguntas diferentes, sem mistura-las:

1. qual harmonia pode acompanhar o trecho;
2. que campo de notas explica o acorde dentro daquela resolucao.

O `Escrever` continua sendo o espaco de exploracao do acorde isolado.

## Verificacao

- TypeScript aprovado;
- ESLint dos arquivos da tela aprovado;
- suite curada: 77 arquivos aprovados, 2 ignorados; 420 testes aprovados, 6
  ignorados;
- build de producao aprovado, com o aviso ja conhecido de chunk principal acima
  de 500 kB;
- leitura contextual permanece recolhida por acorde para manter a progressao
  harmonica como foco principal.
