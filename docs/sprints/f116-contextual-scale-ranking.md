# F116 - Ranqueamento por melodia e resolucao

## Objetivo

Fazer a candidata contextual vencer por evidencia musical, e nao apenas pela
ordem fixa da lista de escalas compativeis.

## Evidencias do ranqueamento

Cada candidata agora registra:

- prioridade de compatibilidade da qualidade do acorde;
- apoio da melodia, ponderado pela duracao das notas;
- cobertura dos chord tones;
- suporte ao alvo de resolucao;
- penalidade por nota de evitar sustentada pela melodia.

Esses componentes ficam em `rankingEvidence`, enquanto `confidence` continua
sendo a sintese usada para ordenar as candidatas.

## Regras observaveis

- uma dominante que resolve ao centro recebe bonus quando a escala contem o
  alvo da chegada;
- uma escala que nao sustenta esse alvo recebe penalidade nesse contexto;
- notas longas pesam mais do que notas ornamentais curtas;
- uma nota de evitar sustentada reduz a confianca da candidata;
- a prioridade teorica da qualidade continua funcionando como regularizador,
  impedindo que uma coincidencia melodica isolada destrone qualquer leitura
  estrutural sem evidencia suficiente.

## Integracao

O `Harmonizar` ja recebe as candidatas por trecho pelo hook compartilhado. A
interface ainda sera ajustada no F117 para exibir os componentes em linguagem
musical, sem mostrar a formula numerica ao compositor.

## Verificacao

- 5 testes focados de candidatas contextuais aprovados;
- suite curada: 77 arquivos aprovados, 2 ignorados; 420 testes aprovados, 6
  ignorados;
- TypeScript e ESLint aprovados;
- `git diff --check` aprovado.
