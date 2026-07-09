# F58 - Analise de cores de emprestimo modal

## Objetivo

Separar duas leituras que podem parecer iguais na cifra, mas nao sao iguais para o motor:

- `bVI` e `bVII` como cores emprestadas do modo paralelo em contexto maior.
- `bVI` e `bVII` como material de um centro modal ou menor real.

Essa distincao precisa existir antes de liberar novas geracoes de `bVI` e `bVII`, porque esses acordes podem enriquecer uma harmonizacao tonal ou podem indicar que a musica esta falando outra lingua.

## O que entrou

- Novo modulo `ModalBorrowingAnalysis`.
- Reconhecimento de `bVI` e `bVII` apenas quando o contexto esta em modo maior.
- Rejeicao explicita quando o idioma ja foi classificado como `modal` ou `minor-functional`.
- Funcao implicada inicial como `PD`, tratando esses acordes como cores de subdominante/subdominante menor, nao como troca automatica de centro.
- Auditoria das referencias reais na janela harmonizada, reportando ocorrencias de `bVI`/`bVII` sem alterar o ranking das propostas.

## Contrato atual

Em `C maior`:

- `Ab`, `Abmaj7`, `Ab6` podem ser lidos como `bVI` emprestado do paralelo menor.
- `Bb`, `Bb7`, `Bbmaj7` podem ser lidos como `bVII` emprestado do paralelo menor.
- `G` em `A menor`, ou `C` em um giro modal de `D`, nao deve virar emprestimo modal tonal por acidente.

## Por que isso importa

Na harmonizacao, esse passo cria uma camada intermediaria entre:

1. harmonia basica diatonica;
2. cores funcionais ja controladas, como iv menor;
3. rearmonizacoes mais cromaticas.

O sistema agora pode reconhecer a cor antes de gerar a cor. Isso reduz o risco de tratar repertorio modal, menor natural ou blues como simples "maior com acordes emprestados".

## Proximo passo

Usar essa analise em dois pontos:

- Rodar a auditoria real para observar em quais obras `bVI` e `bVII` aparecem como referencia.
- Geracao controlada de propostas com `bVII` e, depois, `bVI`, exigindo evidencia melodica ou contexto funcional antes de apresentar ao usuario.
