# F105 - Seletor interno de segmentos harmonizaveis

## Objetivo

Transformar a conclusao da F104 em uma peca reutilizavel do motor: um seletor de janelas harmonizaveis que consiga apontar a janela primaria, janelas com boa cobertura de cifra de referencia e janelas locais com eventos harmonicamente interessantes.

## Implementacao

- Adicionei `src/utils/music/analysis/strategies/PresentableWindowSelector.ts`.
- O seletor trabalha em cima de `MelodicAnchor[]`, sem depender de MusicXML, IO ou scripts.
- Ele devolve janelas com:
  - compassos cobertos;
  - ancoras melodicas;
  - razoes musicais (`primary-window`, `reference-coverage`, `interesting-event`);
  - cobertura de referencia;
  - eventos locais cobertos;
  - score de apresentacao.
- Atualizei `scripts/audit-presentable-windows.ts` para consumir o seletor de producao.
- Adicionei `scripts/presentable-window-selector.spec.ts` e inclui o teste na suite curada.

## Resultado

A auditoria F104 continuou estavel depois da extracao:

- Musicas analisadas: 7
- Janelas apresentaveis: 179
- Janelas destacadas: 47
- Janelas primarias: 7
- Janelas com evento F98: 32

Isso indica que o conceito foi movido para o motor sem mudar a observacao empirica que motivou a sprint.

## Leitura musical

O harmonizador agora tem uma representacao interna para algo que ja vinha aparecendo musicalmente: uma musica real nao precisa ser reduzida a uma unica janela global. A janela primaria continua existindo para a experiencia simples, mas o sistema passa a conseguir nomear trechos locais que merecem harmonizacao propria.

Esse passo e importante porque evita que eventos relevantes sejam tratados como falhas de vocabulario. Em varios casos, a F103 ja mostrou que o motor gera candidatos melhores quando recebe a janela certa. A F105 cria a estrutura para que essa escolha de janela deixe de ser apenas uma auditoria e passe a ser uma etapa do pipeline.

## Proximo passo sugerido

Integrar o seletor ao fluxo de harmonizacao apresentado ao usuario:

1. manter a proposta global como resultado principal;
2. calcular janelas locais apresentaveis em paralelo;
3. expor no maximo algumas janelas secundarias com linguagem musical simples;
4. permitir que o usuario harmonize um trecho sem perder a leitura global da musica.

O cuidado principal e nao transformar a interface em uma lista tecnica de janelas. O usuario deve enxergar algo como "trecho com cadencia local" ou "trecho com tensao dominante", nao `interesting-event`.
